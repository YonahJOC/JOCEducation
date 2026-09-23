import Link from "next/link";
import {
  C, R, ROW_SHADOW, rowCard, rowInner, rowBand, rowBody, rowAction,
  label, F, pageTitle, secondaryButton,
} from "@/lib/joc-tokens";
import type { Today } from "@/lib/today";

/**
 * Today, for whoever is looking.
 *
 * /admin was a board of every school — a thing to browse rather than a thing
 * to do. Every row here is true right now and has one action; deal with it
 * and the row goes, because they are derived rather than queued.
 */

const TONE: Record<"warn" | "info" | "good", { bg: string; fg: string }> = {
  warn: { bg: C.orange, fg: C.ink },
  info: { bg: C.blue, fg: C.white },
  good: { bg: C.greenTint, fg: C.greenText },
};

export function TodayPage({ data, children }: { data: Today; children?: React.ReactNode }) {
  return (
    <div>
      <h1 style={pageTitle}>{data.title}</h1>
      <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: "0 0 22px", maxWidth: "62ch" }}>
        Everything below is true right now and is worked out from the state of things — nothing to
        mark as read.
      </p>

      {data.rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "28px 24px" }}>
          <p style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, color: C.greenText, margin: "0 0 6px" }}>
            Nothing needs you today
          </p>
          <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: 0, maxWidth: "56ch" }}>
            No school is overdue, nothing is waiting on a decision, and every run in the next week
            is announced.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {data.rows.map((r) => {
            const tone = TONE[r.tone];
            return (
              <div key={r.id} style={rowCard}>
                <div style={rowInner}>
                  <div style={{ ...rowBand, backgroundColor: tone.bg, color: tone.fg }}>
                    <span style={{ ...label, color: tone.fg }}>{r.band}</span>
                  </div>

                  <div style={rowBody}>
                    <p style={{ fontFamily: F.read, fontSize: "17px", color: C.ink, lineHeight: 1.6, margin: 0 }}>
                      {r.says}
                    </p>
                  </div>

                  {r.action && (
                    <div style={rowAction}>
                      <Link href={r.action.href} style={{ ...secondaryButton, textDecoration: "none" }}>
                        {r.action.label}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.figures.length > 0 && (
        <div style={{
          display: "grid", gap: "10px", marginTop: "20px",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        }}>
          {data.figures.map((f) => (
            <div key={f.label} style={{
              backgroundColor: f.warn ? C.orangeTint : C.panel,
              borderRadius: R.form, padding: "14px 16px",
            }}>
              <p style={{ ...label, color: f.warn ? C.orangeText : C.muted, margin: "0 0 4px" }}>{f.label}</p>
              <p style={{
                fontFamily: F.ui, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em",
                color: f.warn ? C.orangeText : C.ink, margin: 0, lineHeight: 1.1,
              }}>
                {f.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
