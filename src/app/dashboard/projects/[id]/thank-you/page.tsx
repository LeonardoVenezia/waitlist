import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Plan } from "@/lib/plans";
import { normalizeMilestones } from "@/lib/thank-you-experiences";
import { ThankYouClient } from "./thank-you-client";

export default async function ThankYouPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, slug, plan, settings")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const referral = (settings.referral as Record<string, unknown>) ?? {};

  return (
    <ThankYouClient
      waitlistId={waitlist.id}
      slug={waitlist.slug}
      plan={waitlist.plan as Plan}
      initialThankYou={(settings.thank_you as Record<string, unknown>) ?? {}}
      language={(settings.language as string) ?? "en"}
      branding={(settings.branding as Record<string, unknown>) ?? {}}
      milestones={normalizeMilestones(referral.milestones)}
    />
  );
}
