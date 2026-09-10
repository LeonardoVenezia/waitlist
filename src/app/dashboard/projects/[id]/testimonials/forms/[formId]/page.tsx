import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { FormEditor } from "./form-editor";
import { CopyLinkPill } from "@/components/testimonials/copy-link-pill";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  published: "bg-emerald-500",
  draft: "bg-muted-foreground/40",
  archived: "bg-amber-500",
};

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

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/t/${form.slug}`;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href={`/dashboard/projects/${id}/testimonials/forms`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Forms
        </Link>

        <div className="flex items-center gap-2 mt-3">
          <h1 className="font-heading text-2xl font-semibold">{form.name}</h1>
          <span
            className={`size-2 rounded-full shrink-0 ${STATUS_DOT[form.status] ?? "bg-muted-foreground/40"}`}
            title={form.status}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          {form.status === "published" ? (
            <CopyLinkPill url={publicUrl} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Publish the form to share its link.
            </p>
          )}
          <div className="flex items-center gap-2">
            <a
              href={`/t/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
            >
              View form ↗
            </a>
            <Link
              href={`/dashboard/projects/${id}/testimonials/forms/${form.id}/invites`}
              className="inline-flex items-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
            >
              Invites
            </Link>
            <Link
              href={`/dashboard/projects/${id}/testimonials?form=${form.id}`}
              className="inline-flex items-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
            >
              Testimonials ({submissions ?? 0})
            </Link>
          </div>
        </div>
      </div>

      <FormEditor form={form} projectId={id} />
    </div>
  );
}
