import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { IntegrationClient } from "./integration-client";

export default async function IntegrationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, slug, public_key, settings, plan")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  return (
    <IntegrationClient
      waitlistId={waitlist.id}
      publicKey={waitlist.public_key}
      settings={waitlist.settings as Record<string, unknown>}
      plan={waitlist.plan}
    />
  );
}
