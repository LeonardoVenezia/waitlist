import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/claims");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/claims" className="font-heading text-lg">
            [PACK] Admin
          </Link>
          <span className="text-xs text-muted-foreground">Logged in as {user.email}</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to app
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
