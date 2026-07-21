"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Subscriber = Database["public"]["Tables"]["subscribers"]["Row"];

const PAGE_SIZE = 25;

export function SubscribersTable({
  subscribers,
  hiddenCount,
  waitlistId,
}: {
  subscribers: Subscriber[];
  hiddenCount: number;
  waitlistId: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return subscribers;
    const q = search.toLowerCase();
    return subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        s.referral_code.toLowerCase().includes(q),
    );
  }, [subscribers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      {hiddenCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {hiddenCount} subscriber{hiddenCount === 1 ? " is" : "s are"} hidden
          because you exceeded your plan limit.{" "}
          <Link
            href={`/dashboard/waitlists/${waitlistId}/upgrade`}
            className="font-medium underline"
          >
            Upgrade to see them
          </Link>
        </div>
      )}

      <Input
        placeholder="Search by email or referral code…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-20 text-center">Referrals</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  {search ? "No matching subscribers" : "No subscribers yet"}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((sub, i) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs">
                    {currentPage * PAGE_SIZE + i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell className="text-center">
                    {sub.referral_count}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === "active"
                          ? "bg-green-100 text-green-800"
                          : sub.status === "hidden"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
