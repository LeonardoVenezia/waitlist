"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

const productSubNav = [
  { label: "Overview", href: (id: string) => `/dashboard/showcases/${id}`, icon: "📦" },
];

const waitlistSubNav = [
  { label: "Overview", href: (id: string) => `/dashboard/projects/${id}`, icon: "📊" },
  { label: "Submissions", href: (id: string) => `/dashboard/projects/${id}/subscribers`, icon: "📧" },
  { label: "Page Builder", href: (id: string) => `/dashboard/projects/${id}/page-builder`, icon: "📄" },
  { label: "Integration", href: (id: string) => `/dashboard/projects/${id}/integration`, icon: "🔌" },
  { label: "Analytics", href: (id: string) => `/dashboard/projects/${id}/analytics`, icon: "📈" },
  { label: "Export", href: (id: string) => `/dashboard/projects/${id}/export`, icon: "📦" },
  { label: "Settings", href: (id: string) => `/dashboard/projects/${id}/settings`, icon: "⚙️" },
];

const testimonialSubNav = [
  { label: "Testimonials", href: (id: string) => `/dashboard/projects/${id}/testimonials`, icon: "💬" },
  { label: "Forms", href: (id: string) => `/dashboard/projects/${id}/testimonials/forms`, icon: "📝" },
];

function SubNavSection({
  label,
  items,
  currentId,
  pathname,
  isExpanded,
  onToggle,
}: {
  label: string;
  items: Array<{ label: string; href: (id: string) => string; icon: string }>;
  currentId: string;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="px-3 pb-2 shrink-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-2 pt-3 pb-2 text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <svg
          className={cn("size-3 transition-transform", isExpanded ? "rotate-90" : "")}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {isExpanded && (
        <nav className="space-y-0.5">
          {items.map((item) => {
            const href = item.href(currentId);
            const isActive = item.label === "Overview" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <span className="text-sm shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function Sidebar({
  projects,
}: {
  projects: ProjectSummary[];
}) {
  const pathname = usePathname();
  const currentId = pathname.match(/\/(?:projects|showcases)\/([^/]+)/)?.[1] ?? null;
  const [expandedSection, setExpandedSection] = useState<string | null>(() => {
    if (pathname.includes("/showcases/")) return "product";
    if (pathname.includes("/testimonials/")) return "testimonials";
    if (pathname.includes("/projects/")) return "waitlist";
    return null;
  });

  function toggleSection(name: string) {
    setExpandedSection((prev) => (prev === name ? null : name));
  }

  return (
    <aside className="flex w-60 flex-col border-r bg-card overflow-y-auto">
      {/* Brand */}
      <div className="flex h-12 items-center px-5 border-b shrink-0">
        <Link href="/dashboard" className="font-heading text-lg">
          [PACK]
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2 shrink-0">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Projects
        </p>
      </div>

      {/* Project list */}
      <nav className="shrink-0 space-y-0.5 px-3">
        {projects.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No projects yet
          </p>
        ) : (
          projects.map((wl) => {
            const isActive = wl.id === currentId;
            return (
              <Link
                key={wl.id}
                href={`/dashboard/showcases/${wl.id}`}
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

      {/* Product, Testimonials and Waitlist sections */}
      {currentId && (
        <>
          <SubNavSection
            label="Product"
            items={productSubNav}
            currentId={currentId}
            pathname={pathname}
            isExpanded={expandedSection === "product"}
            onToggle={() => toggleSection("product")}
          />
          <SubNavSection
            label="Testimonials"
            items={testimonialSubNav}
            currentId={currentId}
            pathname={pathname}
            isExpanded={expandedSection === "testimonials"}
            onToggle={() => toggleSection("testimonials")}
          />
          <SubNavSection
            label="Waitlist"
            items={waitlistSubNav}
            currentId={currentId}
            pathname={pathname}
            isExpanded={expandedSection === "waitlist"}
            onToggle={() => toggleSection("waitlist")}
          />
        </>
      )}

      <div className="flex-1" />

      {/* New project */}
      <div className="px-3 pb-3 shrink-0">
        <Link
          href="/dashboard/projects/new"
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
