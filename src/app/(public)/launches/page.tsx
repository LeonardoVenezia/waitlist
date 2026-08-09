import { createAdminClient } from "@/lib/supabase/admin";
import { LaunchesList } from "@/components/shared/launches-list";
import { PublicHeader } from "@/components/shared/public-header";

export default async function LaunchesPage() {
  const admin = createAdminClient();

  const { data: launches } = await admin
    .from("showcases")
    .select("slug, name, description, main_image, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader currentTab="launches" />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-baseline gap-3 mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight">All launches</h1>
          {launches && launches.length > 0 && (
            <span className="text-sm text-muted-foreground">{launches.length} products</span>
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
            <p className="text-lg text-muted-foreground">No launches yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
