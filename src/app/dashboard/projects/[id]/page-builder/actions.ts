"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";
import {
  getTemplateDefinition,
  hasTemplateAccess,
  normalizeTemplateData,
  type TemplateId,
} from "@/lib/templates";
import type { Plan } from "@/lib/plans";

type Json = Database["public"]["Tables"]["projects"]["Row"]["settings"];

export async function savePageSections(
  waitlistId: string,
  slug: string,
  sections: unknown,
  global: unknown,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Not found" };

  const current = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (current.page_sections as Record<string, unknown>) ?? {};
  const updated = {
    ...current,
    page_sections: {
      ...pageSections,
      sections,
      global,
    },
  } as Json;

  const { error } = await supabase
    .from("projects")
    .update({ settings: updated })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/projects/${waitlistId}/page-builder`);
  revalidatePath(`/p/${slug}`, "page");
  return { success: true };
}

export async function selectTemplate(
  waitlistId: string,
  slug: string,
  templateId: string | null,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("plan, settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Not found" };

  const plan = waitlist.plan as Plan;
  if (!hasTemplateAccess(plan)) {
    return { error: "Templates require a paid plan" };
  }

  const current = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (current.page_sections as Record<string, unknown>) ?? {};

  let nextTemplateId: string | null = null;
  let templateData: unknown;

  if (templateId !== null) {
    const definition = getTemplateDefinition(templateId);
    if (!definition) return { error: "Unknown template" };
    nextTemplateId = definition.id;
    templateData = definition.defaultData;
  } else {
    templateData = pageSections.template_data;
  }

  const updated = {
    ...current,
    page_sections: {
      ...pageSections,
      template_id: nextTemplateId,
      template_data: templateData,
    },
  } as Json;

  const { error } = await supabase
    .from("projects")
    .update({ settings: updated })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/projects/${waitlistId}/page-builder`);
  revalidatePath(`/p/${slug}`, "page");
  return { success: true };
}

export async function saveTemplateData(
  waitlistId: string,
  slug: string,
  templateData: unknown,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("plan, settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Not found" };

  const plan = waitlist.plan as Plan;
  if (!hasTemplateAccess(plan)) {
    return { error: "Templates require a paid plan" };
  }

  const current = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (current.page_sections as Record<string, unknown>) ?? {};
  const templateId = pageSections.template_id as TemplateId | undefined;

  if (!templateId || !getTemplateDefinition(templateId)) {
    return { error: "No template selected" };
  }

  const normalized = normalizeTemplateData(templateId, templateData);

  const updated = {
    ...current,
    page_sections: {
      ...pageSections,
      template_data: normalized,
    },
  } as unknown as Json;

  const { error } = await supabase
    .from("projects")
    .update({ settings: updated })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/projects/${waitlistId}/page-builder`);
  revalidatePath(`/p/${slug}`, "page");
  return { success: true };
}
