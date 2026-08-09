"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface Props {
  search: string;
  category: string;
  categories: string[];
  children: React.ReactNode;
}

export default function ProductsDirectoryClient({ search: initialSearch, category: initialCategory, categories, children }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);

  function updateParams(updates: { search?: string; category?: string }) {
    const newSearch = updates.search !== undefined ? updates.search : search;
    const newCategory = updates.category !== undefined ? updates.category : category;

    if (updates.search !== undefined) setSearch(updates.search);
    if (updates.category !== undefined) setCategory(updates.category);

    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newCategory) params.set("category", newCategory);

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            const v = e.target.value;
            setSearch(v);
            updateParams({ search: v });
          }}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ category: "" })}
            className={`text-xs px-3 py-1 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring cursor-pointer ${
              !category ? "bg-primary text-primary-foreground" : "bg-muted/50 border text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => updateParams({ category: c })}
              className={`text-xs px-3 py-1 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring cursor-pointer ${
                category === c ? "bg-primary text-primary-foreground" : "bg-muted/50 border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-xl border bg-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        children
      )}
    </>
  );
}
