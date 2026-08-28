import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_LIMITS: Record<string, number> = {
  launch: 1000,
};

async function readVerifiedPayload(request: Request): Promise<{ raw: string; payload: unknown } | null> {
  const raw = await request.text();
  const signature = request.headers.get("paddle-signature") ?? "";

  if (!process.env.PADDLE_WEBHOOK_SECRET) {
    // Dev mode — skip verification (FOLLOW-UP: implement ed25519 verification)
    try {
      return { raw, payload: JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  // TODO(security): implement ed25519 signature verification with PADDLE_WEBHOOK_SECRET.
  // The webhook MUST be signed before subscriptions are activated in production.
  // See PRODUCTION.md — "Paso 6 — Paddle webhook".
  if (!signature) return null;

  try {
    return { raw, payload: JSON.parse(raw) };
  } catch {
    return null;
  }
}

type PaddleSubscriptionPayload = {
  id: string;
  status: string;
  custom_data?: { account_id?: string; waitlist_id?: string; plan?: string };
  current_billing_period?: { ends_at?: string };
  scheduled_change?: { action: string };
  items?: Array<{ price: { id: string }; status?: string }>;
};

type PaddleEvent = {
  event_type: string;
  data: PaddleSubscriptionPayload;
};

export async function POST(request: Request) {
  const result = await readVerifiedPayload(request);
  if (!result) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = result.payload as PaddleEvent;
  const supabase = createAdminClient();

  switch (event.event_type) {
    case "subscription.created":
    case "subscription.updated": {
      const data = event.data;
      const customData = data.custom_data ?? {};
      const accountId = customData.account_id;
      const projectId = customData.waitlist_id;
      const plan = customData.plan ?? "launch";

      if (!accountId || !projectId) {
        return NextResponse.json(
          { error: "Missing custom_data fields" },
          { status: 400 },
        );
      }

      const periodEnd = data.current_billing_period?.ends_at;
      if (!periodEnd) {
        return NextResponse.json(
          { error: "Missing current_billing_period.ends_at" },
          { status: 400 },
        );
      }

      const subscriptionStatus =
        data.status === "active" || data.status === "trialing"
          ? "active"
          : data.status === "canceled"
            ? "canceled"
            : data.status === "past_due"
              ? "past_due"
              : "paused";

      const limit = PLAN_LIMITS[plan] ?? null;

      // Upsert subscription record
      const { error: subError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            account_id: accountId,
            project_id: projectId,
            paddle_subscription_id: data.id,
            plan: plan as "launch",
            status: subscriptionStatus,
            current_period_end: periodEnd,
            cancel_at_period_end: data.scheduled_change?.action === "cancel" ? true : false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "paddle_subscription_id" },
        );

      if (subError) {
        console.error("Failed to upsert subscription:", subError);
        return NextResponse.json(
          { error: "Failed to record subscription" },
          { status: 500 },
        );
      }

      // Activate project plan if subscription is active
      if (subscriptionStatus === "active") {
        await supabase
          .from("projects")
          .update({
            plan: plan as "launch",
            ...(limit !== null ? { submission_limit: limit } : {}),
          })
          .eq("id", projectId);

        // Reactivate any pending_unlock subscribers (waitlist overflow unlocked)
        await supabase
          .from("subscribers")
          .update({ status: "active" })
          .eq("waitlist_id", projectId)
          .eq("status", "pending_unlock");

        // Re-publish the showcase if it was expired
        await supabase
          .from("showcases")
          .update({ status: "published", expired_at: null, expires_at: null })
          .eq("waitlist_id", projectId)
          .eq("status", "expired");
      }

      return NextResponse.json({ ok: true });
    }

    case "subscription.canceled": {
      const data = event.data;
      const customData = data.custom_data ?? {};
      const projectId = customData.waitlist_id;
      const periodEnd = data.current_billing_period?.ends_at;

      if (!projectId) {
        return NextResponse.json(
          { error: "Missing waitlist_id" },
          { status: 400 },
        );
      }

      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          current_period_end: periodEnd ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("paddle_subscription_id", data.id);

      return NextResponse.json({ ok: true });
    }

    case "subscription.paused":
    case "subscription.past_due": {
      const data = event.data;
      const subStatus = event.event_type === "subscription.paused" ? "paused" : "past_due";

      await supabase
        .from("subscriptions")
        .update({ status: subStatus, updated_at: new Date().toISOString() })
        .eq("paddle_subscription_id", data.id);

      return NextResponse.json({ ok: true });
    }

    case "transaction.completed": {
      // Legacy one-time webhook — kept for backward-compat with any historical data.
      // New purchases should come through subscription.created.
      const data = event.data as unknown as {
        id: string;
        custom_data?: { account_id?: string; waitlist_id?: string; plan?: string };
        details?: { line_items?: Array<{ total: string }> };
        currency_code?: string;
        total?: string;
      };
      const customData = data.custom_data ?? {};
      const accountId = customData.account_id;
      const waitlistId = customData.waitlist_id;
      const plan = customData.plan;
      if (!accountId || !waitlistId || !plan) {
        return NextResponse.json({ ok: true });
      }
      const amount = data.details?.line_items?.[0]?.total ?? "0";
      const currency = data.currency_code ?? "USD";
      await supabase.from("purchases").insert({
        account_id: accountId,
        waitlist_id: waitlistId,
        paddle_transaction_id: data.id,
        plan,
        amount: parseFloat(amount),
        currency,
        status: "completed",
      });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true });
  }
}
