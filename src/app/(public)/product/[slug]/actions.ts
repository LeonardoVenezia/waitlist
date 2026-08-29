"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getAdminEmails } from "@/lib/admin";

type CreateClaimState = { error?: string; success?: boolean } | null;

export async function createClaim(
  _prev: CreateClaimState,
  formData: FormData,
): Promise<CreateClaimState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to claim a project" };

  const showcaseId = formData.get("showcase_id") as string | null;
  if (!showcaseId) return { error: "Missing showcase id" };

  const { data: showcase, error: scErr } = await supabase
    .from("showcases")
    .select("id, name, slug, status, waitlist_id, claimable")
    .eq("id", showcaseId)
    .in("status", ["published", "coming_soon"])
    .maybeSingle();

  if (scErr || !showcase) return { error: "Product not available for claim" };
  if (!showcase.claimable) {
    return { error: "This product is not available for claim" };
  }

  // 1. Verify the user is not the current owner.
  const { data: project } = await supabase
    .from("projects")
    .select("account_id, accounts!inner(owner_id)")
    .eq("id", showcase.waitlist_id)
    .maybeSingle();

  if (!project) return { error: "Project not found" };

  const ownerId = (project as unknown as {
    accounts?: { owner_id?: string };
  }).accounts?.owner_id;
  if (ownerId && ownerId === user.id) {
    return { error: "You already own this project" };
  }

  // 2. Insert claim. The partial unique index on (showcase, user) WHERE
  // status IN ('pending','approved') blocks double claims.
  const rawMessage = (formData.get("message") as string | null)?.trim() ?? "";
  const message = rawMessage.length > 0 ? rawMessage : null;

  const { error: insErr } = await supabase.from("project_claims").insert({
    showcase_id: showcaseId,
    claimant_user_id: user.id,
    message,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return { error: "You already have an active claim for this product" };
    }
    return { error: insErr.message };
  }

  // 3. Notify the admin (queued, best-effort).
  const adminEmails = getAdminEmails();
  if (adminEmails.length > 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const admin = createAdminClient();
    await admin.from("email_queue").insert({
      to_email: adminEmails[0],
      subject: `New project claim: ${showcase.name}`,
      template: "admin-new-claim",
      payload: {
        showcase_id: showcaseId,
        showcase_slug: showcase.slug,
        showcase_name: showcase.name,
        claimant_user_id: user.id,
        claimant_email: user.email ?? "",
        claim_url: `${appUrl}/admin/claims`,
        message,
      },
    });
  }

  revalidatePath(`/product/${showcase.slug}`);
  return { success: true };
}
