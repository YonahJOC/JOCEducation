import Link from "next/link";
import { C, rowCard, label, F, sectionHeading } from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";
import { AnswerAsk } from "@/components/admin/AnswerAsk";
import type { TodayRow } from "@/lib/program-today";
import type { ProgramToday } from "@/lib/program-today";

/**
 * The Today tab: what needs this program's coordinator, worst first.
 *
 * Two things and no more — the list, and the one panel that belongs to this
 * program. It had become a stack of four: the list, the slot, the activity
 * panel and the reports, so the thing you came for was a third of the way
 * down a page you had to scroll to see.
 *
 * Five rows, then a disclosure. A list of nineteen is not a list of things to
 * do, it is a wall, and nobody starts at the top of a wall.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

/** Beyond this the list stops being a list. */
const SHOWN = 5;

export function ProgramTodayPanel({
  data, programName, slot,
}: {
  data: ProgramToday;
  programName: string;
  /** The program's own panel — the single thing under the list. */
  slot?: React.ReactNode;
}) {
  const first = data.rows.slice(0, SHOWN);
  const rest = data.rows.slice(SHOWN);

  return (
    <div className="joc-today">
      <div style={{ minWidth: 0 }}>
        <h2 style={{ ...sectionHeading, margin: "0 0 2px" }}>Needs you</h2>
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.45, margin: "0 0 14px" }}>
          Worst first. Every action is recorded; nothing is sent.
        </p>

        {data.rows.length === 0 ? (
          <div style={{ ...rowCard, padding: "24px" }}>
            <p style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.greenText, margin: "0 0 6px" }}>
              Nothing needs you today
            </p>
            <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: 0, maxWidth: "56ch" }}>
              No school is stuck, no sign-up is waiting, and every run in the next fortnight is
              announced.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {first.map((r) => <Row key={r.id} r={r} />)}

            {rest.length > 0 && (
              <details>
                <summary style={{
                  fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue,
                  cursor: "pointer", minHeight: "44px", display: "flex", alignItems: "center",
                }}>
                  Show {rest.length} more
                </summary>
                <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
                  {rest.map((r) => <Row key={r.id} r={r} />)}
                </div>
              </details>
            )}
          </div>
        )}

        {/* One panel, whichever this program's is. */}
        {slot && <div style={{ marginTop: "32px" }}>{slot}</div>}
      </div>

      {/* The right-hand column: what is actually in the diary. */}
      <aside style={{ minWidth: 0 }}>
        <div style={{ ...rowCard, padding: "18px 20px" }}>
          <p style={{ ...label, color: C.muted, margin: "0 0 12px" }}>Coming up</p>

          {data.comingUp.length === 0 ? (
            <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, lineHeight: 1.5, margin: 0 }}>
              {programName} is not booked in anywhere. Dates are set on the calendar.
            </p>
          ) : (
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "14px" }}>
              {data.comingUp.map((e) => (
                <li key={e.id} style={{ minWidth: 0 }}>
                  <p style={{ ...label, color: e.published ? C.muted : C.orangeText, margin: "0 0 3px" }}>
                    {day(e.startsAt)}
                    {!e.published && " · not announced"}
                  </p>
                  <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.35 }}>
                    {e.title}
                  </p>
                  <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: "2px 0 0", lineHeight: 1.45 }}>
                    {e.schoolName ?? "Open to every school"}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <p style={{ margin: "14px 0 0" }}>
            <Link href="/admin/programming" style={{
              fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue,
              textDecoration: "underline", minHeight: "44px", display: "inline-flex", alignItems: "center",
            }}>
              Open the calendar
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}

/** The one sentence a slot with no data source shows. */
export function EmptySlot({ title, missing }: { title: string; missing: string }) {
  return (
    <div>
      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>{title}</h2>
      <div style={{ ...rowCard, padding: "22px 24px" }}>
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, lineHeight: 1.5, margin: 0, maxWidth: "62ch" }}>
          {missing}
        </p>
      </div>
    </div>
  );
}

/**
 * One row.
 *
 * An ask is the only row a coordinator can close from here, because it is the
 * only one that is not derived from the state of the program — a school
 * wrote it, and somebody has to say it has been dealt with. Every other row
 * stops appearing when the thing behind it stops being true.
 */
function Row({ r }: { r: TodayRow }) {
  return (
    <BandRow
      tone={r.tone}
      label={r.label}
      figure={r.figure}
      word={/[a-z]/.test(r.figure)}
      title={r.title}
      line={r.line}
      action={r.askId ? undefined : r.action}
      actionNode={r.askId ? <AnswerAsk askId={r.askId} /> : undefined}
    />
  );
}
