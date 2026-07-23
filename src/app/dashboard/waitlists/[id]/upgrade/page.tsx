import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { UpgradeContent } from "./upgrade-content";

export default async function UpgradePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const launchPriceId = process.env.PADDLE_PRICE_LAUNCH ?? "";
  const growPriceId = process.env.PADDLE_PRICE_GROW ?? "";

  // Debug: detect missing price IDs
  if (!launchPriceId || !growPriceId) {
    console.error(
      "Missing Paddle price IDs in env:",
      { launch: !!launchPriceId, grow: !!growPriceId },
    );
  }

  return (
    <div>
      {(!launchPriceId || !growPriceId) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-4">
          ⚠️ Missing Paddle price IDs. Set <code>PADDLE_PRICE_LAUNCH</code> and{" "}
          <code>PADDLE_PRICE_GROW</code> in your Vercel environment variables.
          {launchPriceId && <span> Launch: OK</span>}
          {!launchPriceId && <span> Launch: MISSING</span>}
          {growPriceId && <span> Grow: OK</span>}
          {!growPriceId && <span> Grow: MISSING</span>}
        </div>
      )}
      <UpgradeContent
        waitlist={waitlist}
        priceIds={{
          launch: launchPriceId,
          grow: growPriceId,
        }}
      />
    </div>
  );
}
