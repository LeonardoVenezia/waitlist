"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

interface UserNavProps {
  email: string;
  fullName: string | null;
}

export function UserNav({ email, fullName }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    // Hit the GET sign-out route (already signs the user out and redirects).
    window.location.href = "/dashboard/sign-out";
  }, []);

  const initials = (fullName ?? email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm select-none">
          {initials}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-popover p-1 shadow-md"
        >
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{fullName ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <hr className="mx-1 my-1" />
          <Link
            role="menuitem"
            href="/dashboard/settings/purchases"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            Purchases &amp; receipts
          </Link>
          <hr className="mx-1 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
