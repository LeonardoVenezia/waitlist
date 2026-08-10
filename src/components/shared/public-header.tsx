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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-xl">
          [PACK]
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/launches"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              currentTab === "launches"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Launches
          </Link>
          <Link
            href="/products"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              currentTab === "products"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All products
          </Link>
          <Link
            href="/coming-soon"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
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
