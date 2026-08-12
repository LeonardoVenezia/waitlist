"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteSubscriber } from "./actions";

type Subscriber = Database["public"]["Tables"]["subscribers"]["Row"];

interface Filters {
  search: string;
  verified: string;
  dateFrom: string;
  dateUntil: string;
  emailStatus: string;
}

export function SubscribersTable({
  subscribers,
  hiddenCount,
  waitlistId,
  page,
  totalPages,
  totalCount,
  pageSize,
  filters,
}: {
  subscribers: Subscriber[];
  hiddenCount: number;
  waitlistId: string;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  filters: Filters;
}) {
  const router = useRouter();
  const rawParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Email validation
  const [validating, setValidating] = useState<Set<string>>(new Set());

  const validateOne = async (id: string) => {
    setValidating((prev) => new Set(prev).add(id));
    await fetch("/api/projects/subscribers/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberId: id }),
    });
    setValidating((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    router.refresh();
  };

  const validateAll = async () => {
    startTransition(async () => {
      for (const sub of subscribers) {
        if (!sub.email_status) {
          await validateOne(sub.id);
        }
      }
    });
  };

  const unvalidatedCount = subscribers.filter((s) => !s.email_status).length;
  const allSelected =
    subscribers.length > 0 && subscribers.every((s) => selected.has(s.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(subscribers.map((s) => s.id)));
    }
  };

  // Delete single
  const deleteSingle = async (id: string) => {
    if (!confirm("Delete this subscriber?")) return;
    await deleteSubscriber(id);
    router.refresh();
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} subscriber(s)?`)) return;
    startTransition(async () => {
      for (const id of selected) {
        await deleteSubscriber(id);
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  // Details modal
  const [detailSub, setDetailSub] = useState<Subscriber | null>(null);

  // Build URL with updated filters
  const buildUrl = useCallback(
    (updates: Partial<Filters>) => {
      const params = new URLSearchParams(rawParams.toString());
      const merged = { ...filters, ...updates };
      if (merged.search) params.set("search", merged.search);
      else params.delete("search");
      if (merged.verified) params.set("verified", merged.verified);
      else params.delete("verified");
      if (merged.dateFrom) params.set("date_from", merged.dateFrom);
      else params.delete("date_from");
      if (merged.dateUntil) params.set("date_until", merged.dateUntil);
      else params.delete("date_until");
      if (merged.emailStatus) params.set("email_status", merged.emailStatus);
      else params.delete("email_status");
      params.delete("page");
      return `/dashboard/projects/${waitlistId}/subscribers?${params.toString()}`;
    },
    [filters, rawParams, waitlistId],
  );

  // Debounced search
  const [searchValue, setSearchValue] = useState(filters.search);
  const handleSearch = (value: string) => {
    setSearchValue(value);
    const timeout = setTimeout(() => {
      router.push(buildUrl({ search: value }));
    }, 400);
    return () => clearTimeout(timeout);
  };

  const hasFilters =
    filters.search ||
    filters.verified ||
    filters.dateFrom ||
    filters.dateUntil ||
    filters.emailStatus;

  const resetFilters = () => {
    setSearchValue("");
    router.push(`/dashboard/projects/${waitlistId}/subscribers`);
  };

  // Column visibility — from URL or default
  const cols = {
    name: rawParams.get("col_name") !== "0",
    country: rawParams.get("col_country") !== "0",
  };

  const toggleCol = (col: "name" | "country") => {
    const params = new URLSearchParams(rawParams.toString());
    params.set(`col_${col}`, cols[col] ? "0" : "1");
    router.push(
      `/dashboard/projects/${waitlistId}/subscribers?${params.toString()}`,
    );
  };

  const start = page * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount);

  return (
    <div className="space-y-4">
      {hiddenCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {hiddenCount} subscriber{hiddenCount === 1 ? " is" : "s are"} hidden
          because you exceeded your plan limit.{" "}
          <Link
            href={`/dashboard/projects/${waitlistId}/upgrade`}
            className="font-medium underline"
          >
            Upgrade to see them
          </Link>
        </div>
      )}

      {/* Search + Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder="Search emails..."
            className="pl-8"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={filters.verified}
          onChange={(e) => router.push(buildUrl({ verified: e.target.value }))}
        >
          <option value="">All emails</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>

        <input
          type="date"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={filters.dateFrom}
          onChange={(e) =>
            router.push(buildUrl({ dateFrom: e.target.value }))
          }
          title="From date"
        />
        <input
          type="date"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={filters.dateUntil}
          onChange={(e) =>
            router.push(buildUrl({ dateUntil: e.target.value }))
          }
          title="Until date"
        />

        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={filters.emailStatus}
          onChange={(e) =>
            router.push(buildUrl({ emailStatus: e.target.value }))
          }
        >
          <option value="">All status</option>
          <option value="deliverable">Deliverable</option>
          <option value="risky">Risky</option>
          <option value="undeliverable">Undeliverable</option>
          <option value="unknown">Unknown</option>
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        )}
        {unvalidatedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={validateAll}>
            Validate {unvalidatedCount} emails
          </Button>
        )}
      </div>

      {/* Column toggling + bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
              <Button
                variant="destructive"
                size="xs"
                onClick={bulkDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Delete selected"}
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCol("name")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              cols.name
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Name
          </button>
          <button
            onClick={() => toggleCol("country")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              cols.country
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Country
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="size-3.5 rounded"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16">Pos</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-20 text-center">Verif.</TableHead>
              <TableHead className="w-24 text-center">Referrals</TableHead>
              {cols.name && <TableHead className="w-32">Name</TableHead>}
              {cols.country && (
                <TableHead className="w-20">Country</TableHead>
              )}
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "No subscribers match your filters"
                    : "No subscribers yet"}
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((sub, i) => {
                const isSel = selected.has(sub.id);
                return (
                  <TableRow
                    key={sub.id}
                    className={isSel ? "bg-muted/50" : undefined}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="size-3.5 rounded"
                        checked={isSel}
                        onChange={() => toggleSelect(sub.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {start + i}
                    </TableCell>
                    <TableCell>
                      <button
                        className="font-medium underline decoration-1 underline-offset-2 hover:decoration-primary-500 hover:text-primary-600"
                        onClick={() => setDetailSub(sub)}
                      >
                        {sub.email}
                      </button>
                    </TableCell>
                    <TableCell>
                      {sub.email_status ? (
                        <Badge
                          variant={
                            sub.email_status === "deliverable"
                              ? "default"
                              : sub.email_status === "risky"
                                ? "secondary"
                                : sub.email_status === "undeliverable"
                                  ? "destructive"
                                  : sub.email_status === "unknown"
                                    ? "outline"
                                    : "ghost"
                          }
                        >
                          {sub.email_status}
                        </Badge>
                      ) : validating.has(sub.id) ? (
                        <span className="text-xs text-muted-foreground">
                          Validating…
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            validateOne(sub.id);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Validate
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.verified ? "✓" : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.referral_count}
                    </TableCell>
                    {cols.name && (
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.name ?? "—"}
                      </TableCell>
                    )}
                    {cols.country && (
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.country ?? "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => deleteSingle(sub.id)}
                        className="text-xs text-destructive hover:underline"
                        title="Delete"
                      >
                        Del
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount > 0
            ? `Showing ${start}–${end} of ${totalCount}`
            : "No results"}
        </span>
        <div className="flex gap-2">
          <Link
            href={
              page > 0
                ? (() => {
                    const p = new URLSearchParams(rawParams.toString());
                    p.set("page", String(page));
                    return `/dashboard/projects/${waitlistId}/subscribers?${p.toString()}`;
                  })()
                : "#"
            }
          >
            <Button variant="outline" size="sm" disabled={page === 0}>
              Previous
            </Button>
          </Link>
          <Link
            href={
              page < totalPages - 1
                ? (() => {
                    const p = new URLSearchParams(rawParams.toString());
                    p.set("page", String(page + 2));
                    return `/dashboard/projects/${waitlistId}/subscribers?${p.toString()}`;
                  })()
                : "#"
            }
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </Link>
        </div>
      </div>

      {/* Detail modal */}
      {detailSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDetailSub(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold">Subscriber details</h2>
              <button
                onClick={() => setDetailSub(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{detailSub.email}</dd>
              </div>
              {detailSub.name && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{detailSub.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{detailSub.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Verified</dt>
                <dd>{detailSub.verified ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email status</dt>
                <dd>{detailSub.email_status ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Referral code</dt>
                <dd className="font-mono text-xs">{detailSub.referral_code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Referrals</dt>
                <dd>{detailSub.referral_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Country</dt>
                <dd>{detailSub.country ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{new Date(detailSub.created_at).toLocaleString()}</dd>
              </div>
              {detailSub.metadata && typeof detailSub.metadata === "object" && (
                <>
                  {(detailSub.metadata as Record<string, unknown>).ip && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">IP</dt>
                      <dd className="font-mono text-xs">
                        {String(
                          (detailSub.metadata as Record<string, unknown>).ip,
                        )}
                      </dd>
                    </div>
                  )}
                  {(detailSub.metadata as Record<string, unknown>)
                    .user_agent && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">User agent</dt>
                      <dd className="max-w-[200px] truncate text-xs">
                        {String(
                          (detailSub.metadata as Record<string, unknown>)
                            .user_agent,
                        )}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteSingle(detailSub.id);
                  setDetailSub(null);
                }}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailSub(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
