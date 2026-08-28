import { createAdminClient } from "@/lib/supabase/admin";
import { ShowcaseCard } from "@/components/shared/showcase-card";
import { PublicHeader } from "@/components/shared/public-header";
import { buildPlanMap, sortShowcases } from "@/lib/showcase-sort";

export const dynamic = "force-dynamic";

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
  waitlist_id: string;
}

export default async function ComingSoonPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("showcases")
    .select("slug, name, description, category_1, category_2, images, video_url, featured_badge, link, waitlist_id, main_type, main_image, card_image, status, created_at")
    .eq("status", "coming_soon")
    .or("expires_at.is.null,expires_at.gt.now()");

  const showcases = (rows ?? []) as ShowcaseRow[];
  const planMap = await buildPlanMap(
    admin,
    showcases.map((s) => s.waitlist_id),
  );
  const sortedShowcases = sortShowcases(showcases, planMap);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader currentTab="coming-soon" />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-3">Coming soon</h1>
          <p className="text-muted-foreground">Productos en construcción. Sé el primero en enterarte cuando lancen.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedShowcases.map((s) => (
            <ShowcaseCard key={s.slug} data={s} />
          ))}
        </div>

        {sortedShowcases.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No products in the works yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}
