"use server";

import { createClient } from "@/lib/supabase/server";
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
  const { error } = await supabase.from("testimonial_forms").insert({
    project_id: projectId,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    fields: data.fields ?? ["name", "email", "message", "rating"],
    questions: (data.questions ?? []) as unknown as Json,
    redirect_url: data.redirect_url ?? null,
    status: "draft",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/testimonials", "layout");
}

export async function updateForm(
  id: string,
  data: Partial<Pick<TestimonialFormRow, "name" | "slug" | "description" | "fields" | "questions" | "redirect_url" | "design">>,
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
