import { StarRating } from "@/components/ui/star-rating";

interface TestimonialCardProps {
  name: string;
  company?: string | null;
  role?: string | null;
  message: string;
  rating: number;
  avatarUrl?: string | null;
  date?: string | null;
  compact?: boolean;
  /** Responses to the form's custom questions (label → answer). */
  answers?: Record<string, string> | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function TestimonialCard({
  name,
  company,
  role,
  message,
  rating,
  avatarUrl,
  date,
  compact = false,
  answers,
}: TestimonialCardProps) {
  const answerEntries = answers ? Object.entries(answers).filter(([, v]) => v) : [];
  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="size-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          {(company || role) && (
            <p className="text-xs text-muted-foreground truncate">
              {[role, company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="ml-auto shrink-0">
          <StarRating value={rating} readonly size="sm" />
        </div>
      </div>

      <p
        className={compact ? "text-sm text-muted-foreground line-clamp-3" : "text-sm text-muted-foreground"}
      >
        {message}
      </p>

      {answerEntries.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
            {answerEntries.length} question{answerEntries.length === 1 ? "" : "s"} answered
          </summary>
          <dl className="mt-2 space-y-1.5">
            {answerEntries.map(([q, a]) => (
              <div key={q}>
                <dt className="text-xs font-medium text-foreground">{q}</dt>
                <dd className="text-xs text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {date && (
        <p className="text-xs text-muted-foreground/60">
          {formatDate(date)}
        </p>
      )}
    </div>
  );
}
