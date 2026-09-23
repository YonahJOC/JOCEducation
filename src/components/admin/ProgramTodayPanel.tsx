import Link from "next/link";
import {
  C, R, ROW_SHADOW, rowCard, rowInner, rowBand, rowBody, rowAction,
  rowTitle, label, F, secondaryButton, primaryButton,
} from "@/lib/joc-tokens";
import type { ProgramToday, TodayKind } from "@/lib/program-today";

/**
 * The Today tab: what needs this program's coordinator, worst first.
 *
 * Everything here is derived from the state of the program rather than from a
 * queue of notifications, so a row that stops being true stops appearing.
 * Nobody has to mark anything as read.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

/**
 * A row's colour says how it got here.
 *
 * Orange is a thing that has gone wrong on its own; blue is somebody
 * speaking to us; green is an answer coming back.
 */
const TONE: Record<TodayKind, { bg: string; fg: string }> = {
  STUCK: { bg: C.orange, fg: C.ink },
  UNANNOUNCED: { bg: C.orange, fg: C.ink },
  NEW_SIGN_UP: { bg: C.blue, fg: C.white },
  NO_WRITE_UP: { bg: C.panel, fg: C.blue },
  DECIDED: { bg: C.greenTint, fg: C.greenText },
};

export function ProgramTodayPanel({
  data, programName, slug, slot,
}: {
  data: ProgramToday;
  programName: string;
  slug: string;
  /** The program's own panel, already rendered by the page. */
  slot: React.ReactNode;
}) {
  return (
    <div className="joc-today">
      <div style={{ minWidth: 0 }}>
        <h2 style={{ fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 2px" }}>
          Needs you
        </h2>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: "0 0 16px", maxWidth: "58ch" }}>
          Worked out from where every school has got to. Nothing here is a notification — deal with
          it and it stops appearing on its own.
        </p>

        {data.rows.length === 0 ? (
          <div style={{ ...rowCard, padding: "28px 24px" }}>
            <p style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.greenText, margin: "0 0 6px" }}>
              Nothing needs you today
            </p>
            <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: 0, maxWidth: "56ch" }}>
              No school is stuck, no sign-up is waiting, and every run in the next fortnight is
              announced.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {data.rows.map((r) => {
              const tone = TONE[r.kind];
              return (
                <div key={r.id} style={rowCard}>
                  <div style={rowInner}>
                    <div style={{ ...rowBand, backgroundColor: tone.bg, color: tone.fg }}>
                      <span style={{ ...label, color: tone.fg }}>{r.band}</span>
                    </div>

                    <div style={rowBody}>
                      <p style={rowTitle}>{r.schoolName}</p>
                      <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.55, margin: 0 }}>
                        {r.says}
                      </p>
                    </div>

                    <div style={rowAction}>
                      <Link href={r.action.href} style={{ ...secondaryButton, textDecoration: "none" }}>
                        {r.action.label}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* The program's own panel, whatever it is for this one. */}
        <div style={{ marginTop: "26px" }}>{slot}</div>
      </div>

      {/* The right-hand column: what is actually in the diary. */}
      <aside style={{ minWidth: 0 }}>
        <div style={{ ...rowCard, padding: "18px 20px" }}>
          <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>Coming up</p>

          {data.comingUp.length === 0 ? (
            <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, lineHeight: 1.6, margin: 0 }}>
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
                  <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: "2px 0 0", lineHeight: 1.5 }}>
                    {e.schoolName ?? "Open to every school"}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <p style={{ marginTop: "16px" }}>
            <Link href="/admin/programming" style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.blue, textDecoration: "underline", minHeight: "44px", display: "inline-flex", alignItems: "center" }}>
              Open the calendar
            </Link>
          </p>
        </div>

        <div style={{ ...rowCard, padding: "18px 20px", marginTop: "12px", backgroundColor: C.panel, boxShadow: "none" }}>
          <p style={{ ...label, color: C.muted, margin: "0 0 8px" }}>This program</p>
          <p style={{ fontFamily: F.read, fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: 0 }}>
            Everything on this console is {programName} and nothing else. Other coordinators cannot
            see it, and you cannot see theirs.
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
      <h2 style={{ fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 2px" }}>
        {title}
      </h2>
      <div style={{ ...rowCard, padding: "22px 24px", marginTop: "12px" }}>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.6, margin: 0, maxWidth: "62ch" }}>
          {missing}
        </p>
      </div>
    </div>
  );
}
