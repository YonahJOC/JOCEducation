import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import type { Stage } from "@/lib/program-enrollment";

/**
 * What a program brought in, and what each school did about paying.
 *
 * Every figure here is a query over `Payment`, which is one row per movement
 * of money. Nothing before it could answer "what did the Kindness Booth bring
 * in": a subscription is per school with no program on it, an order is shop
 * products, and a program fee was a boolean with no amount and no date.
 *
 * Three things this deliberately will not do:
 *
 *   **It never sums the four figures into one total.** Fees paid, money
 *   refunded, schools granted and schools inside a plan are four different
 *   facts, and adding them produces a number that is true of nothing.
 *
 *   **It never splits plan money across programs.** A school paying for a
 *   plan that covers four programs has not paid a quarter to each. The
 *   console says the school is in a plan and stops.
 *
 *   **It never nets a refund off a total.** A refund is its own row, shown as
 *   itself, because a total that quietly absorbs one stops being trusted.
 */

export type SchoolPayment =
  | { state: "paid"; amountCents: number; at: Date; byHand: string | null; reference: string | null }
  | { state: "granted"; kind: string; at: Date; by: string | null; reason: string | null }
  | { state: "in-plan"; plan: string; programs: number }
  | { state: "refunded"; amountCents: number; paidAt: Date; at: Date; by: string | null }
  | { state: "none" };

export type ProgramMoney = {
  /** Fees paid for this program, and how many schools paid one. */
  paid: { cents: number; schools: number };
  /** Refunded, shown rather than netted. */
  refunded: { cents: number; schools: number };
  /** Schools given it. A count, never a dollar figure — a grant is not $0. */
  granted: number;
  /** Schools whose plan covers it. Not attributed, so no figure at all. */
  inPlan: number;
  /** One row per school in the program, worst first. */
  rows: {
    schoolId: string;
    schoolName: string;
    stage: Stage;
    since: Date;
    payment: SchoolPayment;
  }[];
};

const EMPTY: ProgramMoney = {
  paid: { cents: 0, schools: 0 },
  refunded: { cents: 0, schools: 0 },
  granted: 0,
  inPlan: 0,
  rows: [],
};

/** Not recorded first: it is the only one somebody can do something about. */
const ORDER: Record<SchoolPayment["state"], number> = {
  none: 0,
  refunded: 1,
  paid: 2,
  granted: 3,
  "in-plan": 4,
};

