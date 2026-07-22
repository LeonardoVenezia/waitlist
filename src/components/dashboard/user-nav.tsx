"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserNavProps {
  email: string;
  fullName: string | null;
}

export function UserNav({ email, fullName }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const initials = (fullName ?? email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-popover p-1 shadow-md">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{fullName ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <hr className="mx-1 my-1" />
          <Link
            href="/dashboard/settings/purchases"
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Purchases & receipts
          </Link>
          <hr className="mx-1 my-1" />
          <Link
            href="/dashboard/sign-out"
            className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            Sign out
          </Link>
        </div>
      )}
    </div>
  );
}
