import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { TestimonialActions } from "./actions-bar";
import type { Database } from "@/lib/supabase/types";

type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["approved", "pending", "rejected"] as const;

export default async function TestimonialsPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string; form?: string }>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const statusFilter = sp?.status ?? "";
  const formFilter = sp?.form ?? "";

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

  let query = supabase
    .from("testimonials")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (statusFilter && (VALID_STATUSES as readonly string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter as "approved" | "pending" | "rejected");
  }
  if (formFilter) query = query.eq("form_id", formFilter);

  const { data: testimonials } = await query;

  const { data: forms } = await supabase
    .from("testimonial_forms")
    .select("id, name")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const statuses = VALID_STATUSES;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${id}/testimonials/forms`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
          >
            Forms
          </Link>
          <Link
            href={`/dashboard/projects/${id}/testimonials/new`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-primary/80 transition-all"
          >
            Add testimonial
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href={`/dashboard/projects/${id}/testimonials`}
          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
            !statusFilter ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/dashboard/projects/${id}/testimonials?status=${s}`}
            className={`px-3 py-1.5 rounded-md text-sm border capitalize transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {s}
          </Link>
        ))}
        {forms?.map((f) => (
          <Link
            key={f.id}
            href={`/dashboard/projects/${id}/testimonials?form=${f.id}`}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              formFilter === f.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {f.name}
          </Link>
        ))}
      </div>

      {!testimonials || testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold mb-1">No testimonials yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share a form or add testimonials manually.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href={`/dashboard/projects/${id}/testimonials/forms/new`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-muted hover:text-foreground transition-all"
            >
              Create form
            </Link>
            <Link
              href={`/dashboard/projects/${id}/testimonials/new`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 gap-1.5 px-2.5 hover:bg-primary/80 transition-all"
            >
              Add manually
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t: TestimonialRow) => (
            <div key={t.id} className="relative group">
              <TestimonialCard
                name={t.name}
                company={t.company}
                role={t.role}
                message={t.message}
                rating={t.rating}
                avatarUrl={t.avatar_url}
                date={t.created_at}
                compact
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <TestimonialActions id={t.id} projectId={id} status={t.status} isFeatured={t.is_featured} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
