export type Plan = "free" | "launch" | "grow" | "scale";

const FREE_FEATURES = [
  "widget",
  "form_custom",
  "referrals",
  "export_csv_xlsx",
  "basic_analytics",
  "email_notification",
  "fraud_detection",
  "email_validation",
] as const;

const LAUNCH_FEATURES = [...FREE_FEATURES,
  "double_optin",
  "welcome_email",
  "slack_notification",
  "position_adjust",
  "milestones",
  "custom_thank_you",
  "translation",
  "turnstile",
] as const;

const GROW_FEATURES = [...LAUNCH_FEATURES,
  "team_members",
  "webhooks",
  "zapier",
  "custom_domain",
  "ajax_submit",
  "conversion_tracking",
  "remove_branding",
  "priority_support",
] as const;

export type Feature = (typeof GROW_FEATURES)[number];

const FEATURES_BY_PLAN: Record<Plan, readonly string[]> = {
  free: FREE_FEATURES,
  launch: LAUNCH_FEATURES,
  grow: GROW_FEATURES,
  scale: [...GROW_FEATURES, "all"],
};

export const PLAN_LIMITS: Record<Plan, number | null> = {
  free: 150,
  launch: 500,
  grow: 10000,
  scale: null, // unlimited
};

export const PLAN_PRICES: Record<Exclude<Plan, "free" | "scale">, number> = {
  launch: 29,
  grow: 79,
};

const FEATURE_SET = new Set<string>(
  Object.values(FEATURES_BY_PLAN).flat(),
);

export function hasFeature(plan: Plan, feature: string): boolean {
  return FEATURES_BY_PLAN[plan]?.includes(feature) ?? false;
}

export function getNextPlan(plan: Plan): Plan | null {
  const order: Plan[] = ["free", "launch", "grow", "scale"];
  const idx = order.indexOf(plan);
  if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
  return null;
}

export function isFeature(feature: string): boolean {
  return FEATURE_SET.has(feature);
}
