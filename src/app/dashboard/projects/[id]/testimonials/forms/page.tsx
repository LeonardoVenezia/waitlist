import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getFormLimit } from "@/lib/plans";
import { CopyLinkPill } from "@/components/testimonials/copy-link-pill";
import { FormPreviewFrame } from "@/components/testimonials/form-preview-frame";
import type { Database } from "@/lib/supabase/types";
import { FormRowActions } from "./row-actions";

type FormRow = Database["public"]["Tables"]["testimonial_forms"]["Row"];

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  published: "bg-emerald-500",
  draft: "bg-muted-foreground/40",
  archived: "bg-amber-500",
};

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

  const formIds = (forms ?? []).map((f: FormRow) => f.id);

  // Per-form stats: testimonials collected, unique visits, invites.
  // Visits are already deduped by the (form_id, visitor_hash) unique index,
  // so one row = one unique visitor.
  const testimonialCounts = new Map<string, number>();
  const visitCounts = new Map<string, number>();
  const inviteCounts = new Map<string, number>();

  if (formIds.length > 0) {
    const [{ data: tRows }, { data: vRows }, { data: iRows }] = await Promise.all([
      supabase.from("testimonials").select("form_id").in("form_id", formIds),
      supabase.from("testimonial_form_visits").select("form_id").in("form_id", formIds),
      supabase.from("testimonial_invites").select("form_id").in("form_id", formIds),
    ]);
    for (const row of tRows ?? []) {
      if (!row.form_id) continue;
      testimonialCounts.set(row.form_id, (testimonialCounts.get(row.form_id) ?? 0) + 1);
    }
    for (const row of vRows ?? []) {
      if (!row.form_id) continue;
      visitCounts.set(row.form_id, (visitCounts.get(row.form_id) ?? 0) + 1);
    }
    for (const row of iRows ?? []) {
      if (!row.form_id) continue;
      inviteCounts.set(row.form_id, (inviteCounts.get(row.form_id) ?? 0) + 1);
    }
  }

  const plan = project.plan as "free" | "launch" | "grow";
  const formLimit = getFormLimit(plan);
  const canCreate = !formLimit || (forms?.length ?? 0) < formLimit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

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
            <Link
              href={`/dashboard/projects/${id}/upgrade`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 opacity-70 hover:opacity-100 transition-opacity"
            >
              Create form (upgrade)
            </Link>
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
        <div className="flex flex-col gap-4">
          {forms.map((form: FormRow) => {
            const rawQuestions = form.questions as unknown;
            const questions = Array.isArray(rawQuestions)
              ? (rawQuestions as Array<Record<string, unknown>>).filter(
                  (q): q is Record<string, unknown> & { label: string } =>
                    typeof q?.label === "string",
                )
              : [];
            const fields = Array.isArray(form.fields) ? (form.fields as string[]) : [];
            const thankYouMessage =
              ((form.design ?? {}) as { thank_you_message?: string }).thank_you_message ?? null;

            const visits = visitCounts.get(form.id) ?? 0;
            const collected = testimonialCounts.get(form.id) ?? 0;
            const rate = visits > 0 ? `${((collected / visits) * 100).toFixed(1)}%` : "—";
            const publicUrl = `${appUrl}/t/${form.slug}`;

            return (
              <div
                key={form.id}
                className="relative block overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex items-stretch">
                  <div className="w-[300px] shrink-0 p-4 hidden lg:block">
                    <FormPreviewFrame
                      formId={form.id}
                      projectId={id}
                      fields={fields}
                      questions={questions}
                      thankYouMessage={thankYouMessage}
                      url={`/t/${form.slug}`}
                      externalHref={`/preview/forms/${form.id}`}
                    />
                  </div>

                  <div className="flex min-w-0 flex-grow flex-col gap-4 px-5 py-5">
                    <div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          href={`/dashboard/projects/${id}/testimonials/forms/${form.id}`}
                          className="truncate font-medium text-base hover:text-primary transition-colors"
                        >
                          {form.name}
                        </Link>
                        <span
                          className={`size-2 rounded-full shrink-0 ${STATUS_DOT[form.status] ?? "bg-muted-foreground/40"}`}
                          title={form.status}
                        />
                      </div>
                      {form.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {form.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-sm font-semibold">{inviteCounts.get(form.id) ?? 0}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          invites
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{visits}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          visits
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{collected}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          testimonials
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{rate}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          response rate
                        </p>
                      </div>
                    </div>

                    {form.status === "published" ? (
                      <div>
                        <CopyLinkPill url={publicUrl} compact />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Draft — publish to share the link.
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/projects/${id}/testimonials/forms/${form.id}`}
                        className="inline-flex items-center rounded-lg border border-border bg-background text-xs font-medium h-7 px-2.5 hover:bg-muted hover:text-foreground transition-all"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/projects/${id}/testimonials/forms/${form.id}/invites`}
                        className="inline-flex items-center rounded-lg border border-border bg-background text-xs font-medium h-7 px-2.5 hover:bg-muted hover:text-foreground transition-all"
                      >
                        Invites
                      </Link>
                      <Link
                        href={`/dashboard/projects/${id}/testimonials?form=${form.id}`}
                        className="inline-flex items-center rounded-lg border border-border bg-background text-xs font-medium h-7 px-2.5 hover:bg-muted hover:text-foreground transition-all"
                      >
                        Testimonials
                      </Link>
                      <div className="ml-auto">
                        <FormRowActions id={form.id} projectId={id} status={form.status} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
