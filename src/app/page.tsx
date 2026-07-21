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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            [PACK]
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Build hype before you launch
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Create a viral waitlist with unique referral links. Watch your list
              grow as people share and climb the ranks.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Create your waitlist</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-24 grid gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">Referral loop</h3>
              <p className="text-sm text-muted-foreground">
                Every signup gets a unique referral link. Subscribers climb the
                leaderboard by bringing friends.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Embed anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Add our widget to your site with a single script tag, or use our
                hosted page.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">One-time payment</h3>
              <p className="text-sm text-muted-foreground">
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

