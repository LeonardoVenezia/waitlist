import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimActions } from "./claim-actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ tab?: "pending" | "history" }>;

export default async function ClaimsPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const tab = sp.tab === "history" ? "history" : "pending";

  const admin = createAdminClient();

  if (tab === "pending") {
    const { data: claims } = await admin
      .from("project_claims")
      .select(
        "id, status, message, created_at, showcase_id, claimant_user_id, showcases(slug, name), profiles!project_claims_claimant_user_id_fkey(email, full_name)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl">Project claims</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve or reject founder claims on admin-loaded products.
          </p>
        </div>

        <div className="flex gap-2 border-b">
          <TabLink current={tab} value="pending" label="Pending" count={claims?.length ?? 0} />
          <TabLink current={tab} value="history" label="History" />
        </div>

        {claims && claims.length > 0 ? (
          <ul className="space-y-3">
            {claims.map((c) => {
              const showcase = c.showcases as { slug: string; name: string } | null;
              const profile = c.profiles as { email: string; full_name: string | null } | null;
              return (
                <li
                  key={c.id}
                  className="rounded-xl border bg-card p-5 space-y-3"
                >
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
        ) : (
          <div className="rounded-xl border bg-muted/30 p-12 text-center text-muted-foreground">
            No pending claims right now.
          </div>
        )}
      </div>
    );
  }

  // history tab
  const { data: claims } = await admin
    .from("project_claims")
    .select(
      "id, status, message, rejected_reason, created_at, resolved_at, showcase_id, claimant_user_id, showcases(slug, name), profiles!project_claims_claimant_user_id_fkey(email, full_name)",
    )
    .in("status", ["approved", "rejected"])
    .order("resolved_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Project claims</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approve or reject founder claims on admin-loaded products.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <TabLink current={tab} value="pending" label="Pending" />
        <TabLink current={tab} value="history" label="History" count={claims?.length ?? 0} />
      </div>

      {claims && claims.length > 0 ? (
        <ul className="space-y-3">
          {claims.map((c) => {
            const showcase = c.showcases as { slug: string; name: string } | null;
            const profile = c.profiles as { email: string; full_name: string | null } | null;
            return (
              <li
                key={c.id}
                className="rounded-xl border bg-card p-4 space-y-2"
              >
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
      ) : (
        <div className="rounded-xl border bg-muted/30 p-12 text-center text-muted-foreground">
          No history yet.
        </div>
      )}
    </div>
  );
}

function TabLink({
  current,
  value,
  label,
  count,
}: {
  current: "pending" | "history";
  value: "pending" | "history";
  label: string;
  count?: number;
}) {
  const isActive = current === value;
  return (
    <Link
      href={value === "pending" ? "/admin/claims" : "/admin/claims?tab=history"}
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
