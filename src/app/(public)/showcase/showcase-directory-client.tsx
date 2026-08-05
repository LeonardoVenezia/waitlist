"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

interface Props {
  search: string;
  category: string;
  categories: string[];
  children: React.ReactNode;
}

export default function ShowcaseDirectoryClient({ search, category, categories, children }: Props) {
  const router = useRouter();

  function updateParams(updates: { search?: string; category?: string }) {
    const params = new URLSearchParams();
    const newSearch = updates.search !== undefined ? updates.search : search;
    const newCategory = updates.category !== undefined ? updates.category : category;
    if (newSearch) params.set("search", newSearch);
    if (newCategory) params.set("category", newCategory);
    router.push(`/showcase?${params.toString()}`);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <Input
          placeholder="Search products..."
          defaultValue={search}
          onChange={(e) => {
            const v = e.target.value;
            updateParams({ search: v });
          }}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ category: "" })}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              !category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => updateParams({ category: c })}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {children}
    </>
  );
}
