import Link from "next/link";
import { SignUpForm } from "./signup-form";

export default async function SignUpPage(props: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Start building your waitlist in minutes
          </p>
        </div>
        <SignUpForm next={sp.next ?? null} claim={sp.claim ?? null} />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
