import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * All of JOC's money, for whoever holds the whole picture (4e).
 *
 * Three kinds that are never added together, because they answer three
 * different questions and a single total would answer none of them:
 *
 *   **Plan money**, per plan and per school year. A plan covers several
 *   programs and is never split across them — there is no such thing as a
 *   program's share of a plan, so this page never invents one.
 *
 *   **Program fees**, rolled up per program. The same rows each program
 *   console shows on its own Money tab, so the two can never disagree.
 *
 *   **Shop money**, per order. Products, not programs.
 *
 * Refunds are their own rows throughout and are never netted off anything.
 * Grants are a count of schools, never a dollar figure, because a grant is a
 * decision rather than nought dollars.
 */

export type PlanMoney = {
  plan: string;
  /** How that plan reads to a person: "full partnership". */
  label: string;
  schools: number;
  /** Schools on that plan who were given it rather than paying. */
  granted: number;
  /** Paid, per school year, newest first. Empty when nothing is recorded. */
  years: { schoolYear: string; cents: number; schools: number }[];
  /** Everything recorded against this plan, across all years. */
  cents: number;
};

export type ProgramFees = {
  programId: number;
  name: string;
  heroColor: string;
  cents: number;
  schools: number;
  refundedCents: number;
  granted: number;
};

export type ShopOrder = {
  id: string;
  schoolName: string | null;
  contactName: string | null;
  status: string;
  cents: number;
  at: Date;
  /** True once a Payment row exists for it, rather than only an order. */
  paid: boolean;
};

export type MoneyOverview = {
  plans: PlanMoney[];
  programs: ProgramFees[];
  orders: ShopOrder[];
  /** Refunds across everything, shown rather than netted. */
  refunded: { cents: number; count: number };
  /** Schools given something, counted rather than valued. */
  granted: number;
  /** True when no Payment row exists at all, so the page can say why. */
  nothingRecorded: boolean;
};

const EMPTY: MoneyOverview = {
  plans: [], programs: [], orders: [],
  refunded: { cents: 0, count: 0 }, granted: 0, nothingRecorded: true,
};

const PLAN_LABEL: Record<string, string> = {
  SINGLE_TEACHER: "single teacher",
  JOC_EDUCATION: "JOC Education",
  APP_AND_EDUCATION: "app and education",
  FULL_PARTNERSHIP: "full partnership",
};

export async function getMoneyOverview(): Promise<MoneyOverview> {
  if (!isDatabaseConfigured()) return EMPTY;

  try {
    const [payments, subscriptions, programs, orders] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { paidAt: "desc" },
        select: {
          id: true, schoolId: true, programId: true, subscriptionId: true,
          kind: true, amountCents: true, schoolYear: true, orderId: true,
        },
      }),
      prisma.subscription.findMany({
        select: { id: true, schoolId: true, plan: true, status: true, grantedManually: true },
      }),
      prisma.programPage.findMany({
        select: { id: true, name: true, heroColor: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true, schoolName: true, contactName: true, status: true,
          subtotal: true, createdAt: true,
        },
      }),
    ]);

    // ── Plans ──────────────────────────────────────────────────────────────
    const subById = new Map(subscriptions.map((s) => [s.id, s]));
    const subBySchool = new Map(subscriptions.map((s) => [s.schoolId, s]));

    const planRows = new Map<string, PlanMoney>();
    for (const plan of Object.keys(PLAN_LABEL)) {
      planRows.set(plan, {
        plan,
        label: PLAN_LABEL[plan],
        schools: 0,
        granted: 0,
        years: [],
        cents: 0,
      });
    }

    for (const s of subscriptions) {
      const row = planRows.get(s.plan);
      if (!row) continue;
      row.schools++;
      if (s.grantedManually) row.granted++;
    }

    // Plan payments, bucketed by year within their plan.
    const byPlanYear = new Map<string, Map<string, { cents: number; schools: Set<string> }>>();
    for (const p of payments) {
      if (p.kind !== "PLAN") continue;
      const sub = p.subscriptionId
        ? subById.get(p.subscriptionId)
        : subBySchool.get(p.schoolId);
      if (!sub) continue;

      if (!byPlanYear.has(sub.plan)) byPlanYear.set(sub.plan, new Map());
      const years = byPlanYear.get(sub.plan)!;
      if (!years.has(p.schoolYear)) years.set(p.schoolYear, { cents: 0, schools: new Set() });
      const bucket = years.get(p.schoolYear)!;
      bucket.cents += p.amountCents;
      bucket.schools.add(p.schoolId);
    }

    for (const [plan, years] of byPlanYear) {
      const row = planRows.get(plan);
      if (!row) continue;
      row.years = [...years.entries()]
        .map(([schoolYear, v]) => ({ schoolYear, cents: v.cents, schools: v.schools.size }))
        .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
      row.cents = row.years.reduce((n, y) => n + y.cents, 0);
    }

    // ── Program fees ───────────────────────────────────────────────────────
    const nameOf = new Map(programs.map((p) => [p.id, p]));
    const feeRows = new Map<number, ProgramFees>();

    for (const p of payments) {
      if (p.programId == null) continue;
      const program = nameOf.get(p.programId);
      if (!program) continue;

      if (!feeRows.has(p.programId)) {
        feeRows.set(p.programId, {
          programId: p.programId,
          name: program.name,
          heroColor: program.heroColor,
          cents: 0, schools: 0, refundedCents: 0, granted: 0,
        });
      }
      const row = feeRows.get(p.programId)!;

      if (p.kind === "PROGRAM_FEE") {
        row.cents += p.amountCents;
        row.schools++;
      } else if (p.kind === "REFUND") {
        row.refundedCents += Math.abs(p.amountCents);
      } else if (p.kind === "GRANT") {
        row.granted++;
      }
    }

    // ── Shop ───────────────────────────────────────────────────────────────
    const paidOrders = new Set(
      payments.filter((p) => p.kind === "SHOP" && p.orderId).map((p) => p.orderId as string),
    );

    const shop: ShopOrder[] = orders.map((o) => ({
      id: o.id,
      schoolName: o.schoolName,
      contactName: o.contactName,
      status: String(o.status),
      cents: o.subtotal,
      at: o.createdAt,
      paid: paidOrders.has(o.id),
    }));

    const refunds = payments.filter((p) => p.kind === "REFUND");

    return {
      plans: [...planRows.values()].filter((p) => p.schools > 0 || p.cents > 0),
      programs: [...feeRows.values()].sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name)),
      orders: shop,
      refunded: {
        cents: refunds.reduce((n, r) => n + Math.abs(r.amountCents), 0),
        count: refunds.length,
      },
      granted: new Set(
        payments.filter((p) => p.kind === "GRANT").map((p) => p.schoolId),
      ).size,
      nothingRecorded: payments.length === 0,
    };
  } catch {
    return EMPTY;
  }
}
