import Link from "next/link";
import { OrdersGuard } from "@/components/admin/Guard";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { OrdersClient, type OrderRow } from "./OrdersClient";
import { getMoneyOverview, type PlanMoney, type ProgramFees } from "@/lib/money-overview";
import { money as dollars } from "@/lib/money";
import { BandRow } from "@/components/ui/BandRow";
import { isPaymentConfigured } from "@/lib/payments";
import { C, F, label, datum, rowCard, sectionHeading, pageTitle } from "@/lib/joc-tokens";

/**
 * All of JOC's money, in one place (4e).
 *
 * This page was the shop's order list, which is one third of the answer to
 * "what came in". Plan money and program fees were on no page at all — a
 * program console can say what its own program brought in, and nobody could
 * see the year.
 *
 * Three kinds, never added together. Plan money is per plan and per school
 * year; a plan covers several programs and is never split across them, so
 * there is no such thing as a program's share of one and this page does not
 * invent it. Program fees roll up exactly as each console shows them. Shop
 * money is per order.
 *
 * Refunds are their own figure throughout and are never netted off. Grants
 * are a count of schools, because a grant is a decision and not nought
 * dollars.
 */

export const metadata = { title: "Money — JOC Console" };
export const dynamic = "force-dynamic";

type Tab = "plans" | "programs" | "shop";
const TABS: Tab[] = ["plans", "programs", "shop"];

const TAB_LABEL: Record<Tab, string> = {
  plans: "Plans",
  programs: "Program fees",
  shop: "Shop",
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const when = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

async function getOrders(): Promise<OrderRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.order.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { items: true },
    });
    return rows.map((o) => ({
      id: o.id,
      status: o.status,
      contactName: o.contactName,
      contactEmail: o.contactEmail,
      phone: o.phone,
      schoolName: o.schoolName,
      address: o.address,
      poNumber: o.poNumber,
      notes: o.notes,
      response: o.response,
      subtotal: money(o.subtotal),
      when: when(o.createdAt),
      items: o.items.map((i) => ({
        name: i.name,
        unit: i.unit,
        unitPrice: money(i.unitPrice),
        quantity: i.quantity,
      })),
    }));
  } catch {
    return [];
  }
}

export default async function AdminMoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: asked } = await searchParams;
  const tab: Tab = TABS.includes(asked as Tab) ? (asked as Tab) : "plans";
  return <OrdersGuard>{await Inner(tab)}</OrdersGuard>;
}

