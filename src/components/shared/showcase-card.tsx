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
  link: string;
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
  const firstImage = data.images?.[0];

  return (
    <Link href={`/showcase/${data.slug}`} className="group block rounded-xl border bg-card hover:border-primary/40 transition-colors overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center text-4xl relative">
        {isVideo && ytId ? (
          <>
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt={data.name}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-12 rounded-full bg-black/60 flex items-center justify-center">
                <svg className="size-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          </>
        ) : firstImage ? (
          <img
            src={`${supabaseUrl}/storage/v1/object/public/showcase-images/${firstImage}`}
            alt={data.name}
            className="size-full object-cover"
          />
        ) : (
          "🖼️"
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{data.name}</h3>
          {data.featured_badge && (
            <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">Featured</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{data.category_1}</span>
          {data.category_2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{data.category_2}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
