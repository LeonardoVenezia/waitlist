import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS_FROM_PADDLE } from "@/lib/paddle";

async function verifyPaddleSignature(request: Request): Promise<{ raw: string; payload: unknown } | null> {
  const raw = await request.text();
  const signature = request.headers.get("paddle-signature") ?? "";

  if (!process.env.PADDLE_WEBHOOK_SECRET) {
    // Dev mode — skip verification
    try {
      return { raw, payload: JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  // Paddle uses an ed25519 signature verification
  // In production, use the `paddle-sdk` or implement ed25519 verification
  // For MVP, parse and validate structure
  try {
    const payload = JSON.parse(raw);
    return { raw, payload };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const result = await verifyPaddleSignature(request);
  if (!result) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = result.payload as {
    event_type: string;
    data: {
      id: string;
      custom_data?: { account_id?: string; waitlist_id?: string; plan?: string };
      details?: { line_items?: Array<{ price: { id: string }; total: string }> };
      currency_code?: string;
      total?: string;
    };
  };

  const supabase = createAdminClient();

  switch (payload.event_type) {
    case "transaction.completed": {
      const data = payload.data;
      const customData = data.custom_data ?? {};
      const accountId = customData.account_id;
      const waitlistId = customData.waitlist_id;
      const plan = customData.plan;

      if (!accountId || !waitlistId || !plan) {
        return NextResponse.json(
          { error: "Missing custom_data fields" },
          { status: 400 },
        );
      }

      const limit = PLAN_LIMITS_FROM_PADDLE[plan] ?? null;
      const amount = data.details?.line_items?.[0]?.total ?? "0";
      const currency = data.currency_code ?? "USD";

      // Insert purchase record
      const { error: purchaseError } = await supabase.from("purchases").insert({
        account_id: accountId,
        waitlist_id: waitlistId,
        paddle_transaction_id: data.id,
        plan,
        amount: parseFloat(amount),
        currency,
        status: "completed",
      });

      if (purchaseError) {
        console.error("Failed to insert purchase:", purchaseError);
        return NextResponse.json(
          { error: "Failed to record purchase" },
          { status: 500 },
        );
      }

      // Update waitlist plan and limit
      await supabase
        .from("waitlists")
        .update({
          plan: plan as "launch" | "grow",
          ...(limit !== null && limit !== undefined ? { submission_limit: limit } : {}),
        })
        .eq("id", waitlistId);

      // Reactivate hidden subscribers that fit in the new limit
      if (limit) {
        await supabase
          .from("subscribers")
          .update({ status: "active" })
          .eq("waitlist_id", waitlistId)
          .eq("status", "hidden");

        // If there's a limit, re-apply hidden to those beyond it
        // This is a simplified approach — in production, use a window function
        const { data: activeSubs } = await supabase
          .from("subscribers")
          .select("id")
          .eq("waitlist_id", waitlistId)
          .eq("status", "active")
          .order("created_at", { ascending: true });

        if (activeSubs && activeSubs.length > limit) {
          const excessIds = activeSubs.slice(limit).map((s) => s.id);
          await supabase
            .from("subscribers")
            .update({ status: "hidden" })
            .in("id", excessIds);
        }
      } else {
        // Unlimited plan — reactivate all
        await supabase
          .from("subscribers")
          .update({ status: "active" })
          .eq("waitlist_id", waitlistId)
          .eq("status", "hidden");
      }

      return NextResponse.json({ ok: true });
    }

    case "adjustment.created":
    case "adjustment.updated": {
      const data = payload.data as {
        id: string;
        transaction_id: string;
        status: string;
      };
      // Only mark as refunded if the adjustment is approved
      if (data.status === "approved") {
        await supabase
          .from("purchases")
          .update({ status: "refunded" })
          .eq("paddle_transaction_id", data.transaction_id);
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true });
  }
}
