import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://waitlist.leovenezia.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/launches`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("showcases")
    .select("slug, updated_at")
    .eq("status", "published")
    .or("expires_at.is.null,expires_at.gt.now()");

  const products: MetadataRoute.Sitemap = (rows ?? []).map((r) => ({
    url: `${BASE_URL}/product/${r.slug}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...products];
}
