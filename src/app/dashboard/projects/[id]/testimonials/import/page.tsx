import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export default async function ImportTestimonialsPage(props: {
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
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Import testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
        </div>
        <Link
          href={`/dashboard/projects/${id}/testimonials`}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
        >
          ← Back
        </Link>
      </div>

      <ImportForm projectId={id} />
    </div>
  );
}