export async function programMoney(programId: number): Promise<ProgramMoney> {
  if (!isDatabaseConfigured()) return EMPTY;

  try {
    const [enrollments, payments] = await Promise.all([
      prisma.programEnrollment.findMany({
        where: { programId },
        select: {
          stage: true,
          stageSince: true,
          school: {
            select: {
              id: true,
              name: true,
              subscription: { select: { plan: true, status: true } },
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: { programId },
        orderBy: { paidAt: "desc" },
        select: {
          schoolId: true, kind: true, amountCents: true, paidAt: true, reason: true,
          grantKind: true, stripeChargeId: true,
          decidedBy: { select: { name: true, email: true } },
          recordedBy: { select: { name: true, email: true } },
        },
      }),
    ]);

    // How many programs a plan covers, so a row can say so without implying
    // a share of the money.
    const planCovers = await prisma.programPage.count({ where: { published: true } });

    const bySchool = new Map<string, typeof payments>();
    for (const p of payments) {
      const list = bySchool.get(p.schoolId) ?? [];
      list.push(p);
      bySchool.set(p.schoolId, list);
    }

    const out: ProgramMoney = {
      paid: { cents: 0, schools: 0 },
      refunded: { cents: 0, schools: 0 },
      granted: 0,
      inPlan: 0,
      rows: [],
    };

    for (const e of enrollments) {
      const mine = bySchool.get(e.school.id) ?? [];
      const refund = mine.find((p) => p.kind === "REFUND");
      const fee = mine.find((p) => p.kind === "PROGRAM_FEE");
      const grant = mine.find((p) => p.kind === "GRANT");

      const who = (u: { name: string | null; email: string } | null) =>
        u?.name ?? u?.email ?? null;

      let payment: SchoolPayment;

      if (refund && fee) {
        payment = {
          state: "refunded",
          amountCents: Math.abs(refund.amountCents),
          paidAt: fee.paidAt,
          at: refund.paidAt,
          by: who(refund.decidedBy),
        };
        out.refunded.cents += Math.abs(refund.amountCents);
        out.refunded.schools++;
      } else if (fee) {
        payment = {
          state: "paid",
          amountCents: fee.amountCents,
          at: fee.paidAt,
          byHand: who(fee.recordedBy),
          reference: fee.stripeChargeId,
        };
        out.paid.cents += fee.amountCents;
        out.paid.schools++;
      } else if (grant) {
        payment = {
          state: "granted",
          kind: (grant.grantKind ?? "GRANT").toLowerCase(),
          at: grant.paidAt,
          by: who(grant.decidedBy),
          reason: grant.reason,
        };
        out.granted++;
      } else if (
        e.school.subscription?.status === "ACTIVE" ||
        e.school.subscription?.status === "TRIALING"
      ) {
        payment = {
          state: "in-plan",
          plan: e.school.subscription.plan.replace(/_/g, " ").toLowerCase(),
          programs: planCovers,
        };
        out.inPlan++;
      } else {
        payment = { state: "none" };
      }

      out.rows.push({
        schoolId: e.school.id,
        schoolName: e.school.name,
        stage: e.stage as Stage,
        since: e.stageSince,
        payment,
      });
    }

    out.rows.sort(
      (a, b) =>
        ORDER[a.payment.state] - ORDER[b.payment.state] ||
        a.schoolName.localeCompare(b.schoolName),
    );

    return out;
  } catch {
    return EMPTY;
  }
}

/** Cents as money, or the word for what is missing. */
export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * What one school did about paying for one program (5b's side card).
 *
 * The same five states the console's Money tab shows, for a single school,
 * because the school is entitled to see its own row and nobody else's. It is
 * only ever rendered for somebody who runs the account: a teacher who runs
 * the school's app has no business seeing what the school pays.
 */
export async function schoolPaymentFor(
  schoolId: string,
  programId: number,
): Promise<SchoolPayment> {
  if (!isDatabaseConfigured()) return { state: "none" };

  try {
    const [payments, school, planCovers] = await Promise.all([
      prisma.payment.findMany({
        where: { schoolId, programId },
        orderBy: { paidAt: "desc" },
        select: {
          kind: true, amountCents: true, paidAt: true, reason: true,
          grantKind: true, stripeChargeId: true,
          decidedBy: { select: { name: true, email: true } },
          recordedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.school.findUnique({
        where: { id: schoolId },
        select: { subscription: { select: { plan: true, status: true } } },
      }),
      prisma.programPage.count({ where: { published: true } }),
    ]);

    const who = (u: { name: string | null; email: string } | null) => u?.name ?? u?.email ?? null;

    const refund = payments.find((p) => p.kind === "REFUND");
    const fee = payments.find((p) => p.kind === "PROGRAM_FEE");
    const grant = payments.find((p) => p.kind === "GRANT");

    if (refund && fee) {
      return {
        state: "refunded",
        amountCents: Math.abs(refund.amountCents),
        paidAt: fee.paidAt,
        at: refund.paidAt,
        by: who(refund.decidedBy),
      };
    }
    if (fee) {
      return {
        state: "paid",
        amountCents: fee.amountCents,
        at: fee.paidAt,
        byHand: who(fee.recordedBy),
        reference: fee.stripeChargeId,
      };
    }
    if (grant) {
      return {
        state: "granted",
        kind: (grant.grantKind ?? "GRANT").toLowerCase(),
        at: grant.paidAt,
        by: who(grant.decidedBy),
        reason: grant.reason,
      };
    }
    const sub = school?.subscription;
    if (sub?.status === "ACTIVE" || sub?.status === "TRIALING") {
      return {
        state: "in-plan",
        plan: sub.plan.replace(/_/g, " ").toLowerCase(),
        programs: planCovers,
      };
    }
    return { state: "none" };
  } catch {
    return { state: "none" };
  }
}
