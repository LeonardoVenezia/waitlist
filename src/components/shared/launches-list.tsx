import Link from "next/link";
import { ProductPlaceholder } from "./product-placeholder";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

interface LaunchItem {
  slug: string;
  name: string;
  description: string;
  main_image: string | null;
  published_at: string | null;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function LaunchesList({ items }: { items: LaunchItem[] }) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <Link
          key={item.slug}
          href={`/product/${item.slug}`}
          className="flex items-start gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-accent/50 group"
        >
          <span className="w-6 pt-0.5 text-right text-xs font-mono text-muted-foreground shrink-0">
            {i + 1}
          </span>
          {item.main_image ? (
            <div className="size-10 rounded-lg bg-muted shrink-0 overflow-hidden">
              <img
                src={`${SUPABASE_URL}/storage/v1/object/public/showcase-images/${item.main_image}`}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : (
            <ProductPlaceholder name={item.name} size="sm" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="font-heading font-semibold text-base truncate group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              {item.published_at && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {timeAgo(item.published_at)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {item.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
