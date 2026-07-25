import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-heading text-xl">
            [PACK]
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="flex flex-col items-center px-6 py-32 text-center">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-5xl leading-tight sm:text-6xl lg:text-7xl">
              Build hype before you launch
            </h1>
            <p className="mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              Create a viral waitlist with unique referral links. Watch your list
              grow as people share and climb the ranks.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-10 px-6">Create your waitlist</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="h-10 px-6">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-32 grid max-w-4xl gap-12 sm:grid-cols-3">
            <div className="space-y-3">
              <h3 className="text-base">Referral loop</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every signup gets a unique referral link. Subscribers climb the
                leaderboard by bringing friends.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base">Embed anywhere</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add our widget to your site with a single script tag, or use our
                hosted page.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base">One-time payment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pay once, use forever. No subscriptions. Free up to 150
                subscribers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