async function Inner(tab: Tab) {
  const [overview, orders] = await Promise.all([
    getMoneyOverview(),
    tab === "shop" ? getOrders() : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>Money</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            PLANS · PROGRAM FEES · SHOP · NEVER ADDED TOGETHER
          </p>
        </div>

        <SectionLinks section="money" />
      </div>

      {/* Said once, at the top, because it is true of every tab below. */}
      {overview.nothingRecorded && (
        <p style={{
          ...rowCard, padding: "18px 20px", marginBottom: "18px",
          fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.orangeText,
          maxWidth: "64ch",
        }}>
          No payment has been recorded anywhere yet.{" "}
          {isPaymentConfigured
            ? "Card payments are connected, so fees will land here on their own as they are taken."
            : "Card payments are not switched on yet, so until somebody records one by hand there is nothing to show."}
        </p>
      )}

      <nav style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
        {TABS.map((t) => {
          const on = t === tab;
          return (
            <Link
              key={t}
              href={`/admin/orders${t === "plans" ? "" : `?tab=${t}`}`}
              style={{
                fontFamily: F.ui, fontSize: "15px", fontWeight: 600,
                color: on ? C.white : C.ink,
                backgroundColor: on ? C.ink : "transparent",
                borderRadius: "12px", padding: "0 16px", minHeight: "44px",
                display: "inline-flex", alignItems: "center", textDecoration: "none",
              }}
            >
              {TAB_LABEL[t]}
            </Link>
          );
        })}
      </nav>

      {/* Three figures that are three different facts. Never a total. */}
      <div className="joc-figures" style={{ marginBottom: "22px" }}>
        <Figure
          value={dollars(overview.plans.reduce((n, p) => n + p.cents, 0))}
          name="Plan money, all years"
        />
        <Figure
          value={dollars(overview.programs.reduce((n, p) => n + p.cents, 0))}
          name="Program fees, all programs"
        />
        <Figure
          value={overview.refunded.cents > 0 ? `−${dollars(overview.refunded.cents)}` : dollars(0)}
          name={`Refunded · ${overview.refunded.count} · shown, not netted`}
          tone={overview.refunded.cents > 0 ? C.redText : undefined}
        />
        <Figure value={String(overview.granted)} name="Schools given something" />
      </div>

      {tab === "plans" && <Plans plans={overview.plans} />}
      {tab === "programs" && <Programs programs={overview.programs} />}
      {tab === "shop" && (
        <>
          <Shop overview={overview} />
          <OrdersClient orders={orders} disabled={!isDatabaseConfigured()} />
        </>
      )}
    </div>
  );
}

function Figure({ value, name, tone }: { value: string; name: string; tone?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span style={{
        fontFamily: F.ui, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em",
        color: tone ?? C.ink, lineHeight: 1.15,
      }}>
        {value}
      </span>
      <span style={{ ...label, fontSize: "10px", color: C.muted }}>{name}</span>
    </div>
  );
}

function Plans({ plans }: { plans: PlanMoney[] }) {
  if (plans.length === 0) {
    return (
      <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, margin: 0, maxWidth: "58ch" }}>
        No school is on a plan yet.
      </p>
    );
  }

  return (
    <div>
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>By plan, by school year</h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "62ch" }}>
        A plan covers several programs and is never split across them. There is no such thing
        here as a program&rsquo;s share of a plan.
      </p>

      <div style={{ display: "grid", gap: "10px" }}>
        {plans.map((p) => (
          <div key={p.plan} style={{ ...rowCard, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>
                {p.label}
              </span>
              <span style={{ ...datum, color: C.muted }}>
                {p.schools} SCHOOL{p.schools === 1 ? "" : "S"}
                {p.granted > 0 && ` · ${p.granted} GIVEN IT`}
              </span>
            </div>

            {p.years.length === 0 ? (
              <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.orangeText, margin: "10px 0 0", maxWidth: "56ch" }}>
                {p.granted === p.schools && p.schools > 0
                  ? `Every school on this plan was given it, so no money is recorded against it.`
                  : "No payment is recorded against this plan."}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: "6px" }}>
                {p.years.map((y) => (
                  <li key={y.schoolYear} style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
                    <span style={{ ...datum, color: C.muted }}>
                      {y.schoolYear} · {y.schools} SCHOOL{y.schools === 1 ? "" : "S"}
                    </span>
                    <span style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink }}>
                      {dollars(y.cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Programs({ programs }: { programs: ProgramFees[] }) {
  if (programs.length === 0) {
    return (
      <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, margin: 0, maxWidth: "58ch" }}>
        No fee, grant or refund is recorded against any program yet. Each program&rsquo;s own
        console shows the same thing on its Money tab.
      </p>
    );
  }

  return (
    <div>
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Fees, by program</h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "62ch" }}>
        The same rows each program console shows on its own Money tab, so the two can never
        disagree.
      </p>

      <div style={{ display: "grid", gap: "10px" }}>
        {programs.map((p) => (
          <BandRow
            key={p.programId}
            tone={p.cents > 0 ? "good" : "quiet"}
            label="Fees paid"
            figure={p.cents > 0 ? dollars(p.cents) : "None"}
            word={p.cents === 0}
            title={p.name}
            line={[
              p.cents > 0
                ? `${p.schools} school${p.schools === 1 ? "" : "s"} paid.`
                : "No school has paid a fee for it.",
              p.granted > 0 ? `${p.granted} given it.` : null,
              p.refundedCents > 0 ? `${dollars(p.refundedCents)} refunded, shown not netted.` : null,
            ].filter(Boolean).join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

function Shop({ overview }: { overview: Awaited<ReturnType<typeof getMoneyOverview>> }) {
  const unpaid = overview.orders.filter((o) => !o.paid).length;

  return (
    <div style={{ marginBottom: "18px" }}>
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Shop, by order</h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 4px", maxWidth: "62ch" }}>
        Products, not programs. Shop money is never attributed to a program.
      </p>
      {overview.orders.length > 0 && (
        <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: unpaid > 0 ? C.orangeText : C.muted, margin: "0 0 16px", maxWidth: "62ch" }}>
          {unpaid === 0
            ? "Every order has a payment recorded against it."
            : `${unpaid} of ${overview.orders.length} orders have no payment recorded against them.`}
        </p>
      )}
    </div>
  );
}
