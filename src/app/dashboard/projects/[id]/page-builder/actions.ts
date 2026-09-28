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

export type PageDesignPayload = {
  sections: unknown;
  global: unknown;
  templateId: string | null;
  templateData: unknown;
};

export async function savePageDesign(
  waitlistId: string,
  slug: string,
  payload: PageDesignPayload,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("plan, settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Not found" };

  const plan = waitlist.plan as Plan;
  const current = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (current.page_sections as Record<string, unknown>) ?? {};

  const definition =
    payload.templateId === null
      ? null
      : getTemplateDefinition(payload.templateId);

  // Template fields are rewritten only when the client picked a template it is
  // allowed to use. Anything else (no template, unknown id, plan without
  // access) keeps whatever is already stored, so a downgraded project never
  // loses its template nor gets its save rejected.
  let templateFields: Record<string, unknown> = {};
  if (definition && hasTemplateAccess(plan)) {
    templateFields = {
      template_id: definition.id,
      template_data: normalizeTemplateData(
        definition.id,
        payload.templateData,
      ),
    };
  } else if (payload.templateId === null) {
    templateFields = { template_id: null };
  }

  const updated = {
    ...current,
    page_sections: {
      ...pageSections,
      sections: payload.sections,
      global: payload.global,
      ...templateFields,
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
