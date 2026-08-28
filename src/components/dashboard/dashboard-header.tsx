"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserNav } from "./user-nav";

interface ProjectSummary {
  id: string;
  plan: string;
}

export function DashboardHeader({
  userEmail,
  fullName,
  projects,
}: {
  userEmail: string;
  fullName: string | null;
  projects: ProjectSummary[];
}) {
  const pathname = usePathname();

  // Detect the active project from the URL.
  // Works for both /dashboard/projects/[id]/* and /dashboard/showcases/[id]/*.
  const projectMatch = pathname.match(/^\/dashboard\/(?:projects|showcases)\/([^/]+)/);
  const currentProjectId = projectMatch?.[1];

  // Only treat UUIDs as project IDs — "new" is a static route.
  const isUuidLike = currentProjectId && /^[0-9a-f-]{8,}$/i.test(currentProjectId);
  const currentProject = isUuidLike
    ? projects.find((p) => p.id === currentProjectId)
    : undefined;

  const isOnUpgradePage = pathname.endsWith("/upgrade");
  const showUpgrade =
    !!currentProject && currentProject.plan !== "grow" && !isOnUpgradePage;

  return (
    <header className="flex h-12 items-center justify-end gap-3 border-b px-8">
      {showUpgrade && currentProjectId && (
        <Link href={`/dashboard/projects/${currentProjectId}/upgrade`}>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Upgrade
          </button>
        </Link>
      )}
      <UserNav email={userEmail} fullName={fullName} />
    </header>
  );
}
