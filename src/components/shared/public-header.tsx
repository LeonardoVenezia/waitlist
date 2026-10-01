import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Props {
  currentTab?: "launches" | "products" | "coming-soon";
}

export async function PublicHeader({ currentTab }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:px-6 sm:py-0">
        <Link href="/" className="font-heading text-xl">
          [PACK]
        </Link>
        <nav className="order-3 flex w-full min-w-0 items-center justify-between gap-0.5 sm:order-none sm:w-auto sm:gap-1">
          <Link
            href="/launches"
            className={`rounded-md px-1.5 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm ${
              currentTab === "launches"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Launches
          </Link>
          <Link
            href="/products"
            className={`rounded-md px-1.5 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm ${
              currentTab === "products"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All products
          </Link>
          <Link
            href="/coming-soon"
            className={`rounded-md px-1.5 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm ${
              currentTab === "coming-soon"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Coming soon
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
