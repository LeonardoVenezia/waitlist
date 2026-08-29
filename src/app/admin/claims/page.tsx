import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimActions } from "./claim-actions";
import { ClaimableToggle } from "./claimable-toggle";

export const dynamic = "force-dynamic";

type Tab = "pending" | "history" | "showcases";
type SearchParams = Promise<{ tab?: string }>;

export default async function ClaimsPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const tab: Tab =
    sp.tab === "history" || sp.tab === "showcases" ? sp.tab : "pending";

  const admin = createAdminClient();

  // Fetch counts up front so each tab can show its badge.
  const [
    { count: pendingCount },
    { count: historyCount },
    { count: showcasesCount },
  ] = await Promise.all([
    admin
      .from("project_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("project_claims")
      .select("id", { count: "exact", head: true })
      .in("status", ["approved", "rejected"]),
    admin
      .from("showcases")
      .select("id", { count: "exact", head: true })
      .in("status", ["published", "coming_soon"]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Project claims</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approve or reject founder claims, and toggle which products can be
          claimed.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <TabLink
          current={tab}
          value="pending"
          label="Pending"
          count={pendingCount ?? 0}
        />
        <TabLink
          current={tab}
          value="history"
          label="History"
          count={historyCount ?? 0}
        />
        <TabLink
          current={tab}
          value="showcases"
          label="Showcases"
          count={showcasesCount ?? 0}
        />
      </div>

      {tab === "pending" && <PendingTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "showcases" && <ShowcasesTab />}
    </div>
  );
}

async function PendingTab() {
  const admin = createAdminClient();
  const { data: claims } = await admin
    .from("project_claims")
    .select(
      "id, status, message, created_at, showcase_id, claimant_user_id, showcases(slug, name), profiles!project_claims_claimant_user_id_fkey(email, full_name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!claims || claims.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/30 p-12 text-center text-muted-foreground">
        No pending claims right now.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {claims.map((c) => {
        const showcase = c.showcases as { slug: string; name: string } | null;
        const profile = c.profiles as { email: string; full_name: string | null } | null;
        return (
          <li key={c.id} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{showcase?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">
                  Claimed by {profile?.full_name ?? profile?.email ?? "unknown"}
                  {profile?.email && profile?.full_name && (
                    <span className="text-xs"> · {profile.email}</span>
                  )}
                </p>
                {showcase?.slug && (
                  <Link
                    href={`/product/${showcase.slug}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline"
                  >
                    /product/{showcase.slug} ↗
                  </Link>
                )}
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>

            {c.message && (
              <p className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-line">
                {c.message}
              </p>
            )}

            <ClaimActions claimId={c.id} />
          </li>
        );
      })}
    </ul>
  );
}

async function HistoryTab() {
  const admin = createAdminClient();
  const { data: claims } = await admin
    .from("project_claims")
    .select(
      "id, status, message, rejected_reason, created_at, resolved_at, showcase_id, claimant_user_id, showcases(slug, name), profiles!project_claims_claimant_user_id_fkey(email, full_name)",
    )
    .in("status", ["approved", "rejected"])
    .order("resolved_at", { ascending: false })
    .limit(50);

  if (!claims || claims.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/30 p-12 text-center text-muted-foreground">
        No history yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {claims.map((c) => {
        const showcase = c.showcases as { slug: string; name: string } | null;
        const profile = c.profiles as { email: string; full_name: string | null } | null;
        return (
          <li key={c.id} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{showcase?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.email ?? "unknown"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    c.status === "approved"
                      ? "rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium"
                      : "rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium"
                  }
                >
                  {c.status}
                </span>
                {c.resolved_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.resolved_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {c.rejected_reason && (
              <p className="text-sm text-muted-foreground">
                Reason: {c.rejected_reason}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

async function ShowcasesTab() {
  const admin = createAdminClient();
  const { data: showcases } = await admin
    .from("showcases")
    .select("id, name, slug, status, claimable, published_at")
    .in("status", ["published", "coming_soon"])
    .order("name", { ascending: true });

  if (!showcases || showcases.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/30 p-12 text-center text-muted-foreground">
        No published products yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Toggle &quot;Claimable&quot; to make a product appear with a claim
        button on its public page. Default is off — only flip on for products
        you&apos;ve added manually and want founders to claim.
      </p>
      <ul className="space-y-2">
        {showcases.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                <Link
                  href={`/product/${s.slug}`}
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  /product/{s.slug} ↗
                </Link>
                {s.status === "coming_soon" && (
                  <span className="ml-2 rounded-full bg-coming-soon/10 px-2 py-0.5 text-[10px] font-medium uppercase text-coming-soon">
                    coming soon
                  </span>
                )}
              </p>
            </div>
            <ClaimableToggle showcaseId={s.id} initial={s.claimable} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabLink({
  current,
  value,
  label,
  count,
}: {
  current: Tab;
  value: Tab;
  label: string;
  count?: number;
}) {
  const isActive = current === value;
  const href =
    value === "pending"
      ? "/admin/claims"
      : `/admin/claims?tab=${value}`;
  return (
    <Link
      href={href}
      className={
        isActive
          ? "border-b-2 border-primary px-3 py-2 text-sm font-medium"
          : "border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {label}
      {typeof count === "number" && (
        <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
      )}
    </Link>
  );
}
