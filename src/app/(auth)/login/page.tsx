import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <LoginForm next={sp.next ?? null} claim={sp.claim ?? null} />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
