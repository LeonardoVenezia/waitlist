export type Plan = "free" | "launch"

export interface PlanInfo {
  id: Plan
  name: string
  price: string
  interval: "month" | "year" | null
  description: string
  showcaseExpiry: "1y" | "indefinite"
  waitlistLimit: number
  templatesAccess: boolean
  popular?: boolean
  features: string[]
  cta: string
  href: string
  paddlePriceId: string | null
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: null,
    description: "Para probar y validar",
    showcaseExpiry: "1y",
    waitlistLimit: 100,
    templatesAccess: false,
    features: [
      "Producto publicado en el directorio por 1 año",
      "Hasta 100 emails en la waitlist",
      "Page builder básico",
      "Widget embebible",
      "Export CSV/XLSX",
    ],
    cta: "Empezar gratis",
    href: "/signup",
    paddlePriceId: null,
  },
  {
    id: "launch",
    name: "Launch",
    price: "$9 / mes",
    interval: "month",
    description: "Para founders en lanzamiento",
    showcaseExpiry: "indefinite",
    waitlistLimit: 1000,
    templatesAccess: true,
    popular: true,
    features: [
      "Producto publicado sin límite de tiempo",
      "Hasta 1.000 emails en la waitlist",
      "Acceso a templates de page builder",
      "Todo lo del plan Free",
    ],
    cta: "Suscribirme",
    href: "/signup?plan=launch",
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_LAUNCH ?? null,
  },
]

export function getWaitlistLimit(plan: Plan | string | null | undefined): number {
  const p = PLANS.find((x) => x.id === plan)
  return p?.waitlistLimit ?? 100
}

export function getShowcaseExpiryMonths(plan: Plan | string | null | undefined): number | null {
  const p = PLANS.find((x) => x.id === plan)
  if (!p) return 12
  return p.showcaseExpiry === "1y" ? 12 : null
}

export function hasTemplateAccess(plan: Plan | string | null | undefined): boolean {
  return PLANS.find((p) => p.id === plan)?.templatesAccess ?? false
}

export function getFormLimit(_plan?: Plan | string | null): number | null {
  return 1
}

export function getPlanInfo(id: string | null | undefined): PlanInfo | undefined {
  return PLANS.find((p) => p.id === id)
}

// Feature matrix for plan-tiered features used by waitlist signup + verify flows.
// (Showcase-templates access uses hasTemplateAccess separately.)
const FEATURE_MATRIX: Record<Plan, string[]> = {
  free: ["welcome_email"],
  launch: [
    "welcome_email",
    "double_optin",
    "slack_notification",
  ],
}

export function hasFeature(plan: Plan | string | null | undefined, feature: string): boolean {
  const p = plan as Plan
  if (p !== "free" && p !== "launch") return false
  return FEATURE_MATRIX[p]?.includes(feature) ?? false
}
