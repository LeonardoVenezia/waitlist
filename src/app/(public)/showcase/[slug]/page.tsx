import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const admin = createAdminClient();
  const { data: showcase } = await admin
    .from("showcases")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!showcase) return { title: "Not Found" };

  return {
    title: `${showcase.name} — Showcase`,
    description: showcase.description.slice(0, 160),
  };
}

export default async function ShowcaseDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("showcases")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!raw) notFound();

  const showcase = raw as {
    id: string;
    waitlist_id: string;
    name: string;
    slug: string;
    link: string;
    description: string;
    category_1: string;
    category_2: string | null;
    images: string[];
    video_url: string | null;
    featured_badge: boolean;
    status: string;
  };

  // Fetch plan for badge
  const { data: wl } = await admin
    .from("waitlists")
    .select("plan")
    .eq("id", showcase.waitlist_id)
    .maybeSingle();

  const plan = wl?.plan ?? "free";
  const images = showcase.images as string[] ?? [];
  const videoId = extractYouTubeId(showcase.video_url);

  const hasYTPreview = !!videoId;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <p className="text-sm text-muted-foreground">
            <a href="/showcase" className="hover:text-foreground transition-colors">← Showcase</a>
          </p>
          <h1 className="text-3xl font-bold">{showcase.name as string}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{showcase.category_1 as string}</span>
            {showcase.category_2 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{showcase.category_2 as string}</span>
            )}
            {showcase.featured_badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Featured</span>
            )}
          </div>
        </div>

        {/* Images gallery */}
        {images.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
            {images.map((path: string) => (
              <img
                key={path}
                src={`${APP_URL}/storage/v1/object/public/showcase-images/${path}`}
                alt=""
                className="rounded-xl border object-cover aspect-video w-full"
              />
            ))}
          </div>
        )}

        {/* Video embed */}
        {hasYTPreview && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-8">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              allowFullScreen
              className="border-0"
            />
          </div>
        )}

        {/* Description */}
        <div className="prose prose-sm max-w-none mb-8">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{showcase.description as string}</p>
        </div>

        {/* Dofollow link */}
        <div className="rounded-xl border bg-card p-6 mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Visit the product</p>
          <a
            href={showcase.link as string}
            target="_blank"
            rel="dofollow"
            className="text-primary font-medium text-lg hover:underline"
          >
            {showcase.link as string}
          </a>
        </div>

        {/* Testimonials placeholder */}
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Testimonials coming soon</p>
        </div>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}
