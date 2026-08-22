import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ShowcaseCardData {
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
  status?: string;
}

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export function ShowcaseCard({ data }: { data: ShowcaseCardData }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isVideo = data.main_type === "video" && data.video_url;
  const ytId = isVideo ? extractYouTubeId(data.video_url) : null;
  const cardImg = data.card_image || data.main_image;
  const isComingSoon = data.status === "coming_soon";

  return (
    <Link
      href={`/product/${data.slug}`}
      className={`group block rounded-xl border overflow-hidden transition-all duration-200 ${
        data.featured_badge
          ? "bg-card border-primary/25 hover:border-primary/50"
          : isComingSoon
            ? "border-coming-soon/30 bg-coming-soon/[0.03] hover:border-coming-soon/50"
            : "bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="aspect-video bg-muted flex items-center justify-center text-4xl relative">
        {isVideo && ytId ? (
          <>
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt={data.name}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <svg className="size-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          </>
        ) : cardImg ? (
          <img
            src={`${supabaseUrl}/storage/v1/object/public/showcase-images/${cardImg}`}
            alt={data.name}
            className="size-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-30">{isComingSoon ? "🏗️" : "🖼️"}</span>
        )}
        {isComingSoon && (
          <div className="absolute top-3 left-3">
            <Badge variant="building" className="text-[10px] px-2 py-0">Coming soon</Badge>
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-semibold text-base truncate group-hover:text-primary transition-colors">{data.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{data.description}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">{data.category_1}</span>
          {data.category_2 && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground">{data.category_2}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
