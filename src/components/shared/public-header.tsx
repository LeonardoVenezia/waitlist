import Link from "next/link";

interface Props {
  currentTab?: "launches" | "products";
}

export function PublicHeader({ currentTab }: Props) {
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
        </nav>
      </div>
    </header>
  );
}
