import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getWaitlistLimit } from "@/lib/plans";
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

  // Single source of truth: the limit comes from the plan (same as enforcement in /api/public/subscribe).
  const planLimit = getWaitlistLimit(waitlist.plan);

  const cookieStore = await cookies();
  const dismissedOnboarding = cookieStore.get("onboarding-dismissed")?.value === "true";

  const { data: showcase } = await supabase
    .from("showcases")
    .select("id, status")
    .eq("waitlist_id", id)
    .maybeSingle();

  const { count: formCount } = await supabase
    .from("testimonial_forms")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

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
    supabase.from("page_events").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("type", "view").eq("source", "hosted"),
    supabase.from("page_events").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("type", "signup").eq("source", "hosted"),
  ]);

  const totalActive = activeCount ?? 0;
  const totalHidden = hiddenCount ?? 0;
  const pageViews = totalViews ?? 0;
  const pageSignupCount = pageSignups ?? 0;
  const conversionRate = pageViews > 0 ? Math.round((pageSignupCount / pageViews) * 1000) / 10 : null;
  const nearLimit = planLimit && totalActive >= planLimit * 0.8;
  const steps = [
    {
      key: "share",
      title: "Share your waitlist",
      description: "Send people to your page. They subscribe and get a referral link.",
      done: totalActive > 0 || totalHidden > 0 || pageViews > 0,
      href: `/dashboard/projects/${id}/page-builder`,
      cta: "Customize your page",
    },
    {
      key: "listing",
      title: "List your product in the directory",
      description: "Publish your product page to get discovered and earn a backlink.",
      done: showcase?.status === "published",
      href: `/dashboard/showcases/${id}`,
      cta: showcase ? "Finish your listing" : "Set up your listing",
    },
    {
      key: "testimonials",
      title: "Collect your first testimonial",
      description: "Create a form and send the link to your first users.",
      done: (formCount ?? 0) > 0,
      href: `/dashboard/projects/${id}/testimonials`,
      cta: "Set up testimonials",
    },
  ];
  const doneCount = steps.filter((st) => st.done).length;
  const allStepsDone = doneCount === steps.length;

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

      {/* Getting-started checklist: stays until every step is done or it is dismissed for this project */}
      {!allStepsDone && !dismissedOnboarding && (
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4 max-w-prose w-full">
              <div>
                <h2 className="font-heading text-lg font-semibold">Get your launch ready</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {doneCount} of {steps.length} done. Each step takes about two minutes.
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }}
                  />
                </div>
              </div>
              <ol className="space-y-4 text-sm text-muted-foreground">
                {steps.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span
                      className={`shrink-0 mt-0.5 flex size-5 items-center justify-center rounded-full border text-xs ${
                        step.done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                      }`}
                      aria-label={step.done ? "Done" : "To do"}
                    >
                      {step.done ? "✓" : i + 1}
                    </span>
                    <div>
                      <p className={`font-medium ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {step.title}
                      </p>
                      {!step.done && <p>{step.description}</p>}
                      {!step.done && step.key === "share" && (
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
                      )}
                      {!step.done && (
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-medium"
                        >
                          {step.cta} →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <form action="/api/dismiss-onboarding" method="POST">
              <input type="hidden" name="path" value={`/dashboard/projects/${id}`} />
              <button
                type="submit"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Hide checklist"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {totalActive === 0 && totalHidden === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No signups yet</p>
          <p className="mt-1">Share your waitlist link to get the first one. Try signing up yourself to see the full flow.</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] sm:max-w-xs">{publicUrl}</code>
            <CopyButton text={publicUrl} />
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
            {planLimit ? `/ ${planLimit} max` : "· Unlimited"}
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
          You&apos;re approaching your plan limit ({totalActive} of {planLimit}).{" "}
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
          { label: "Thank You", href: "thank-you" },
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
              <p className="text-xl mt-0.5">{planLimit ?? "Unlimited"}</p>
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
