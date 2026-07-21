import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for testing the waters",
    limit: "150 submissions",
    features: [
      "Widget embed",
      "Custom form",
      "Referral system",
      "Export CSV/XLSX",
      "Basic analytics",
      "Email notifications",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Launch",
    price: "$29",
    description: "For launching your product",
    limit: "500 submissions",
    popular: true,
    features: [
      "Everything in Free",
      "Double opt-in verification",
      "Welcome email",
      "Slack notifications",
      "Position adjustments",
      "Rewards & milestones",
      "Custom thank-you page",
      "Multi-language",
    ],
    cta: "Buy Launch",
    href: "/signup",
  },
  {
    name: "Grow",
    price: "$79",
    description: "For growing products",
    limit: "10,000 submissions",
    features: [
      "Everything in Launch",
      "Team members (unlimited)",
      "Webhooks & Zapier",
      "Remove branding",
      "AJAX submissions",
      "Conversion tracking",
      "Priority support",
    ],
    cta: "Buy Grow",
    href: "/signup",
  },
  {
    name: "Scale",
    price: "Custom",
    description: "For high-volume products",
    limit: "100,000+ submissions",
    features: [
      "Everything in Grow",
      "Dedicated manager",
      "Custom integrations",
      "Beta features",
      "Onboarding",
    ],
    cta: "Talk to us",
    href: "#contact",
  },
];

export default function PricingPage() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, one-time pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pay once, own it forever. No subscriptions, no hidden fees.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      one-time
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{plan.limit}</p>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 shrink-0 text-primary"
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
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={plan.href} className="w-full">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
