"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { products } from "@/lib/products";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-16 flex-col border-r bg-muted/30">
      {/* Product icons */}
      <nav className="flex flex-col items-center gap-2 p-3">
        {products.map((product) => {
          const isActive = pathname.startsWith(product.href);
          return (
            <Link
              key={product.id}
              href={product.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              title={product.name}
            >
              {product.icon}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile - handled by UserNav component in header */}
    </aside>
  );
}
