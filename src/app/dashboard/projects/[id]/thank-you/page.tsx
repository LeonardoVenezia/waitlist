import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Plan } from "@/lib/plans";
import { getSubscriberCount } from "@/lib/api/position";
import { getTemplateDefinition } from "@/lib/templates";
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
    .select("id, name, slug, plan, public_key, settings")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (settings.page_sections as Record<string, unknown>) ?? {};
  const template = getTemplateDefinition(pageSections.template_id);
  // Only needed to feed the preview of the template's own post-signup screen.
  const realCount = await getSubscriberCount(waitlist.id);

  return (
    <ThankYouClient
      waitlistId={waitlist.id}
      slug={waitlist.slug}
      plan={waitlist.plan as Plan}
      initialThankYou={(settings.thank_you as Record<string, unknown>) ?? {}}
      branding={(settings.branding as Record<string, unknown>) ?? {}}
      templateName={template?.name ?? null}
      templateId={template?.id ?? null}
      templateData={pageSections.template_data}
      publicKey={waitlist.public_key}
      realCount={realCount}
    />
  );
}
