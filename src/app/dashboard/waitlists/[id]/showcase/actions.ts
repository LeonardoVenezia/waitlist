"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { hasFeature } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

// ── create ──
export async function createShowcase(waitlistId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const link = formData.get("link") as string;
  const description = formData.get("description") as string;
  const category1 = formData.get("category_1") as string;
  const category2 = (formData.get("category_2") as string) || null;

  if (!name || !slug || !link || !description || !category1) {
    return { error: "Todos los campos obligatorios deben completarse." };
  }

  if (description.length < 200) {
    return { error: `La descripción debe tener al menos 200 caracteres (${description.length}/200).` };
  }

  const { data: existing } = await supabase
    .from("showcases")
    .select("id")
    .eq("waitlist_id", waitlistId)
    .maybeSingle();

  if (existing) return { error: "Este proyecto ya tiene un showcase." };

  const { error } = await supabase.from("showcases").insert({
    waitlist_id: waitlistId,
    name,
    slug,
    link,
    description,
    category_1: category1,
    category_2: category2,
  });

  if (error) {
    if (error.code === "23505") return { error: "El slug ya está en uso." };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/waitlists/${waitlistId}/showcase`);
  return { success: true };
}

// ── update ──
export async function updateShowcase(waitlistId: string, showcaseId: string, formData: FormData) {
  const supabase = await createClient();

  const updates: Record<string, string | boolean | null> = {};
  for (const key of ["name", "slug", "link", "description", "category_1", "video_url"]) {
    const val = formData.get(key) as string;
    if (val !== null) updates[key] = val;
  }

  const cat2 = formData.get("category_2") as string;
  updates.category_2 = cat2 || null;

  if (updates.description && (updates.description as string).length < 200) {
    return { error: `La descripción debe tener al menos 200 caracteres.` };
  }

  const featuredBadge = formData.get("featured_badge");
  if (featuredBadge !== null) updates.featured_badge = featuredBadge === "on";

  const { data: updated, error } = await supabase
    .from("showcases")
    .update({ ...updates } as any)
    .eq("id", showcaseId)
    .select("images")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "El slug ya está en uso." };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/waitlists/${waitlistId}/showcase`);
  return { success: true, images: (updated?.images as string[]) ?? [] };
}

// ── publish ──
export async function publishShowcase(waitlistId: string, showcaseId: string) {
  const supabase = await createClient();

  const { data: sc } = await supabase
    .from("showcases")
    .select("domain_check_passed, spam_check_passed")
    .eq("id", showcaseId)
    .single();

  if (!sc) return { error: "Showcase no encontrado." };

  if (!sc.domain_check_passed || !sc.spam_check_passed) {
    return { error: "El dominio y el chequeo anti-spam deben pasar antes de publicar." };
  }

  const { error } = await supabase
    .from("showcases")
    .update({ status: "published" })
    .eq("id", showcaseId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/waitlists/${waitlistId}/showcase`);
  revalidatePath("/showcase", "layout");
  return { success: true };
}

// ── unpublish / delete ──
export async function updateShowcaseStatus(waitlistId: string, showcaseId: string, status: "draft" | "published" | "rejected") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("showcases")
    .update({ status })
    .eq("id", showcaseId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/waitlists/${waitlistId}/showcase`);
  revalidatePath("/showcase", "layout");
  return { success: true };
}

// ── upload image ──
export async function uploadShowcaseImage(showcaseId: string, formData: FormData) {
  const admin = createAdminClient();

  const file = formData.get("file") as File;
  if (!file) return { error: "No se recibió archivo." };
  if (!file.type.startsWith("image/")) return { error: "Solo se permiten imágenes." };
  if (file.size > 5 * 1024 * 1024) return { error: "Máximo 5 MB por imagen." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${showcaseId}/${filename}`;

  const { error } = await admin.storage
    .from("showcase-images")
    .upload(path, file, { upsert: false });

  if (error) return { error: error.message };

  // Add to images array
  const { data: sc } = await admin
    .from("showcases")
    .select("images")
    .eq("id", showcaseId)
    .single();

  const images = (sc?.images as string[]) ?? [];
  images.push(path);

  const { error: updateErr } = await admin
    .from("showcases")
    .update({ images })
    .eq("id", showcaseId);

  if (updateErr) return { error: updateErr.message };

  return { success: true, images };
}

// ── remove image ──
export async function removeShowcaseImage(showcaseId: string, path: string) {
  const admin = createAdminClient();

  await admin.storage.from("showcase-images").remove([path]);

  const { data: sc } = await admin
    .from("showcases")
    .select("images")
    .eq("id", showcaseId)
    .single();

  const images = ((sc?.images as string[]) ?? []).filter((p: string) => p !== path);

  const { error } = await admin
    .from("showcases")
    .update({ images })
    .eq("id", showcaseId);

  if (error) return { error: error.message };
  return { success: true, images };
}

// ── run quality checks ──
export async function runQualityChecks(showcaseId: string, link: string) {
  const admin = createAdminClient();

  // Domain check
  let domainOk = false;
  try {
    const res = await fetch(link, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    domainOk = res.ok;
  } catch { /* ignore */ }

  // Anti-spam: skip if no API configured
  const spamOk = true; // puntapié para futuro

  const { error } = await admin
    .from("showcases")
    .update({
      domain_check_passed: domainOk,
      spam_check_passed: spamOk,
      last_domain_check: new Date().toISOString(),
      last_spam_check: new Date().toISOString(),
    })
    .eq("id", showcaseId);

  if (error) return { error: error.message };
  return { success: true, domain_ok: domainOk, spam_ok: spamOk };
}
