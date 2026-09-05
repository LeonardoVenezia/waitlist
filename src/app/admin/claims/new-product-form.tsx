"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SHOWCASE_CATEGORIES } from "@/lib/showcase";

type State = { error?: string; success?: boolean; slug?: string } | null;

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallySet, setSlugManuallySet] = useState(false);
  const [description, setDescription] = useState("");

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => createAdminProduct(null, formData),
    null,
  );

  // Surface success, then reset so another product can be created.
  if (state?.success) {
    router.refresh();
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallySet) setSlug(toSlug(value));
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="np-name">Name *</Label>
          <Input
            id="np-name"
            name="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Analytics"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="np-slug">Slug *</Label>
          <Input
            id="np-slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallySet(true);
            }}
            placeholder="acme-analytics"
            required
            pattern="[a-z0-9\-]+"
            title="Lowercase letters, numbers, and hyphens only"
          />
          <p className="text-xs text-muted-foreground">/product/{slug || "..."}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="np-cat1">Category 1 *</Label>
          <Select id="np-cat1" name="category_1" required defaultValue="">
            <option value="" disabled>Seleccionar...</option>
            {SHOWCASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="np-cat2">Category 2 (optional)</Label>
          <Select id="np-cat2" name="category_2" defaultValue="">
            <option value="">Ninguna</option>
            {SHOWCASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="np-link">Product link (optional)</Label>
        <Input
          id="np-link"
          name="link"
          type="url"
          placeholder="https://acme.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="np-desc">
          Description *{" "}
          <span className={description.length < 200 ? "text-destructive" : "text-success"}>
            {description.length}/200 min
          </span>
        </Label>
        <Textarea
          id="np-desc"
          name="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product in at least 200 characters..."
          required
        />
      </div>

      <Checkbox
        name="claimable"
        label="Claimable by founder (shows the claim button on the public page)"
        defaultChecked
      />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state?.success && (
        <p className="text-sm text-success">
          Product created — view it at{" "}
          <a href={`/product/${state.slug}`} target="_blank" rel="noopener" className="underline">
            /product/{state.slug}
          </a>
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create product"}
      </Button>
    </form>
  );
}
