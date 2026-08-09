"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createWaitlist } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type State = { error?: string; success?: boolean; id?: string; slug?: string } | null;

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function CreateWaitlistForm({
  accountId,
}: {
  accountId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallySet, setSlugManuallySet] = useState(false);

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      formData.set("account_id", accountId);
      formData.set("slug", slug || toSlug(name));
      return createWaitlist(null, formData);
    },
    null,
  );

  if (state?.success && state?.id) {
    router.push(`/dashboard/showcases/${state.id}`);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallySet) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManuallySet(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create project</CardTitle>
          <CardDescription>
            Elegí un nombre y una URL para tu proyecto. Después podés configurar tu producto y waitlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="My Product"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug <span className="text-red-500">*</span></Label>
              <Input
                id="slug"
                name="slug"
                placeholder="my-product"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                pattern="[a-z0-9\-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
              <p className="text-xs text-muted-foreground">
                {slug ? `/product/${slug}` : "/product/my-product"}
              </p>
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating..." : "Create project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
