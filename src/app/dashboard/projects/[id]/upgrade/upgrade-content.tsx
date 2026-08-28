"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, getPlanInfo } from "@/lib/plans";
import Link from "next/link";

type Project = Database["public"]["Tables"]["projects"]["Row"];

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

export function UpgradeContent({
  project,
  priceIds,
}: {
  project: Project;
  priceIds: { launch: string; grow: string };
}) {
  const [paddleReady, setPaddleReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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

  const openCheckout = useCallback(
    (planId: string) => {
      const plan = getPlanInfo(planId);
      if (!plan || !window.Paddle) return;

      const priceId = planId === "grow" ? priceIds.grow : priceIds.launch;
      if (!priceId) return;

      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: userEmail },
        customData: {
          account_id: project.account_id,
          waitlist_id: project.id,
          plan: planId,
        },
      });
    },
    [project.account_id, project.id, userEmail, priceIds.launch, priceIds.grow],
  );

  const free = PLANS.find((p) => p.id === "free")!;
  const launch = PLANS.find((p) => p.id === "launch")!;
  const grow = PLANS.find((p) => p.id === "grow")!;

  const isCurrent = (id: string) => project.plan === id;
  // For now treat as not expired — `status` is the showcase's, not the project's.
  // The dashboard-header tells the user; the upgrade page just shows the plans.
  const isExpired = false;

  const renderCard = (
    plan: typeof free,
    isPaid: boolean,
    isPopular: boolean,
  ) => {
    const current = isCurrent(plan.id);
    return (
      <Card
        key={plan.id}
        className={`relative flex flex-col ${
          current
            ? "border-muted opacity-60"
            : isPopular
              ? "border-primary shadow-lg"
              : ""
        }`}
      >
        {isPopular && !current && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            Más popular
          </span>
        )}
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div>
            <span className="text-3xl font-bold">{plan.price}</span>
            {plan.interval && (
              <span className="text-sm text-muted-foreground"> / {plan.interval === "month" ? "mes" : "año"}</span>
            )}
          </div>
          <ul className="space-y-2 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {current ? (
            <Button className="w-full" variant="outline" disabled>
              Plan actual
            </Button>
          ) : !isPaid ? (
            <Button
              className="w-full"
              variant="outline"
              disabled
              title="Contactá a soporte para bajar a Free"
            >
              Downgrade
            </Button>
          ) : !paddleReady ? (
            <Button className="w-full" disabled>
              Cargando...
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => openCheckout(plan.id)}
              disabled={!priceIds[plan.id as "launch" | "grow"]}
            >
              {isExpired ? "Reactivar" : plan.cta}
            </Button>
          )}
          {current && plan.id === "grow" && (
            <p className="mt-3 text-xs text-muted-foreground w-full text-center">
              Para cancelar, gestioná tu suscripción desde el{" "}
              <Link href="https://customer.paddle.com" target="_blank" rel="noreferrer" className="underline">
                portal de Paddle
              </Link>.
            </p>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Plan actual: <span className="font-medium capitalize">{project.plan}</span>
        </p>
        {isExpired && (
          <p className="mt-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Tu showcase venció. Suscribite para volver a publicar tu producto en el directorio.
          </p>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {renderCard(free, false, false)}
        {renderCard(launch, true, true)}
        {renderCard(grow, true, false)}
      </div>
    </div>
  );
}
