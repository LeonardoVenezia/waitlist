import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicWaitlistForm } from "@/app/p/[slug]/public-waitlist-form";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";

interface ShowcaseDetail {
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
  main_type: string;
  main_image: string | null;
  status: string;
  waitlist?: {
    public_key: string;
    name: string;
    status: string;
    settings: Record<string, unknown>;
  } | null;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const admin = createAdminClient();
  // metadata: accept both published and building
  const { data: raw } = await admin
    .from("showcases")
    .select("name, description, status")
    .eq("slug", slug)
    .in("status", ["published", "building"])
    .maybeSingle();

  if (!raw) return { title: "Not Found" };

  const sc = raw as { name: string; description: string };
  return {
    title: `${sc.name} — Showcase`,
    description: sc.description.slice(0, 160),
  };
}

export default async function ShowcaseDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("showcases")
    .select("*, waitlists!inner(public_key, name, status, settings)")
    .eq("slug", slug)
    .in("status", ["published", "building"])
    .maybeSingle();

  if (!raw) notFound();

  const row = raw as unknown as Record<string, unknown>;
  const showcase: ShowcaseDetail = {
    id: row.id as string,
    waitlist_id: row.waitlist_id as string,
    name: row.name as string,
    slug: row.slug as string,
    link: row.link as string,
    description: row.description as string,
    category_1: row.category_1 as string,
    category_2: row.category_2 as string | null,
    images: row.images as string[],
    video_url: row.video_url as string | null,
    featured_badge: row.featured_badge as boolean,
    main_type: row.main_type as string,
    main_image: row.main_image as string | null,
    status: row.status as string,
    waitlist: (row.waitlists ? (row.waitlists as ShowcaseDetail["waitlist"]) : null),
  };
  const images = Array.isArray(showcase.images) ? showcase.images : [];
  const isVideo = showcase.main_type === "video" && showcase.video_url;
  const ytId = isVideo ? extractYouTubeId(showcase.video_url) : null;
  const mainImg = showcase.main_image;
  const gallery = images;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      {isVideo && ytId ? (
        <div className="aspect-video w-full bg-black max-h-[60vh]">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${ytId}`}
            allowFullScreen
            className="border-0"
          />
        </div>
      ) : mainImg ? (
        <div className="w-full max-h-[50vh] overflow-hidden bg-muted">
          <img
            src={`${SUPABASE_URL}/storage/v1/object/public/showcase-images/${mainImg}`}
            alt={showcase.name}
            className="w-full h-full object-cover max-h-[50vh]"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-muted-foreground mb-4">
          <a href="/showcase" className="hover:text-foreground transition-colors">← Showcase</a>
        </p>

        <h1 className="text-3xl font-bold mb-3">{showcase.name}</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{showcase.category_1}</span>
          {showcase.category_2 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{showcase.category_2}</span>
          )}
          {showcase.featured_badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Featured</span>
          )}
          {showcase.status === "building" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">In construction</span>
          )}
        </div>

        <div className="mb-8">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{showcase.description}</p>
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium mb-3">Gallery</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {gallery.map((path: string) => (
                <img
                  key={path}
                  src={`${SUPABASE_URL}/storage/v1/object/public/showcase-images/${path}`}
                  alt=""
                  className="rounded-xl border object-cover aspect-video w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Dofollow link — only for published + has link */}
        {showcase.status === "published" && showcase.link && (
          <div className="rounded-xl border bg-card p-6 mb-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Visit the product</p>
            <a
              href={showcase.link}
              target="_blank"
              rel="dofollow"
              className="text-primary font-medium text-lg hover:underline"
            >
              {showcase.link}
            </a>
          </div>
        )}

        {/* Waitlist widget — for building status */}
        {showcase.status === "building" && showcase.waitlist && showcase.waitlist.status === "active" && (
          <div className="rounded-xl border bg-card p-6 mb-8">
            <h2 className="text-sm font-medium mb-3">Get notified when we launch</h2>
            <PublicWaitlistForm
              publicKey={showcase.waitlist.public_key}
              waitlistId={showcase.waitlist_id}
              settings={showcase.waitlist.settings}
              slug=""
              ctaLabel="Notify me"
              showLeaderboard={false}
            />
          </div>
        )}

        {/* Testimonials placeholder — only for published */}
        {showcase.status === "published" && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">Testimonials coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}
