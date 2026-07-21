"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWaitlist(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const accountId = formData.get("account_id") as string;

  if (!name || !slug || !accountId) {
    return { error: "Missing required fields" };
  }

  const { data, error } = await supabase
    .from("waitlists")
    .insert({
      account_id: accountId,
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This slug is already taken" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, id: data.id, slug: data.slug };
}
