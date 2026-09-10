"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Database, Json } from "@/lib/supabase/types";

type TestimonialFormRow = Database["public"]["Tables"]["testimonial_forms"]["Row"];
type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];

// ---- Forms ----

export async function createForm(
  projectId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    fields?: string[];
    questions?: Record<string, unknown>[];
    redirect_url?: string;
  },
) {
  const supabase = await createClient();
  const { data: form, error } = await supabase
    .from("testimonial_forms")
    .insert({
      project_id: projectId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      fields: data.fields ?? ["name", "email", "message", "rating"],
      questions: (data.questions ?? []) as unknown as Json,
      redirect_url: data.redirect_url ?? null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
  return form;
}

export async function updateForm(
  id: string,
  data: Partial<Pick<TestimonialFormRow, "name" | "slug" | "description" | "fields" | "questions" | "redirect_url" | "design" | "moderation">>,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonial_forms").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
}

export async function toggleFormStatus(id: string, status: "draft" | "published" | "archived") {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonial_forms").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
}

export async function deleteForm(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonial_forms").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
}

// ---- Testimonials ----

export async function createTestimonial(
  projectId: string,
  data: {
    name: string;
    email?: string;
    company?: string;
    role?: string;
    message: string;
    rating?: number;
    avatar_url?: string;
    form_id?: string;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").insert({
    project_id: projectId,
    form_id: data.form_id ?? null,
    name: data.name,
    email: data.email ?? null,
    company: data.company ?? null,
    role: data.role ?? null,
    message: data.message,
    rating: data.rating ?? 5,
    avatar_url: data.avatar_url ?? null,
    source: "manual",
    status: "approved",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
  revalidatePath("/product/[slug]", "page");
}

export async function approveTestimonial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").update({ status: "approved" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
  revalidatePath("/product/[slug]", "page");
}

export async function rejectTestimonial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").update({ status: "rejected" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
}

export async function featureTestimonial(id: string, featured: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").update({ is_featured: featured }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
  revalidatePath("/product/[slug]", "page");
}

export async function deleteTestimonial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
  revalidatePath("/product/[slug]", "page");
}

// ---- Invites ----

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendInvites(
  projectId: string,
  formId: string,
  emailsRaw: string,
): Promise<{ queued: number; invalid: string[]; duplicates: number }> {
  const supabase = await createClient();

  // RLS-protected ownership check: the form must belong to a project the user
  // can read. Everything after this runs with the admin client (email_queue
  // has no user policies).
  const { data: form } = await supabase
    .from("testimonial_forms")
    .select("id, name, slug, project_id, projects!inner(name, account_id)")
    .eq("id", formId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!form) throw new Error("Form not found");

  const emails = Array.from(
    new Set(
      emailsRaw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const valid = emails.filter((e) => EMAIL_RE.test(e));
  const invalid = emails.filter((e) => !EMAIL_RE.test(e));
  if (valid.length === 0) return { queued: 0, invalid, duplicates: 0 };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const admin = createAdminClient();

  const projectName = (form.projects as unknown as { name: string }).name;
  const accountId = (form.projects as unknown as { account_id: string }).account_id;

  // Sender name for the email copy: the project owner's profile name.
  const { data: account } = await admin
    .from("accounts")
    .select("owner_id")
    .eq("id", accountId)
    .maybeSingle();
  const { data: profile } = account?.owner_id
    ? await admin
        .from("profiles")
        .select("full_name")
        .eq("id", account.owner_id)
        .maybeSingle()
    : { data: null };

  // Count pre-existing invites among these emails (re-invites) for UX feedback.
  const { count: preExisting } = await admin
    .from("testimonial_invites")
    .select("*", { count: "exact", head: true })
    .eq("form_id", formId)
    .in("email", valid);

  // Upsert invites: re-inviting an existing email resets it to queued.
  const { data: invites, error: upsertError } = await admin
    .from("testimonial_invites")
    .upsert(
      valid.map((email) => ({
        form_id: formId,
        project_id: projectId,
        email,
        status: "queued" as const,
        sent_at: null,
        opened_at: null,
        submitted_at: null,
      })),
      { onConflict: "form_id,email" },
    )
    .select("id, email, token");
  if (upsertError) throw new Error(upsertError.message);

  const { error: queueError } = await admin.from("email_queue").insert(
    (invites ?? []).map((inv) => ({
      to_email: inv.email,
      subject: `¿Nos contás tu experiencia con ${projectName ?? "nuestro producto"}?`,
      template: "testimonial-invite",
      payload: {
        invite_id: inv.id,
        form_name: form.name,
        product_name: projectName,
        form_url: `${appUrl}/t/${form.slug}?i=${inv.token}`,
        sender_name: profile?.full_name ?? null,
      },
    })),
  );
  if (queueError) throw new Error(queueError.message);

  revalidatePath(`/dashboard/projects/${projectId}/testimonials/forms/${formId}/invites`);

  return { queued: invites?.length ?? 0, invalid, duplicates: preExisting ?? 0 };
}

export async function resendInvite(projectId: string, inviteId: string) {
  const supabase = await createClient();

  // Ownership check via RLS.
  const { data: invite } = await supabase
    .from("testimonial_invites")
    .select("id, email, token, status, form_id, project_id, testimonial_forms!inner(name, slug)")
    .eq("id", inviteId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!invite) throw new Error("Invite not found");

  const admin = createAdminClient();
  const { error: resetError } = await admin
    .from("testimonial_invites")
    .update({ status: "queued", sent_at: null })
    .eq("id", inviteId);
  if (resetError) throw new Error(resetError.message);

  const formMeta = invite.testimonial_forms as unknown as { name: string; slug: string };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { error: queueError } = await admin.from("email_queue").insert({
    to_email: invite.email,
    subject: `¿Nos contás tu experiencia?`,
    template: "testimonial-invite",
    payload: {
      invite_id: invite.id,
      form_name: formMeta.name,
      product_name: formMeta.name,
      form_url: `${appUrl}/t/${formMeta.slug}?i=${invite.token}`,
      sender_name: null,
    },
  });
  if (queueError) throw new Error(queueError.message);

  revalidatePath(`/dashboard/projects/${projectId}/testimonials/forms/${invite.form_id}/invites`);
}
