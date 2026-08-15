export type Plan = "free" | "launch" | "grow" | "scale"

export interface PlanInfo {
  id: Plan
  name: string
  price: string
  description: string
  limit: string
  limitNumber: number | null
  popular?: boolean
  features: string[]
  featureKeys: string[]
  cta: string
  href: string
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for testing the waters",
    limit: "150 submissions",
    limitNumber: 150,
    features: [
      "Widget embed",
      "Custom form",
      "Referral system",
      "Export CSV/XLSX",
      "Basic analytics",
      "Email notifications",
    ],
    featureKeys: [
      "widget", "form_custom", "referrals", "export_csv_xlsx",
      "basic_analytics", "email_notification", "welcome_email",
      "fraud_detection", "email_validation", "testimonials",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    id: "launch",
    name: "Launch",
    price: "$29",
    description: "For launching your product",
    limit: "500 submissions",
    limitNumber: 500,
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
    featureKeys: [
      "widget", "form_custom", "referrals", "export_csv_xlsx",
      "basic_analytics", "email_notification", "fraud_detection", "email_validation",
      "double_optin", "welcome_email", "slack_notification", "position_adjust",
      "milestones", "custom_thank_you", "translation", "turnstile",
      "testimonials", "testimonial_carousel",
    ],
    cta: "Buy Launch",
    href: "/signup",
  },
  {
    id: "grow",
    name: "Grow",
    price: "$79",
    description: "For growing products",
    limit: "10,000 submissions",
    limitNumber: 10000,
    features: [
      "Everything in Launch",
      "Team members (unlimited)",
      "Webhooks & Zapier",
      "Remove branding",
      "AJAX submissions",
      "Conversion tracking",
      "Priority support",
    ],
    featureKeys: [
      "widget", "form_custom", "referrals", "export_csv_xlsx",
      "basic_analytics", "email_notification", "fraud_detection", "email_validation",
      "double_optin", "welcome_email", "slack_notification", "position_adjust",
      "milestones", "custom_thank_you", "translation", "turnstile",
      "team_members", "webhooks", "zapier", "custom_domain",
      "ajax_submit", "conversion_tracking", "remove_branding", "priority_support",
      "testimonials", "testimonial_carousel", "testimonial_video",
    ],
    cta: "Buy Grow",
    href: "/signup",
  },
  {
    id: "scale",
    name: "Scale",
    price: "Custom",
    description: "For high-volume products",
    limit: "100,000+ submissions",
    limitNumber: null,
    features: [
      "Everything in Grow",
      "Dedicated manager",
      "Custom integrations",
      "Beta features",
      "Onboarding",
    ],
    featureKeys: [
      "widget", "form_custom", "referrals", "export_csv_xlsx",
      "basic_analytics", "email_notification", "fraud_detection", "email_validation",
      "double_optin", "welcome_email", "slack_notification", "position_adjust",
      "milestones", "custom_thank_you", "translation", "turnstile",
      "team_members", "webhooks", "zapier", "custom_domain",
      "ajax_submit", "conversion_tracking", "remove_branding", "priority_support",
      "testimonials", "testimonial_carousel", "testimonial_video",
      "all",
    ],
    cta: "Talk to us",
    href: "#contact",
  },
]

export function hasFeature(plan: Plan, feature: string): boolean {
  const p = PLANS.find((p) => p.id === plan)
  return p?.featureKeys.includes(feature) ?? false
}

export function getNextPlan(plan: Plan): Plan | null {
  const order: Plan[] = ["free", "launch", "grow", "scale"]
  const idx = order.indexOf(plan)
  if (idx >= 0 && idx < order.length - 1) return order[idx + 1]
  return null
}

export function getFormLimit(plan: Plan): number | null {
  if (plan === "free") return 1
  return null
}
