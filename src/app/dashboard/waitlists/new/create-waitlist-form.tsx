"use client";

import { useActionState } from "react";
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

export function CreateWaitlistForm({
  accountId,
}: {
  accountId: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      formData.set("account_id", accountId);
      return createWaitlist(null, formData);
    },
    null,
  );

  if (state?.success && state?.id) {
    router.push(`/dashboard/waitlists/${state.id}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create waitlist</CardTitle>
          <CardDescription>
            Name your waitlist and choose a URL slug.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Product Launch"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="my-product"
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
              <p className="text-xs text-muted-foreground">
                Your page will be at /p/my-product
              </p>
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating..." : "Create waitlist"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
