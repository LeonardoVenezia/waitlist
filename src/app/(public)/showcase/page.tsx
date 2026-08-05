import { createAdminClient } from "@/lib/supabase/admin";
import { ShowcaseCard } from "@/components/shared/showcase-card";
import { SHOWCASE_CATEGORIES } from "@/lib/showcase";
import ShowcaseDirectoryClient from "./showcase-directory-client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface ShowcaseRow {
  slug: string;
  name: string;
  description: string;
  category_1: string;
  category_2: string | null;
  images: string[];
  video_url: string | null;
  featured_badge: boolean;
  link: string;
  waitlist_id: string;
}

export default async function ShowcasePage(props: {
  searchParams?: Promise<{ search?: string; category?: string }>;
}) {
  const sp = await props.searchParams;
  const search = sp?.search ?? "";
  const category = sp?.category ?? "";

  const admin = createAdminClient();

  let query = admin
    .from("showcases")
    .select("slug, name, description, category_1, category_2, images, video_url, featured_badge, link, waitlist_id")
    .eq("status", "published");

  if (search) query = query.ilike("name", `%${search}%`);
  if (category) query = query.or(`category_1.eq.${category},category_2.eq.${category}`);

  const { data: rows } = await query;
  const showcases = (rows ?? []) as ShowcaseRow[];

  // Sort by plan weight
  if (showcases.length > 0) {
    const waitlistIds = [...new Set(showcases.map((s) => s.waitlist_id))];
    const { data: waitlists } = await admin
      .from("waitlists")
      .select("id, plan")
      .in("id", waitlistIds);

    const weightMap = new Map<string, number>();
    if (waitlists) {
      for (const w of waitlists) {
        weightMap.set(w.id, w.plan === "grow" || w.plan === "scale" ? 3 : w.plan === "launch" ? 2 : 1);
      }
    }

    showcases.sort((a, b) => {
      return (weightMap.get(b.waitlist_id) ?? 1) - (weightMap.get(a.waitlist_id) ?? 1);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Showcase</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover products built by makers and entrepreneurs. Click through to learn more.
          </p>
        </div>

        <ShowcaseDirectoryClient
          search={search}
          category={category}
          categories={SHOWCASE_CATEGORIES as unknown as string[]}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showcases.map((s) => (
              <ShowcaseCard key={s.slug} data={s} />
            ))}
          </div>

          {showcases.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              {search || category
                ? "No products match your filters."
                : "No products published yet. Be the first!"}
            </div>
          )}
        </ShowcaseDirectoryClient>
      </div>
    </div>
  );
}
