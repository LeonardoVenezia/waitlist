import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/copy-button";

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const cookieStore = await cookies();
  const dismissedOnboarding = cookieStore.get("onboarding-dismissed")?.value === "true";

  const { data: showcase } = await supabase
    .from("showcases")
    .select("id, status")
    .eq("waitlist_id", id)
    .maybeSingle();

  const [
    { count: activeCount },
    { count: hiddenCount },
    { data: recent },
    { count: totalViews },
    { count: pageSignups },
  ] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("status", "active"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("status", "hidden"),
    supabase.from("subscribers").select("email, referral_count, created_at").eq("waitlist_id", id).eq("status", "active").order("created_at", { ascending: false }).limit(5),
    supabase.from("page_events").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("type", "view"),
    supabase.from("page_events").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("type", "signup"),
  ]);

  const totalActive = activeCount ?? 0;
  const totalHidden = hiddenCount ?? 0;
  const pageViews = totalViews ?? 0;
  const pageSignupCount = pageSignups ?? 0;
  const conversionRate = pageViews > 0 ? Math.round((pageSignupCount / pageViews) * 1000) / 10 : null;
  const nearLimit = waitlist.submission_limit && totalActive >= waitlist.submission_limit * 0.8;
  const isNewProject = totalActive === 0 && totalHidden === 0 && pageViews === 0;

  const headersList = await headers();
  const host = headersList.get("host") ?? process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/p/${waitlist.slug}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl truncate">{waitlist.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            /p/{waitlist.slug}
          </p>
        </div>
      </div>

      {/* Onboarding card — only for new projects, dismissable */}
      {isNewProject && !dismissedOnboarding && (
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 max-w-prose">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <h2 className="font-heading text-lg font-semibold">Your project is ready</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="shrink-0 mt-0.5 text-base">1.</span>
                  <div>
                    <p className="font-medium text-foreground">Share your waitlist</p>
                    <p>Send people to your landing page. They can subscribe and get a referral link.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] sm:max-w-xs">{publicUrl}</code>
                      <CopyButton text={publicUrl} />
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 mt-0.5 text-base">2.</span>
                  <div>
                    <p className="font-medium text-foreground">Add your product to the directory</p>
                    <p>Create your showcase page to get featured in our directory and attract more users.</p>
                    <Link
                      href={`/dashboard/showcases/${id}`}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-medium"
                    >
                      {showcase?.status === "published" ? "Edit your listing →" : "Set up your listing →"}
                    </Link>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 mt-0.5 text-base">3.</span>
                  <div>
                    <p className="font-medium text-foreground">Collect testimonials</p>
                    <p>Create a form and start gathering social proof from your users.</p>
                    <Link
                      href={`/dashboard/projects/${id}/testimonials`}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-medium"
                    >
                      Set up testimonials →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <form action="/api/dismiss-onboarding" method="POST">
              <input type="hidden" name="path" value={`/dashboard/projects/${id}`} />
              <button
                type="submit"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Dismiss"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Compact stat bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-card px-5 py-3 text-sm">
        <div>
          <span className="text-muted-foreground">Subscribers</span>
          <span className="ml-2 font-medium">{totalActive}</span>
          {totalHidden > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({totalHidden} hidden)
            </span>
          )}
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="text-muted-foreground">Plan</span>
          <span className="ml-2 font-medium capitalize">{waitlist.plan}</span>
          <span className="ml-1 text-muted-foreground">
            {waitlist.submission_limit ? `/ ${waitlist.submission_limit} max` : "· Unlimited"}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="text-muted-foreground">Waitlist URL</span>
          <code className="ml-2 text-xs text-muted-foreground">
            {publicUrl}
          </code>
        </div>
      </div>

      {/* Hidden subscribers alert */}
      {totalHidden > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {totalHidden} subscriber{totalHidden === 1 ? "" : "s"} hidden —{" "}
          <Link href={`/dashboard/projects/${id}/upgrade`} className="font-medium underline">
            upgrade your plan
          </Link>{" "}
          to see them.
        </div>
      )}

      {/* Near-limit alert */}
      {nearLimit && totalHidden === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You&apos;re approaching your plan limit ({totalActive} of {waitlist.submission_limit}).{" "}
          <Link href={`/dashboard/projects/${id}/upgrade`} className="font-medium underline">
            Upgrade to keep growing
          </Link>
        </div>
      )}

      {/* Tab navigation */}
      <nav className="flex gap-1 border-b">
        {[
          { label: "Subscribers", href: "subscribers" },
          { label: "Page Builder", href: "page-builder" },
          { label: "Integration", href: "integration" },
          { label: "Analytics", href: "analytics" },
          { label: "Export", href: "export" },
          { label: "Settings", href: "settings" },
        ].map((tab) => {
          return (
            <Link
              key={tab.href}
              href={`/dashboard/projects/${id}/${tab.href}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Hosted page analytics */}
      {pageViews > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Hosted page analytics</h2>
            <span className="text-[11px] text-muted-foreground/60">Hosted page only</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href={`/dashboard/projects/${id}/analytics`} className="block p-5 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
              <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Page views</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums">{pageViews}</dd>
            </Link>
            <Link href={`/dashboard/projects/${id}/analytics`} className="block p-5 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
              <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Signups from page</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums">{pageSignupCount}</dd>
            </Link>
            <div className="p-5 rounded-xl border bg-card">
              <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Conversion rate</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums">
                {conversionRate !== null ? `${conversionRate}%` : <span className="text-muted-foreground/40">—</span>}
              </dd>
            </div>
          </div>
        </section>
      )}

      {/* Overview content: recent signups + quick stats */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: recent signups */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base">Recent signups</h2>
          {recent && recent.length > 0 ? (
            <div className="space-y-1">
              {recent.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent/30 transition-colors"
                >
                  <span>{s.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.referral_count > 0
                      ? `${s.referral_count} referral${s.referral_count > 1 ? "s" : ""}`
                      : "new"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No signups yet. Share your waitlist to get started.
            </p>
          )}
          {recent && recent.length > 0 && (
            <Link
              href={`/dashboard/projects/${id}/subscribers`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all subscribers →
            </Link>
          )}
        </div>

        {/* Right: quick stats */}
        <div className="space-y-4">
          <h2 className="text-base">At a glance</h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Active subscribers</p>
              <p className="text-xl mt-0.5">{totalActive}</p>
            </div>
            <div className="rounded-lg bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Plan limit</p>
              <p className="text-xl mt-0.5">{waitlist.submission_limit ?? "Unlimited"}</p>
            </div>
            <div className="rounded-lg bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Waitlist URL</p>
              <p className="text-xs font-mono mt-1 text-muted-foreground break-all">
                {publicUrl}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
