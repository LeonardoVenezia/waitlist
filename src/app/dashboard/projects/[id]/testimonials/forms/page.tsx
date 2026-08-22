import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getFormLimit } from "@/lib/plans";
import type { Database } from "@/lib/supabase/types";
import { FormRowActions } from "./row-actions";

type FormRow = Database["public"]["Tables"]["testimonial_forms"]["Row"];

export const dynamic = "force-dynamic";

export default async function FormsPage(props: {
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
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { count: submissionsCount } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

  // Get per-form counts
  const formCounts = new Map<string, number>();
  if (forms) {
    const { data: counts } = await supabase
      .from("testimonials")
      .select("form_id")
      .eq("project_id", id)
      .not("form_id", "is", null);

    counts?.forEach((t: { form_id: string }) => {
      formCounts.set(t.form_id, (formCounts.get(t.form_id) ?? 0) + 1);
    });
  }

  const plan = project.plan as "free" | "launch" | "grow";
  const formLimit = getFormLimit(plan);
  const canCreate = !formLimit || (forms?.length ?? 0) < formLimit;

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    published: "default",
    draft: "secondary",
    archived: "outline",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.name} · {submissionsCount ?? 0} total testimonials
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${id}/testimonials`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
          >
            Testimonials
          </Link>
          {canCreate ? (
            <Link
              href={`/dashboard/projects/${id}/testimonials/forms/new`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-primary/80 transition-all"
            >
              Create form
            </Link>
          ) : (
            <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 opacity-50 cursor-not-allowed">
              Create form (upgrade)
            </span>
          )}
        </div>
      </div>

      {!forms || forms.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold mb-1">No forms yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a form to collect testimonials from your customers.
          </p>
          {canCreate ? (
            <Link
              href={`/dashboard/projects/${id}/testimonials/forms/new`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-primary/80 transition-all"
            >
              Create your first form
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Free plan is limited to 1 form.{" "}
              <Link href={`/dashboard/projects/${id}/upgrade`} className="text-primary underline">
                Upgrade →
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form: FormRow) => (
            <div key={form.id} className="rounded-xl border bg-card p-5 flex flex-col gap-3 relative group">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/projects/${id}/testimonials/forms/${form.id}`}
                    className="font-medium text-sm hover:text-primary transition-colors"
                  >
                    {form.name}
                  </Link>
                  {form.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.description}</p>
                  )}
                </div>
                <Badge variant={statusVariant[form.status] ?? "secondary"} className="shrink-0 capitalize">
                  {form.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>/{form.slug}</span>
                <span>{formCounts.get(form.id) ?? 0} submissions</span>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <FormRowActions id={form.id} projectId={id} status={form.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
