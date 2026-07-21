export function getPaddleClientToken(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
}

export function getPaddlePriceIds(): { launch: string; grow: string } {
  return {
    launch: process.env.PADDLE_PRICE_LAUNCH ?? "",
    grow: process.env.PADDLE_PRICE_GROW ?? "",
  };
}

export type PaddleEventName = "transaction.completed" | "transaction.refunded";

export interface PaddleWebhookPayload {
  event_id: string;
  event_type: PaddleEventName;
  occurred_at: string;
  data: {
    id: string;
    status: string;
    details: {
      line_items: Array<{
        price: {
          id: string;
          product_id: string;
        };
        quantity: number;
        total: string;
        tax: string;
      }>;
    };
    custom_data?: {
      account_id?: string;
      waitlist_id?: string;
      plan?: string;
    };
    currency_code: string;
    total: string;
    tax: string;
  };
}

const PLAN_BY_PRICE: Record<string, string> = {};

export function registerPriceMapping(priceId: string, plan: string) {
  // This is populated at build time from env vars
  if (priceId) PLAN_BY_PRICE[priceId] = plan;
}

// Register known price IDs
registerPriceMapping(process.env.PADDLE_PRICE_LAUNCH ?? "", "launch");
registerPriceMapping(process.env.PADDLE_PRICE_GROW ?? "", "grow");

export function getPlanFromPrice(priceId: string): string | undefined {
  return PLAN_BY_PRICE[priceId];
}

export const PLAN_LIMITS_FROM_PADDLE: Record<string, number> = {
  launch: 500,
  grow: 10000,
};
