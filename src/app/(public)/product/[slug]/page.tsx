import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/shared/public-header";
import { BackButton } from "@/components/shared/back-button";
import { ClaimButton, type ClaimStatus } from "./claim-button";
// HIDDEN: testimonials desactivados temporalmente — ver PRODUCT.md
// import { ProductTestimonials } from "./product-testimonials";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";

interface ProductDetail {
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
  claimable: boolean;
  plan: string;
  waitlist?: {
    public_key: string;
    name: string;
    slug: string;
    status: string;
    settings: Record<string, unknown>;
  } | null;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const admin = createAdminClient();
  const { data: raw } = await admin
    .from("showcases")
    .select("name, description, status")
    .eq("slug", slug)
    .in("status", ["published", "coming_soon"])
    .maybeSingle();

  if (!raw) return { title: "Not Found" };

  const sc = raw as { name: string; description: string };
  return {
    title: `${sc.name} — Product`,
    description: sc.description.slice(0, 160),
  };
}

export default async function ProductDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("showcases")
    .select("*, projects!inner(public_key, name, slug, status, settings, plan)")
    .eq("slug", slug)
    .in("status", ["published", "coming_soon"])
    .or("expires_at.is.null,expires_at.gt.now()")
    .maybeSingle();

  if (!raw) notFound();

  const row = raw as unknown as Record<string, unknown>;
  const projectsData = row.projects as Record<string, unknown> | undefined;
  const product: ProductDetail = {
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
    claimable: row.claimable as boolean,
    plan: (projectsData?.plan as string) ?? "free",
    waitlist: (projectsData ? projectsData as ProductDetail["waitlist"] : null),
  };
  const images = Array.isArray(product.images) ? product.images : [];
  const isVideo = product.main_type === "video" && product.video_url;
  const ytId = isVideo ? extractYouTubeId(product.video_url) : null;

  // Claim status: only relevant for products the admin marked as claimable.
  // Skip the lookup entirely otherwise to avoid a wasted round-trip.
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  let claimStatus: ClaimStatus = "none";
  let claimReason: string | null = null;
  if (product.claimable && user) {
    const { data: claim } = await userClient
      .from("project_claims")
      .select("status, rejected_reason")
      .eq("showcase_id", product.id)
      .eq("claimant_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (claim) {
      claimStatus = claim.status as ClaimStatus;
      claimReason = (claim.rejected_reason as string | null) ?? null;
    }
  }
  const mainImg = product.main_image;
  const gallery = images;

  const isComingSoon = product.status === "coming_soon";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
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
            alt={product.name}
            className="w-full h-full object-cover max-h-[50vh]"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-sm text-muted-foreground mb-6">
          <BackButton />
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{product.name}</h1>
          {isComingSoon && (
            <Badge variant="building" className="text-sm px-3 py-0.5 font-heading">Coming soon</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <span className="text-sm px-3 py-1 rounded-full border bg-muted/50 text-muted-foreground">{product.category_1}</span>
          {product.category_2 && (
            <span className="text-sm px-3 py-1 rounded-full border bg-muted/50 text-muted-foreground">{product.category_2}</span>
          )}
          {product.featured_badge && (
            <span className="text-sm px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">Featured</span>
          )}
        </div>

        <div className="max-w-prose mb-12">
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        {isComingSoon ? (
          /* Coming soon: link to waitlist landing */
          <div className="rounded-xl border-2 border-coming-soon/30 bg-coming-soon/[0.03] p-8 mb-12 text-center">
            <h2 className="font-heading text-xl font-semibold mb-2">Coming soon</h2>
            <p className="text-muted-foreground mb-6">Este producto está en construcción.</p>
            {product.waitlist && (
              <a
                href={`/p/${product.waitlist.slug}`}
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium px-6 py-3 hover:opacity-90 transition-opacity"
              >
                Join the waitlist →
              </a>
            )}
          </div>
        ) : (
          <>
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

            {/* Dofollow link */}
            {product.link && (
              <div className="rounded-xl border bg-card p-6 mb-12 text-center">
                <p className="text-sm text-muted-foreground mb-3">Visit the product</p>
                <a
                  href={product.link}
                  target="_blank"
                  rel="dofollow"
                  className="text-primary font-heading font-semibold text-lg hover:underline"
                >
                  {product.link}
                </a>
              </div>
            )}

            {/* Testimonials */}
            {/* HIDDEN: testimonials desactivados temporalmente — ver PRODUCT.md */}
            {/* <ProductTestimonials projectId={product.waitlist_id} plan={product.plan} /> */}
          </>
        )}

        {/* Claim this product — only shown for products the admin marked as claimable */}
        {product.claimable && (
          <div className="mt-12 border-t pt-8">
            <h2 className="font-heading text-lg font-semibold mb-2">
              Is this your product?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              If you&apos;re the founder of {product.name}, claim it and we&apos;ll
              transfer ownership to your account so you can manage the waitlist,
              page builder, and analytics.
            </p>
            <ClaimButton
              showcaseId={product.id}
              showcaseSlug={product.slug}
              isAuthed={!!user}
              claimStatus={claimStatus}
              claimReason={claimReason}
              dashboardPath={`/dashboard/projects/${product.waitlist_id}`}
            />
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
