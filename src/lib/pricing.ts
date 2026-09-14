import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * What the pricing page shows.
 *
 * These numbers were written into the component, which meant a price change
 * was a deploy — on the one page a school reads before deciding. They come
 * from the database now, with the old figures as the fallback so the page
 * never renders blank.
 *
 * The fallbacks are almost certainly wrong. Nobody at JOC set them.
 */

export type Size = "s" | "m" | "l";
export type PriceTier = "none" | "teacher" | "staff" | "app" | "full";
export type TierPrice = { cents?: number; included?: boolean; na?: boolean };

export type PlanPricing = {
  key: string;
  label: string;
  /** Monthly, whole dollars. */
  prices: Record<Size, number>;
};

export type ProgramPricing = {
  label: string;
  prices: Record<PriceTier, TierPrice>;
};

export const ENROLLMENT_LABELS: Record<Size, string> = {
  s: "Under 150 students",
  m: "150–400",
  l: "400+",
};

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  none: "No subscription",
  teacher: "Single Teacher Use",
  staff: "JOC Education",
  app: "JOC App + JOC Education",
  full: "Full JOC Partnership",
};

/** Annual billing takes this off the monthly figure. */
export const ANNUAL_DISCOUNT = 0.15;

export const FALLBACK_PLANS: PlanPricing[] = [
  { key: "teacher", label: "Single Teacher Use", prices: { s: 18, m: 18, l: 18 } },
  { key: "staff", label: "JOC Education", prices: { s: 180, m: 290, l: 420 } },
  { key: "app", label: "JOC App + JOC Education", prices: { s: 295, m: 440, l: 610 } },
];

export const FALLBACK_PROGRAMS: ProgramPricing[] = [
  { label: "Kindness Booth", prices: { none: { cents: 24900 }, teacher: { cents: 19900 }, staff: { cents: 14900 }, app: { included: true }, full: { included: true } } },
  { label: "Bake for Chesed", prices: { none: { cents: 15000 }, teacher: { cents: 12000 }, staff: { included: true }, app: { included: true }, full: { included: true } } },
  { label: "Just One Tutor", prices: { none: { cents: 20000 }, teacher: { na: true }, staff: { cents: 15000 }, app: { included: true }, full: { included: true } } },
  { label: "Chesed Match placements", prices: { none: { cents: 10000 }, teacher: { na: true }, staff: { na: true }, app: { cents: 7500 }, full: { included: true } } },
  { label: "JOC Center trip (Israel)", prices: { none: { cents: 35000 }, teacher: { na: true }, staff: { na: true }, app: { na: true }, full: { included: true } } },
  { label: "Assembly or launch event", prices: { none: { cents: 50000 }, teacher: { cents: 40000 }, staff: { cents: 30000 }, app: { cents: 20000 }, full: { included: true } } },
];

export async function getPlanPricing(): Promise<PlanPricing[]> {
  if (!isDatabaseConfigured()) return FALLBACK_PLANS;
  try {
    const rows = await prisma.pricingPlan.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] });
    if (rows.length === 0) return FALLBACK_PLANS;
    return rows.map((p) => ({
      key: p.key,
      label: p.label,
      prices: { s: p.priceSmall, m: p.priceMedium, l: p.priceLarge },
    }));
  } catch {
    return FALLBACK_PLANS;
  }
}

export async function getProgramPricing(): Promise<ProgramPricing[]> {
  if (!isDatabaseConfigured()) return FALLBACK_PROGRAMS;
  try {
    const rows = await prisma.programPrice.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] });
    if (rows.length === 0) return FALLBACK_PROGRAMS;
    return rows.map((p) => ({
      label: p.label,
      prices: p.tiers as ProgramPricing["prices"],
    }));
  } catch {
    return FALLBACK_PROGRAMS;
  }
}

/** Whether anyone has actually set these, or the page is still on the old figures. */
export async function pricingIsSet(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const n = await prisma.pricingPlan.count();
    return n > 0;
  } catch {
    return false;
  }
}
