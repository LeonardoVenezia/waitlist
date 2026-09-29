"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { buildProjectSettings } from "@/lib/project-settings";
import type { Database } from "@/lib/supabase/types";

type Settings = Database["public"]["Tables"]["projects"]["Row"]["settings"];

export async function updateProjectSettings(
  waitlistId: string,
  prevState: unknown,
  formData: FormData,
) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("projects")
    .select("name, slug, settings")
    .eq("id", waitlistId)
    .single();

  // Only the active tab's inputs are mounted, so name/slug are read only when
  // the tab that owns them is the one being saved.
  const name = formData.has("name")
    ? (formData.get("name") as string)
    : (current?.name ?? "");

  const slug = formData.has("slug")
    ? (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, "")
    : (current?.slug ?? "");

  const settings = buildProjectSettings({
    current: (current?.settings as Record<string, unknown>) ?? {},
    formData,
    activeTab: formData.get("active_tab") as string | null,
  }) as unknown as Settings;

  const { error } = await supabase
    .from("projects")
    .update({ name, slug, settings })
    .eq("id", waitlistId);

  if (error) {
    if (error.code === "23505") {
      return { error: "This slug is already taken" };
    }
    return { error: error.message };
  }

  revalidatePath(`/dashboard/projects/${waitlistId}/settings`);
  return { success: true };
}

// ── Team actions ──

export async function inviteTeamMember(waitlistId: string, formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "member";
  if (!email) return { error: "Email is required" };

  // Find user by email
  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (!profiles || profiles.length === 0) {
    return { error: "No user found with that email" };
  }

  // Get account_id for this waitlist
  const { data: waitlist } = await supabase
    .from("projects")
    .select("account_id")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Waitlist not found" };

  const { error } = await admin
    .from("account_members")
    .insert({
      account_id: waitlist.account_id,
      user_id: profiles[0].id,
      role: role as "owner" | "admin" | "member",
    });

  if (error) {
    if (error.code === "23505") return { error: "User is already a member" };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/projects/${waitlistId}/settings`);
  return { success: true };
}

export async function removeTeamMember(waitlistId: string, memberId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("account_members").delete().eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects/${waitlistId}/settings`);
  return { success: true };
}
