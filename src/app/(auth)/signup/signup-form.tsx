"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, signInWithGoogle } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/shared/google-icon";

type State = { error: string } | { checkEmail: true; email: string } | null;

export function SignUpForm({
  next,
  claim,
}: {
  next: string | null;
  claim: string | null;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => signUp(null, formData),
    null,
  );

  if (state && "checkEmail" in state) {
    return (
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{state.email}</span>. Click it to
            activate your account.
          </p>
        </div>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {claim && <input type="hidden" name="claim" value={claim} />}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" placeholder="Jane Smith" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={6} />
          <p className="text-xs text-muted-foreground">At least 6 characters</p>
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <form action={async () => { await signInWithGoogle(); }}>
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon className="mr-2 h-4 w-4" />
          Google
        </Button>
      </form>
    </div>
  );
}
