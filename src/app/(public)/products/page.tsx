import { createAdminClient } from "@/lib/supabase/admin";
import { ShowcaseCard } from "@/components/shared/showcase-card";
import { PublicHeader } from "@/components/shared/public-header";
import ProductsDirectoryClient from "./products-directory-client";
import { buildPlanMap, sortShowcases } from "@/lib/showcase-sort";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "SaaS", "Mobile App", "Web App", "AI Tool", "Productivity", "Design",
  "Developer Tools", "Marketing", "E-commerce", "Fintech", "Health",
  "Education", "Social", "Entertainment", "Other",
];

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

export default async function ProductsPage(props: {
  searchParams?: Promise<{ search?: string; category?: string }>;
}) {
  const sp = await props.searchParams;
  const search = sp?.search ?? "";
  const category = sp?.category ?? "";

  const admin = createAdminClient();

  let query = admin
    .from("showcases")
    .select("slug, name, description, category_1, category_2, images, video_url, featured_badge, link, waitlist_id, main_type, main_image, card_image, status")
    .eq("status", "published");

  if (search) query = query.ilike("name", `%${search}%`);
  if (category) query = query.or(`category_1.eq.${category},category_2.eq.${category}`);

  const { data: rows } = await query;
  const showcases = (rows ?? []) as ShowcaseRow[];
  const planMap = await buildPlanMap(
    admin,
    showcases.map((s) => s.waitlist_id),
  );
  const sortedShowcases = sortShowcases(showcases, planMap);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader currentTab="products" />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-3">All products</h1>
          <p className="text-muted-foreground">Discover products built by makers.</p>
        </div>

        <ProductsDirectoryClient search={search} category={category} categories={CATEGORIES}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedShowcases.map((s) => (
              <ShowcaseCard key={s.slug} data={s} />
            ))}
          </div>

          {sortedShowcases.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              {search || category
                ? "No products match your filters."
                : "No products published yet. Be the first!"}
            </div>
          )}
        </ProductsDirectoryClient>
      </div>
    </div>
  );
}
