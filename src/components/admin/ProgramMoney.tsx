import { BandRow } from "@/components/ui/BandRow";
import { money, type ProgramMoney as Money, type SchoolPayment } from "@/lib/money";
import { C, F, label, sectionHeading } from "@/lib/joc-tokens";

/**
 * What this program brought in, and what each school did about paying (4f).
 *
 * Four figures and never a total, because fees paid, money refunded, schools
 * given it and schools inside a plan are four different facts. Adding them
 * makes a number that is true of nothing.
 */

const day = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function ProgramMoney({ data, programName }: { data: Money; programName: string }) {
  const nothing =
    data.paid.schools === 0 &&
    data.refunded.schools === 0 &&
    data.granted === 0 &&
    data.inPlan === 0;

  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Money</h2>

      {nothing && (
        <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "62ch" }}>
          No payment has been recorded against {programName} yet. Once card payments are connected
          every fee lands here on its own; until then somebody records them by hand.
        </p>
      )}

      <div className="joc-figures" style={{ marginBottom: "20px" }}>
        <Figure value={money(data.paid.cents)} label={`Fees paid · ${data.paid.schools} school${data.paid.schools === 1 ? "" : "s"}`} />
        <Figure
          value={data.refunded.cents > 0 ? `−${money(data.refunded.cents)}` : money(0)}
          label="Refunded · shown, not netted"
          tone={data.refunded.cents > 0 ? C.redText : undefined}
        />
        {/* A grant is not nought dollars. It is a decision, and the honest
            figure is how many schools it was made for. */}
        <Figure value={String(data.granted)} label="Schools granted it" />
        <Figure value={String(data.inPlan)} label="In a plan · not attributed" />
      </div>

      {data.rows.length > 0 && (
        <div style={{ display: "grid", gap: "10px" }}>
          {data.rows.map((r) => {
            const p = paymentRow(r.payment, r.since);
            return (
              <BandRow
                key={r.schoolId}
                tone={p.tone}
                label={p.label}
                figure={p.figure}
                word={p.word}
                title={r.schoolName}
                line={p.line}
                action={p.action ? { label: "Record it", href: `/admin/schools` } : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Figure({ value, label: name, tone }: { value: string; label: string; tone?: string }) {
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

type Row = {
  tone: "good" | "info" | "warn" | "system";
  label: string;
  figure: string;
  word?: boolean;
  line: string;
  action?: boolean;
};

function paymentRow(p: SchoolPayment, since: Date): Row {
  switch (p.state) {
    case "paid":
      return {
        tone: "good",
        label: `Paid · ${day(p.at)}`,
        figure: money(p.amountCents),
        line: p.byHand
          ? `Program fee, recorded by hand by ${p.byHand}.`
          : `Program fee · card · receipt ${p.reference ?? "not recorded"}.`,
      };

    case "granted":
      return {
        tone: "good",
        label: "Granted",
        figure: p.kind,
        word: true,
        line: `Agreed by ${p.by ?? "somebody at JOC"} on ${day(p.at)}${p.reason ? `: ${p.reason}` : "."}`,
      };

    case "in-plan":
      return {
        tone: "info",
        label: "In a plan",
        figure: `${p.programs} programs`,
        word: true,
        line: `Paid for ${p.plan}, which covers this and ${p.programs - 1} others. We don't split it.`,
      };

    case "refunded":
      return {
        tone: "system",
        label: `Refunded · ${day(p.at)}`,
        figure: `−${money(p.amountCents)}`,
        word: true,
        line: `Paid ${day(p.paidAt)}, refunded by ${p.by ?? "somebody at JOC"} on ${day(p.at)}.`,
      };

    default:
      return {
        tone: "warn",
        label: "Not recorded",
        figure: "Unknown",
        word: true,
        line: `Running since ${day(since)}, with no payment and no grant on record.`,
        action: true,
      };
  }
}
