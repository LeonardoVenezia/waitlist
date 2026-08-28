"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, getPlanInfo, getWaitlistLimit } from "@/lib/plans";
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
  priceIds: { launch: string };
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

      window.Paddle.Checkout.open({
        items: [{ priceId: priceIds.launch, quantity: 1 }],
        customer: { email: userEmail },
        customData: {
          account_id: project.account_id,
          waitlist_id: project.id,
          plan: planId,
        },
      });
    },
    [project.account_id, project.id, userEmail, priceIds.launch],
  );

  const launch = PLANS.find((p) => p.id === "launch")!;
  const isCurrent = project.plan === "launch";
  const freeLimit = getWaitlistLimit("free");
  const launchLimit = getWaitlistLimit("launch");
  // `status` belongs to the showcase, not the project; the parent server component
  // passes it via props in some flows. For now, treat unknown as not-expired.
  const isExpired = false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Plan</h1>
        <p className="text-sm text-muted-foreground">
          Plan actual: <span className="font-medium capitalize">{project.plan}</span>
        </p>
        {isExpired && (
          <p className="mt-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Tu showcase venció. Suscribite para volver a publicar tu producto en el directorio.
          </p>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Para probar y validar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-3xl font-bold">$0</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Producto publicado por 1 año
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Hasta {freeLimit} emails en la waitlist
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Page builder básico
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Widget embebible
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Export CSV/XLSX
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              {isCurrent ? "Plan actual" : "Plan Free"}
            </Button>
          </CardFooter>
        </Card>
        <Card className={isCurrent ? "border-muted opacity-60" : "border-primary shadow-lg"}>
          <CardHeader>
            <CardTitle>{launch.name}</CardTitle>
            <CardDescription>{launch.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-3xl font-bold">{launch.price}</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Producto publicado sin límite de tiempo
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Hasta {launchLimit.toLocaleString()} emails en la waitlist
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Acceso a templates de page builder
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Todo lo del plan Free
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {isCurrent ? (
              <Button className="w-full" variant="outline" disabled>
                Plan actual
              </Button>
            ) : !paddleReady ? (
              <Button className="w-full" disabled>
                Cargando...
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => openCheckout("launch")}
                disabled={!priceIds.launch}
              >
                {isExpired ? "Reactivar" : "Suscribirme"}
              </Button>
            )}
            {isCurrent && (
              <p className="mt-3 text-xs text-muted-foreground w-full text-center">
                Para cancelar, gestioná tu suscripción desde el{" "}
                <Link href="https://customer.paddle.com" target="_blank" rel="noreferrer" className="underline">
                  portal de Paddle
                </Link>.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
