"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { hasFeature, type Plan } from "@/lib/plan-gates";

interface FeatureGateProps {
  plan: Plan;
  feature: string;
  waitlistId: string;
  children: React.ReactNode;
  className?: string;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

export function FeatureGate({
  plan,
  feature,
  waitlistId,
  children,
  className,
}: FeatureGateProps) {
  const unlocked = hasFeature(plan, feature);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none opacity-50 [&_*]:pointer-events-none">
        {children}
      </div>
      <Link
        href={`/dashboard/waitlists/${waitlistId}/upgrade`}
        className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 rounded-md bg-background/60 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
      >
        <LockIcon className="h-3 w-3" />
        Upgrade to unlock
      </Link>
    </div>
  );
}
