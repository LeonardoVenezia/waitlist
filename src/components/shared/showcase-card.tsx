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
  link: string;
}

export function ShowcaseCard({ data }: { data: ShowcaseCardData }) {
  const firstImage = data.images?.[0];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const imageUrl = firstImage
    ? `${supabaseUrl}/storage/v1/object/public/showcase-images/${firstImage}`
    : null;

  return (
    <Link href={`/showcase/${data.slug}`} className="group block rounded-xl border bg-card hover:border-primary/40 transition-colors overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center text-4xl">
        {imageUrl ? (
          <img src={imageUrl} alt={data.name} className="size-full object-cover" />
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
