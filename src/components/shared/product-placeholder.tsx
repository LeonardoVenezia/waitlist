import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProductPlaceholder({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const initials = initialsOf(name) || "·";
  if (size === "sm") {
    return (
      <div
        className={cn(
          "size-10 rounded-lg bg-muted flex items-center justify-center font-heading text-base text-foreground/60 shrink-0",
          className,
        )}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "aspect-video bg-muted flex items-center justify-center",
        className,
      )}
      aria-hidden="true"
    >
      <span className="font-heading text-7xl text-foreground/30">{initials}</span>
    </div>
  );
}
