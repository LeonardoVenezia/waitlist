"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve a safe internal redirect target from the `next` and `claim` form
 * fields. Only same-origin paths are allowed (must start with "/" and not
 * with "//" or "/\"). `claim` is a showcase slug; we always land on its
 * /product/[slug] page after signup so the user can resume the claim flow.
 */
function resolvePostAuthRedirect(
  next: string | null,
  claim: string | null,
): string {
  if (claim && /^[a-z0-9-]+$/i.test(claim)) {
    return `/product/${claim}`;
  }
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/dashboard";
}

export async function signUp(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const next = (formData.get("next") as string | null) ?? null;
  const claim = (formData.get("claim") as string | null) ?? null;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(resolvePostAuthRedirect(next, claim));
}

export async function signIn(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string | null) ?? null;
  const claim = (formData.get("claim") as string | null) ?? null;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(resolvePostAuthRedirect(next, claim));
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
