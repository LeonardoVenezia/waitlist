interface FormMiniPreviewProps {
  name: string;
  description: string | null;
  fields: string[];
  questions: { label: string; type?: string }[];
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  company: "Company",
  role: "Role",
  message: "Message",
  rating: "Rating",
};

/**
 * Non-interactive miniature of the public form, rendered server-side from the
 * form's real fields and questions. Used as the visual anchor of the form
 * card in the dashboard list (senja-style screenshot slot, no screenshots).
 */
export function FormMiniPreview({ name, description, fields, questions }: FormMiniPreviewProps) {
  const showRating = fields.includes("rating");

  return (
    <div className="hidden lg:flex h-auto w-[240px] flex-none items-start justify-center overflow-hidden border-r bg-muted/30 p-4">
      <div className="w-full rounded-lg border bg-background p-3 shadow-sm">
        <p className="font-heading text-[11px] font-semibold text-center truncate">{name}</p>
        {description && (
          <p className="text-[8px] text-muted-foreground text-center line-clamp-1 mt-0.5">
            {description}
          </p>
        )}

        <div className="mt-2.5 space-y-2">
          {fields
            .filter((f) => f !== "rating")
            .map((f) => (
              <div key={f}>
                <p className="text-[7px] font-medium mb-0.5">{FIELD_LABELS[f] ?? f}</p>
                <div className={f === "message" ? "h-7 rounded border bg-muted/40" : "h-3.5 rounded border bg-muted/40"} />
              </div>
            ))}

          {showRating && (
            <div className="flex gap-0.5 pt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="size-2.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          )}

          {questions.slice(0, 2).map((q, i) => (
            <div key={i}>
              <p className="text-[7px] font-medium mb-0.5 truncate">{q.label}</p>
              <div className="h-3.5 rounded border bg-muted/40" />
            </div>
          ))}
        </div>

        <div className="mt-2.5 h-5 rounded-md bg-primary/85" />
      </div>
    </div>
  );
}
