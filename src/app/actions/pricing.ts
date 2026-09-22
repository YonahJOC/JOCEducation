"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can } from "@/lib/access";
import { FALLBACK_PLANS, FALLBACK_PROGRAMS, type TierPrice } from "@/lib/pricing";

/**
 * Prices are money, so this is super-admin only — the education team writes
 * lessons, not invoices.
 */

type Result = { ok: true } | { ok: false; error: string };

async function requirePricer() {
  const session = await safeAuth();
  if (!can(session?.user, "pricing")) return false;
  return isDatabaseConfigured();
}

export async function savePlanPrices(
  plans: { key: string; label: string; s: number; m: number; l: number }[]
): Promise<Result> {
  if (!(await requirePricer())) {
    return { ok: false, error: "Only super admins can change prices." };
  }

  try {
    await Promise.all(
      plans.map((p, sort) =>
        prisma.pricingPlan.upsert({
          where: { key: p.key },
          create: {
            key: p.key, label: p.label.trim(),
            priceSmall: Math.max(0, Math.round(p.s)),
            priceMedium: Math.max(0, Math.round(p.m)),
            priceLarge: Math.max(0, Math.round(p.l)),
            sort,
          },
          update: {
            label: p.label.trim(),
            priceSmall: Math.max(0, Math.round(p.s)),
            priceMedium: Math.max(0, Math.round(p.m)),
            priceLarge: Math.max(0, Math.round(p.l)),
            sort,
          },
        })
      )
    );

    revalidatePath("/pricing");
    revalidatePath("/admin/pricing");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save those prices." };
  }
}

export async function saveProgramPrices(
  programs: { id?: number; label: string; tiers: Record<string, TierPrice> }[]
): Promise<Result> {
  if (!(await requirePricer())) {
    return { ok: false, error: "Only super admins can change prices." };
  }

  try {
    // Replaced wholesale — simpler than diffing, and this table is small.
    await prisma.$transaction([
      prisma.programPrice.deleteMany({}),
      ...programs
        .filter((p) => p.label.trim())
        .map((p, sort) =>
          prisma.programPrice.create({
            data: { label: p.label.trim(), tiers: p.tiers, sort },
          })
        ),
    ]);

    revalidatePath("/pricing");
    revalidatePath("/admin/pricing");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save those prices." };
  }
}

/** Copies the figures the page currently shows in, so they can be corrected. */
export async function importCurrentPricing(): Promise<Result> {
  if (!(await requirePricer())) {
    return { ok: false, error: "Only super admins can change prices." };
  }

  try {
    const existing = await prisma.pricingPlan.count();
    if (existing > 0) return { ok: false, error: "Prices are already set here." };

    await prisma.$transaction([
      ...FALLBACK_PLANS.map((p, sort) =>
        prisma.pricingPlan.create({
          data: {
            key: p.key, label: p.label,
            priceSmall: p.prices.s, priceMedium: p.prices.m, priceLarge: p.prices.l,
            sort,
          },
        })
      ),
      ...FALLBACK_PROGRAMS.map((p, sort) =>
        prisma.programPrice.create({ data: { label: p.label, tiers: p.prices, sort } })
      ),
    ]);

    revalidatePath("/pricing");
    revalidatePath("/admin/pricing");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not import the current prices." };
  }
}
