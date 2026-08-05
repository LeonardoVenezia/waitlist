import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ShowcaseForm } from "./showcase-form";
import type { Plan } from "@/lib/plans";

export default async function ShowcasePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, plan")
    .eq("id", id)
    .maybeSingle();
  if (!waitlist) notFound();

  const { data: showcase } = await supabase
    .from("showcases")
    .select("*")
    .eq("waitlist_id", id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Showcase</h1>
      <ShowcaseForm
        waitlistId={id}
        plan={waitlist.plan as Plan}
        showcase={showcase ? { ...showcase, images: (Array.isArray(showcase.images) ? showcase.images : []) as string[] } : null}
      />
    </div>
  );
}
