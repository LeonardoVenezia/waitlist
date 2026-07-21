import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  return (
    <>
      {clientToken && (
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          strategy="afterInteractive"
          onLoad={() => {
            window.Paddle?.Checkout?.open;
          }}
        />
      )}
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-end border-b px-6">
            <UserNav
              email={user.email!}
              fullName={profile?.full_name ?? null}
            />
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
