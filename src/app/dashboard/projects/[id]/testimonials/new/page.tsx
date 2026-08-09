import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { NewTestimonialForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, plan")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const { data: forms } = await supabase
    .from("testimonial_forms")
    .select("id, name")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-semibold mb-2">Add testimonial</h1>
      <p className="text-sm text-muted-foreground mb-8">{project.name}</p>
      <NewTestimonialForm projectId={id} forms={forms ?? []} />
    </div>
  );
}
