import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getFormLimit } from "@/lib/plans";
import { NewForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewFormPage(props: {
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

  const plan = project.plan as "free" | "launch" | "grow" | "scale";
  const formLimit = getFormLimit(plan);

  const { count: formCount } = await supabase
    .from("testimonial_forms")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

  const canCreate = !formLimit || (formCount ?? 0) < formLimit;

  if (!canCreate) {
    return (
      <div className="max-w-lg">
        <h1 className="font-heading text-2xl font-semibold mb-2">Create form</h1>
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Free plan is limited to 1 form. Upgrade to create more.
          </p>
          <a
            href={`/dashboard/projects/${id}/upgrade`}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium px-6 py-3 hover:opacity-90 transition-opacity"
          >
            Upgrade →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-semibold mb-2">Create form</h1>
      <p className="text-sm text-muted-foreground mb-8">{project.name}</p>
      <NewForm projectId={id} />
    </div>
  );
}
