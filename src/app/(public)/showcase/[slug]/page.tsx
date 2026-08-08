import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicWaitlistForm } from "@/app/p/[slug]/public-waitlist-form";
import { Badge } from "@/components/ui/badge";

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

  const isBuilding = showcase.status === "building";

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

      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/showcase" className="hover:text-foreground transition-colors">← Showcase</a>
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{showcase.name}</h1>
          {isBuilding && (
            <Badge variant="building" className="text-sm px-3 py-0.5 font-heading">In construction</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <span className="text-sm px-3 py-1 rounded-full border bg-muted/50 text-muted-foreground">{showcase.category_1}</span>
          {showcase.category_2 && (
            <span className="text-sm px-3 py-1 rounded-full border bg-muted/50 text-muted-foreground">{showcase.category_2}</span>
          )}
          {showcase.featured_badge && (
            <span className="text-sm px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">Featured</span>
          )}
        </div>

        <div className="max-w-prose mb-12">
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{showcase.description}</p>
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mb-12">
            <h2 className="font-heading text-lg font-semibold mb-4">Gallery</h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
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

        {/* Dofollow link — only published + has link */}
        {!isBuilding && showcase.link && (
          <div className="rounded-xl border bg-card p-6 mb-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">Visit the product</p>
            <a
              href={showcase.link}
              target="_blank"
              rel="dofollow"
              className="text-primary font-heading font-semibold text-lg hover:underline"
            >
              {showcase.link}
            </a>
          </div>
        )}

        {/* Waitlist widget — building focus */}
        {isBuilding && showcase.waitlist && showcase.waitlist.status === "active" && (
          <div className="rounded-xl border-2 border-building/30 bg-building/[0.03] p-8 mb-12">
            <h2 className="font-heading text-xl font-semibold mb-2">Get notified when we launch</h2>
            <p className="text-muted-foreground mb-6">Este producto está en construcción. Dejanos tu email y te avisamos cuando esté listo.</p>
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

        {/* Testimonials placeholder — only published */}
        {!isBuilding && (
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
