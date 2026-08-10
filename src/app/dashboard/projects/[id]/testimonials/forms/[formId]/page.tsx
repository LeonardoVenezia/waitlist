import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleFormStatus, deleteForm } from "@/lib/testimonials/actions";
import { FormEditor } from "./form-editor";

export const dynamic = "force-dynamic";

export default async function FormEditorPage(props: {
  params: Promise<{ id: string; formId: string }>;
}) {
  const { id, formId } = await props.params;

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

  const { data: form } = await supabase
    .from("testimonial_forms")
    .select("*")
    .eq("id", formId)
    .eq("project_id", id)
    .maybeSingle();
  if (!form) notFound();

  const { count: submissions } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("form_id", formId);

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/t/${form.slug}`;

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    published: "default",
    draft: "secondary",
    archived: "outline",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-2xl font-semibold">{form.name}</h1>
            <Badge variant={statusVariant[form.status] ?? "secondary"} className="capitalize">
              {form.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.name} · {submissions ?? 0} submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${id}/testimonials/forms`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Public URL */}
      <div className="rounded-xl border bg-card p-4 mb-6">
        <p className="text-xs text-muted-foreground mb-2">Public form URL</p>
        <div className="flex items-center gap-2">
          <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">{publicUrl}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(publicUrl)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Copy
          </button>
        </div>
      </div>

      <FormEditor form={form} projectId={id} />
    </div>
  );
}
