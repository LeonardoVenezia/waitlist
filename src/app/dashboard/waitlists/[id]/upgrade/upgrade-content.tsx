"use client";

import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/lib/supabase/types";
import { getPaddleClientToken, getPaddlePriceIds } from "@/lib/paddle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Waitlist = Database["public"]["Tables"]["waitlists"]["Row"];

type PaddleInstance = {
  Checkout: {
    open: (options: {
      items: Array<{ priceId: string; quantity: number }>;
      customData: Record<string, string>;
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  priceId: string;
  limit: string;
  features: string[];
}

export function UpgradeContent({ waitlist }: { waitlist: Waitlist }) {
  const [paddleReady, setPaddleReady] = useState(false);
  const clientToken = getPaddleClientToken();
  const priceIds = getPaddlePriceIds();

  const plans: PlanOption[] = [
    {
      id: "launch",
      name: "Launch",
      price: "$29",
      priceId: priceIds.launch,
      limit: "500 submissions",
      features: [
        "Double opt-in verification",
        "Welcome email",
        "Slack notifications",
        "Position adjustments",
        "Rewards & milestones",
        "Multi-language",
      ],
    },
    {
      id: "grow",
      name: "Grow",
      price: "$79",
      priceId: priceIds.grow,
      limit: "10,000 submissions",
      features: [
        "Everything in Launch",
        "Team members",
        "Webhooks & Zapier",
        "Remove branding",
        "AJAX submissions",
        "Priority support",
      ],
    },
  ];

  useEffect(() => {
    if (!clientToken) return;
    // Paddle initializes via the script loaded in the layout
    // It reads NEXT_PUBLIC_PADDLE_CLIENT_TOKEN from the global Paddle object
    const checkPaddle = () => {
      if (window.Paddle) {
        setPaddleReady(true);
      } else {
        setTimeout(checkPaddle, 200);
      }
    };
    checkPaddle();
  }, [clientToken]);

  const openCheckout = useCallback(
    (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan || !window.Paddle) return;

      window.Paddle.Checkout.open({
        items: [{ priceId: plan.priceId, quantity: 1 }],
        customData: {
          account_id: waitlist.account_id,
          waitlist_id: waitlist.id,
          plan: planId,
        },
      });
    },
    [waitlist.account_id, waitlist.id, plans],
  );

  if (waitlist.plan === "scale") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          You&apos;re already on the highest plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upgrade plan</h1>
        <p className="text-sm text-muted-foreground">
          Current plan:{" "}
          <span className="font-medium capitalize">{waitlist.plan}</span>
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = waitlist.plan === plan.id;
          const isDowngrade =
            (waitlist.plan === "grow" && plan.id === "launch");
          const canBuy = !isCurrent && !isDowngrade && paddleReady;

          return (
            <Card
              key={plan.id}
              className={
                isCurrent ? "border-muted opacity-60" : ""
              }
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.limit}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    one-time
                  </span>
                </p>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={!canBuy}
                  onClick={() => openCheckout(plan.id)}
                >
                  {isCurrent
                    ? "Current plan"
                    : isDowngrade
                      ? "Already on Grow"
                      : !paddleReady
                        ? "Loading..."
                        : `Buy ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
