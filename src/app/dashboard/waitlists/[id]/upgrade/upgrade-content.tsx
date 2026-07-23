"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { getPaddlePriceIds } from "@/lib/paddle";
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

declare global {
  interface Window {
    Paddle?: {
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email: string };
          customData: Record<string, string>;
        }) => void;
      };
    };
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
  const [userEmail, setUserEmail] = useState("");
  const priceIds = getPaddlePriceIds();

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email);
      });
  }, []);

  useEffect(() => {
    const check = setInterval(() => {
      if (window.Paddle) {
        clearInterval(check);
        setPaddleReady(true);
      }
    }, 200);
    return () => clearInterval(check);
  }, []);

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

  const openCheckout = useCallback(
    (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan || !window.Paddle) return;

      window.Paddle.Checkout.open({
        items: [{ priceId: plan.priceId, quantity: 1 }],
        customer: { email: userEmail },
        customData: {
          account_id: waitlist.account_id,
          waitlist_id: waitlist.id,
          plan: planId,
        },
      });
    },
    [waitlist.account_id, waitlist.id, plans, userEmail],
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
          const isDowngrade = waitlist.plan === "grow" && plan.id === "launch";
          const canBuy = !isCurrent && !isDowngrade && paddleReady;

          return (
            <Card
              key={plan.id}
              className={isCurrent ? "border-muted opacity-60" : ""}
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
