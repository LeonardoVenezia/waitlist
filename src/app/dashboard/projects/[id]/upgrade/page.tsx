import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { PaddleInit } from "@/components/shared/paddle-init";
import { UpgradeContent } from "./upgrade-content";

export default async function UpgradePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const launchPriceId = process.env.PADDLE_PRICE_LAUNCH ?? "";
  const growPriceId = process.env.PADDLE_PRICE_GROW ?? "";

  return (
    <div>
      {process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && (
        <>
          <Script
            src="https://cdn.paddle.com/paddle/v2/paddle.js"
            strategy="afterInteractive"
          />
          <PaddleInit />
        </>
      )}
      <UpgradeContent
        project={waitlist}
        priceIds={{
          launch: launchPriceId,
          grow: growPriceId,
        }}
      />
    </div>
  );
}