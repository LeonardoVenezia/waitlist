"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

  const { data: created, error } = await supabase
    .from("showcases")
    .insert({
      waitlist_id: waitlistId,
      name,
      slug,
      link,
      description,
      category_1: category1,
      category_2: category2,
      main_type: ((formData.get("main_type") as string) || "image") as "image" | "video",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "El slug ya está en uso." };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/showcases/${waitlistId}`);
  return { success: true, id: created.id };
}

// ── update (guarda cambios sin publicar) ──
export async function updateShowcase(
  waitlistId: string,
  showcaseId: string,
  formData: FormData,
  galleryFiles?: FormData,
  pathsToRemove?: string[],
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Process gallery: remove + upload
  let finalImages: string[] = [];
  if (pathsToRemove && pathsToRemove.length > 0) {
    // Remove files from storage
    await admin.storage.from("showcase-images").remove(pathsToRemove);

    // Remove from existing array
    const { data: sc } = await admin
      .from("showcases")
      .select("images")
      .eq("id", showcaseId)
      .single();
    finalImages = ((sc?.images as string[]) ?? []).filter((p) => !pathsToRemove.includes(p));
  } else {
    const { data: sc } = await admin
      .from("showcases")
      .select("images")
      .eq("id", showcaseId)
      .single();
    finalImages = (sc?.images as string[]) ?? [];
  }

  // Upload new files
  if (galleryFiles) {
    const files = galleryFiles.getAll("file") as File[];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) continue;
      if (file.size > 2 * 1024 * 1024) continue;
      if (finalImages.length >= 5) break;

      const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
      const ext = extMap[file.type] ?? "jpg";
      const path = `${showcaseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await admin.storage.from("showcase-images").upload(path, file, { upsert: false });
      if (!error) finalImages.push(path);
    }
  }

  // Update text fields
  const updates: Record<string, string | boolean | null> = {};
  for (const key of ["name", "slug", "link", "description", "category_1", "video_url", "main_type"]) {
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

  updates.images = finalImages as any;

  const { error } = await supabase
    .from("showcases")
    .update({ ...updates } as any)
    .eq("id", showcaseId);

  if (error) {
    if (error.code === "23505") return { error: "El slug ya está en uso." };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/showcases/${waitlistId}`);
  revalidatePath("/showcase", "layout");
  return { success: true, images: finalImages };
}

// ── publish (guarda, corre checks, publica) ──
export async function publishShowcase(
  waitlistId: string,
  showcaseId: string,
  link: string,
  formData: FormData,
  targetStatus: "published" | "building" = "published",
  galleryFiles?: FormData,
  pathsToRemove?: string[],
) {
  // 1. Guardar cambios (incluye gallery)
  const saveRes = await updateShowcase(waitlistId, showcaseId, formData, galleryFiles, pathsToRemove);
  if (saveRes.error) return { error: saveRes.error };

  const admin = createAdminClient();

  // 2. Domain check — only for full launch
  if (targetStatus === "published") {
    let domainOk = false;
    try {
      const res = await fetch(link, { method: "HEAD", signal: AbortSignal.timeout(10000) });
      domainOk = res.ok;
    } catch { /* ignore */ }

    if (!domainOk) {
      return { error: "Domain not reachable. Make sure your website responds with HTTP 200." };
    }
  }

  // 3. Anti-spam (puntapié)
  const spamOk = true;

  // 4. Guardar checks + publicar
  const { error } = await admin
    .from("showcases")
    .update({
      status: targetStatus,
      domain_check_passed: targetStatus === "published",
      spam_check_passed: true,
      last_domain_check: targetStatus === "published" ? new Date().toISOString() : undefined,
      last_spam_check: new Date().toISOString(),
    })
    .eq("id", showcaseId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/showcases/${waitlistId}`);
  revalidatePath("/showcase", "layout");
  return { success: true, status: targetStatus };
}

// ── unpublish ──
export async function updateShowcaseStatus(waitlistId: string, showcaseId: string, status: "draft" | "published" | "rejected" | "building") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("showcases")
    .update({ status })
    .eq("id", showcaseId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/showcases/${waitlistId}`);
  revalidatePath("/showcase", "layout");
  return { success: true };
}

// ── upload image ──
export async function uploadShowcaseImage(showcaseId: string, formData: FormData) {
  const admin = createAdminClient();

  const file = formData.get("file") as File;
  if (!file) return { error: "No se recibió archivo." };
  if (!file.type.startsWith("image/")) return { error: "Solo se permiten imágenes." };
  if (file.size > 1 * 1024 * 1024) return { error: "Máximo 1 MB por imagen." };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Solo se aceptan JPEG, PNG, WebP o AVIF." };
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  const ext = extMap[file.type] ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${showcaseId}/${filename}`;

  const { error } = await admin.storage
    .from("showcase-images")
    .upload(path, file, { upsert: false });

  if (error) return { error: error.message };

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

  const { data: sc } = await admin
    .from("showcases")
    .select("images")
    .eq("id", showcaseId)
    .single();

  const images = ((sc?.images as string[]) ?? []).filter((p: string) => p !== path);

  // Update DB first (optimista: el caller ya mostró el cambio)
  const { error } = await admin
    .from("showcases")
    .update({ images })
    .eq("id", showcaseId);

  // Delete from storage (fire and forget)
  await admin.storage.from("showcase-images").remove([path]);

  if (error) return { error: error.message };
  return { success: true, images };
}

// ── upload main image ──
export async function uploadMainImage(showcaseId: string, formData: FormData) {
  const admin = createAdminClient();

  const file = formData.get("file") as File;
  if (!file) return { error: "No se recibió archivo." };
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    return { error: "Solo JPEG, PNG, WebP o AVIF." };
  }
  if (file.size > 2 * 1024 * 1024) return { error: "Máximo 2 MB." };

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
  };
  const ext = extMap[file.type] ?? "jpg";
  const path = `${showcaseId}/main.${ext}`;

  const { error } = await admin.storage
    .from("showcase-images")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message };

  const { error: updateErr } = await admin
    .from("showcases")
    .update({ main_image: path })
    .eq("id", showcaseId);

  if (updateErr) return { error: updateErr.message };
  return { success: true, main_image: path };
}

// ── remove main image ──
export async function removeMainImage(showcaseId: string) {
  const admin = createAdminClient();

  const { data: sc } = await admin
    .from("showcases")
    .select("main_image")
    .eq("id", showcaseId)
    .single();

  if (sc?.main_image) {
    await admin.storage.from("showcase-images").remove([sc.main_image as string]);
  }

  const { error } = await admin
    .from("showcases")
    .update({ main_image: null })
    .eq("id", showcaseId);

  if (error) return { error: error.message };
  return { success: true };
}
