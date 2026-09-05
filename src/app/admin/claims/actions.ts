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
type CreateProductState = { error?: string; success?: boolean; slug?: string } | null;

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

export async function setShowcaseClaimable(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const showcaseId = formData.get("showcase_id") as string | null;
  if (!showcaseId) return { error: "Missing showcase id" };

  const raw = formData.get("claimable");
  const claimable = raw === "true" || raw === "on";

  const admin = createAdminClient();
  const { error } = await admin
    .from("showcases")
    .update({ claimable })
    .eq("id", showcaseId);

  if (error) return { error: error.message };

  revalidatePath("/admin/claims");
  revalidatePath("/");
  revalidatePath("/product", "layout");
  return { success: true };
}

export async function createAdminProduct(
  _prev: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const adminUser = await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const rawSlug = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const link = ((formData.get("link") as string | null) ?? "").trim();
  const description = ((formData.get("description") as string | null) ?? "").trim();
  const category1 = (formData.get("category_1") as string | null) ?? "";
  const category2 = ((formData.get("category_2") as string | null) ?? "").trim() || null;
  const claimable = formData.get("claimable") !== null;

  if (!name || !slug || !description || !category1) {
    return { error: "Name, slug, description and category 1 are required." };
  }
  if (description.length < 200) {
    return { error: `Description must be at least 200 characters (${description.length}/200).` };
  }

  const admin = createAdminClient();

  // The admin account owns seeded products until a founder claims one, at
  // which point approveClaim transfers project.account_id to the founder.
  const { data: adminAccount } = await admin
    .from("accounts")
    .select("id")
    .eq("owner_id", adminUser.id)
    .maybeSingle();

  if (!adminAccount) {
    return { error: "Your admin account has no account row. Sign in once via the dashboard to create it." };
  }

  const { data: project, error: projErr } = await admin
    .from("projects")
    .insert({ account_id: adminAccount.id, name, slug })
    .select("id")
    .single();

  if (projErr) {
    if (projErr.code === "23505") return { error: "This slug is already taken." };
    return { error: projErr.message };
  }

  const { error: scErr } = await admin.from("showcases").insert({
    waitlist_id: project.id,
    name,
    slug,
    link,
    description,
    category_1: category1,
    category_2: category2,
    main_type: "image",
    status: "published",
    published_at: new Date().toISOString(),
    claimable,
  });

  if (scErr) {
    // Roll back the orphan project so a retry with a fixed slug works.
    await admin.from("projects").delete().eq("id", project.id);
    if (scErr.code === "23505") return { error: "This slug is already taken." };
    return { error: scErr.message };
  }

  revalidatePath("/admin/claims");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/product/${slug}`);
  return { success: true, slug };
}
