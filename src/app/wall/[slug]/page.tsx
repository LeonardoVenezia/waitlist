import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/plans";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";

export const dynamic = "force-dynamic";

const BRAND_URL = "https://waitlist.leovenezia.dev";

async function getProject(slug: string) {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, name, slug, plan, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return project;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) return { title: "Wall of Love" };
  return {
    title: `${project.name} — Wall of Love`,
    description: `What people say about ${project.name}.`,
  };
}

export default async function WallOfLovePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) notFound();

  const admin = createAdminClient();
  const { data: testimonials } = await admin
    .from("testimonials")
    .select("id, name, company, role, message, rating, avatar_url, created_at, is_featured")
    .eq("project_id", project.id)
    .eq("status", "approved")
    .eq("consent", "public")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const items = testimonials ?? [];
  const showBranding = !hasFeature(project.plan, "remove_branding");

  const { data: showcase } = await admin
    .from("showcases")
    .select("status")
    .eq("waitlist_id", project.id)
    .maybeSingle();
  const hasProductPage = showcase?.status === "published";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-12 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Wall of Love
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length} testimonial{items.length === 1 ? "" : "s"}
          </p>
          {hasProductPage && (
            <div className="mt-4">
              <Link
                href={`/product/${project.slug}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                View product →
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
            No public testimonials yet.
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
            {items.map((t) => (
              <TestimonialCard
                key={t.id}
                name={t.name}
                company={t.company}
                role={t.role}
                message={t.message}
                rating={t.rating}
                avatarUrl={t.avatar_url}
                date={t.created_at}
              />
            ))}
          </div>
        )}
      </main>

      {showBranding && (
        <footer className="border-t py-8 text-center">
          <a
            href={BRAND_URL}
            target="_blank"
            rel="dofollow"
            className="text-xs text-muted-foreground opacity-75 hover:opacity-100"
          >
            Made with Startpack
          </a>
        </footer>
      )}
    </div>
  );
}
