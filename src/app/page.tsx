import { createAdminClient } from "@/lib/supabase/admin";
import { ShowcaseCard } from "@/components/shared/showcase-card";
import { LaunchesList } from "@/components/shared/launches-list";
import { PublicHeader } from "@/components/shared/public-header";

interface ShowcaseRow {
  slug: string;
  name: string;
  description: string;
  category_1: string;
  category_2: string | null;
  images: string[];
  video_url: string | null;
  featured_badge: boolean;
  main_type: string;
  main_image: string | null;
  card_image: string | null;
  link: string;
  status: string;
  published_at: string | null;
  waitlist_id: string;
}

export default async function HomePage() {
  const admin = createAdminClient();

  // This week's launches
  const { data: launches } = await admin
    .from("showcases")
    .select("slug, name, description, main_image, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("published_at", { ascending: false })
    .limit(15);

  // All products
  const { data: rows } = await admin
    .from("showcases")
    .select("slug, name, description, category_1, category_2, images, video_url, featured_badge, link, waitlist_id, main_type, main_image, card_image, status")
    .eq("status", "published");

  const showcases = (rows ?? []) as ShowcaseRow[];

  // Sort: random-ish shuffle per day
  if (showcases.length > 0) {
    const daySeed = new Date().toISOString().slice(0, 10);
    const seed = daySeed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    showcases.sort((a, b) => {
      const ha = (a.slug.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + seed) % 1000;
      const hb = (b.slug.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + seed) % 1000;
      return ha - hb;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader currentTab="products" />
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* This week's launches */}
        <section className="mb-20">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="font-heading text-2xl font-bold tracking-tight">This week&apos;s launches</h2>
            {launches && launches.length > 0 && (
              <span className="text-sm text-muted-foreground">{launches.length} new</span>
            )}
          </div>
          {launches && launches.length > 0 ? (
            <LaunchesList
              items={launches.map((l) => ({
                slug: l.slug,
                name: l.name,
                description: l.description,
                main_image: l.main_image,
                published_at: l.published_at,
              }))}
            />
          ) : (
            <div className="rounded-xl border bg-muted/30 p-12 text-center">
              <p className="text-lg text-muted-foreground">No launches this week. Be the first.</p>
            </div>
          )}
        </section>

        {/* All products */}
        <section>
          <h2 className="font-heading text-2xl font-bold tracking-tight mb-8">All products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showcases.map((s) => (
              <ShowcaseCard key={s.slug} data={s} />
            ))}
          </div>

          {showcases.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No products published yet. Be the first!
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
