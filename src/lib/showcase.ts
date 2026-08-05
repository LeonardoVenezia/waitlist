import type { Plan } from "./plans";

export const SHOWCASE_CATEGORIES = [
  "SaaS", "Mobile App", "Web App", "AI Tool", "Productivity",
  "Design", "Developer Tools", "Marketing", "E-commerce",
  "Fintech", "Health", "Education", "Social", "Entertainment", "Other",
] as const;

export type ShowcaseCategory = (typeof SHOWCASE_CATEGORIES)[number];

const PLAN_WEIGHT: Record<Plan, number> = {
  free: 1,
  launch: 2,
  grow: 3,
  scale: 3,
};

export function getPlanWeight(plan: Plan): number {
  return PLAN_WEIGHT[plan] ?? 1;
}
