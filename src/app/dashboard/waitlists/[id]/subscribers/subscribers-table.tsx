"use client";

import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
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

export function SubscribersTable({
  subscribers,
  hiddenCount,
  waitlistId,
  page,
  totalPages,
}: {
  subscribers: Subscriber[];
  hiddenCount: number;
  waitlistId: string;
  page: number;
  totalPages: number;
}) {
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
            {subscribers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No subscribers yet
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((sub, i) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs">
                    {page * 25 + i + 1}
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
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Link
              href={page > 0 ? `/dashboard/waitlists/${waitlistId}/subscribers?page=${page}` : "#"}
            >
              <Button variant="outline" size="sm" disabled={page === 0}>
                Previous
              </Button>
            </Link>
            <Link
              href={page < totalPages - 1 ? `/dashboard/waitlists/${waitlistId}/subscribers?page=${page + 2}` : "#"}
            >
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1}>
                Next
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
