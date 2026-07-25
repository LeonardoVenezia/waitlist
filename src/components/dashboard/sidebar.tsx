"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface WaitlistSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export function Sidebar({
  waitlists,
}: {
  waitlists: WaitlistSummary[];
}) {
  const pathname = usePathname();

  const currentId = pathname.match(/\/dashboard\/waitlists\/([^/]+)/)?.[1] ?? null;

  return (
    <aside className="flex w-60 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex h-12 items-center px-5 border-b">
        <Link href="/dashboard" className="font-heading text-lg">
          [PACK]
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Projects
        </p>
      </div>

      {/* Project list */}
      <nav className="flex-1 space-y-0.5 px-3">
        {waitlists.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No projects yet
          </p>
        ) : (
          waitlists.map((wl) => {
            const isActive = wl.id === currentId;
            return (
              <Link
                key={wl.id}
                href={`/dashboard/waitlists/${wl.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <span className="text-base shrink-0">🎯</span>
                <span className="truncate">{wl.name}</span>
                {wl.plan !== "free" && (
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-widest text-primary">
                    {wl.plan}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* New project */}
      <div className="px-3 pb-3">
        <Link
          href="/dashboard/waitlists/new"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New project
        </Link>
      </div>
    </aside>
  );
}
