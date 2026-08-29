"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized");
  }
  return user;
}

type ActionState = { error?: string; success?: boolean } | null;

export async function approveClaim(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const adminUser = await requireAdmin();
  const claimId = formData.get("claim_id") as string | null;
  if (!claimId) return { error: "Missing claim_id" };

  const admin = createAdminClient();

  // 1. Load the claim and claimant's account in a single round-trip.
  const { data: claim, error: claimErr } = await admin
    .from("project_claims")
    .select("id, status, showcase_id, claimant_user_id, showcases(slug, name)")
    .eq("id", claimId)
    .maybeSingle();

  if (claimErr || !claim) return { error: "Claim not found" };
  if (claim.status !== "pending") {
    return { error: `Claim is already ${claim.status}` };
  }

  const { data: claimantAccount } = await admin
    .from("accounts")
    .select("id, owner_id")
    .eq("owner_id", claim.claimant_user_id)
    .maybeSingle();

  if (!claimantAccount) {
    return { error: "Claimant has no account. They may have been deleted." };
  }

  // 2. Transfer the project to the claimant's account.
  //    showcase.waitlist_id is the FK to projects.id (renamed in migration 010).
  const { error: projErr } = await admin
    .from("projects")
    .update({ account_id: claimantAccount.id })
    .eq("id", claim.showcase_id);

  if (projErr) return { error: `Failed to transfer project: ${projErr.message}` };

  // 3. Mark the claim approved.
  const { error: claimUpdErr } = await admin
    .from("project_claims")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      resolved_by: adminUser.id,
    })
    .eq("id", claimId);

  if (claimUpdErr) {
    return { error: `Claim update failed: ${claimUpdErr.message}` };
  }

  // 4. Look up claimant email for the notification.
  const { data: claimantProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", claim.claimant_user_id)
    .maybeSingle();

  if (claimantProfile?.email) {
    const showcase = claim.showcases as { slug: string; name: string } | null;
    await admin.from("email_queue").insert({
      to_email: claimantProfile.email,
      subject: `Your claim for ${showcase?.name ?? "a product"} was approved`,
      template: "claim-result",
      payload: {
        result: "approved",
        showcase_name: showcase?.name ?? "",
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard`,
      },
    });
  }

  revalidatePath("/admin/claims");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}

export async function rejectClaim(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const adminUser = await requireAdmin();
  const claimId = formData.get("claim_id") as string | null;
  if (!claimId) return { error: "Missing claim_id" };

  const reason = ((formData.get("reason") as string | null) ?? "").trim() || null;

  const admin = createAdminClient();

  const { data: claim, error: claimErr } = await admin
    .from("project_claims")
    .select("id, status, claimant_user_id, showcases(name)")
    .eq("id", claimId)
    .maybeSingle();

  if (claimErr || !claim) return { error: "Claim not found" };
  if (claim.status !== "pending") {
    return { error: `Claim is already ${claim.status}` };
  }

  const { error: updErr } = await admin
    .from("project_claims")
    .update({
      status: "rejected",
      rejected_reason: reason,
      resolved_at: new Date().toISOString(),
      resolved_by: adminUser.id,
    })
    .eq("id", claimId);

  if (updErr) return { error: updErr.message };

  const { data: claimantProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", claim.claimant_user_id)
    .maybeSingle();

  if (claimantProfile?.email) {
    const showcase = claim.showcases as { name: string } | null;
    await admin.from("email_queue").insert({
      to_email: claimantProfile.email,
      subject: `Update on your claim for ${showcase?.name ?? "a product"}`,
      template: "claim-result",
      payload: {
        result: "rejected",
        showcase_name: showcase?.name ?? "",
        reason,
      },
    });
  }

  revalidatePath("/admin/claims");
  return { success: true };
}
