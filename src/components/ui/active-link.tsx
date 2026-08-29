"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface ActiveLinkProps {
  href: string;
  match?: "exact" | "prefix";
  leftIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function ActiveLink({
  href,
  match = "prefix",
  leftIcon,
  className,
  children,
}: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive = match === "exact" ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        className,
      )}
    >
      {leftIcon}
      {children}
    </Link>
  );
}
