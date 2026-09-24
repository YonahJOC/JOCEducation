import { BandRow } from "@/components/ui/BandRow";
import { C, rowCard, label, F } from "@/lib/joc-tokens";
import type { Today } from "@/lib/today";

/**
 * Today, for whoever is looking.
 *
 * As in 3a: the date in mono, then a heading that is the answer rather than
 * the word "Today", then the rows, then the figures.
 *
 * No sentence here explains how the page works. The heading says what is true
 * and the rows say what to do about it; anything that needed explaining was a
 * sign the rows were not clear enough.
 */
export function TodayPage({ data, children }: { data: Today; children?: React.ReactNode }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short",
  }).toUpperCase();

  return (
    <div>
      <p style={{ ...label, color: C.muted, margin: "0 0 6px" }}>{today}</p>
      <h1 style={{
        fontFamily: F.ui, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em",
        color: C.ink, margin: "0 0 16px", lineHeight: 1.15,
      }}>
        {data.title}
      </h1>

      {data.rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.greenText, margin: "0 0 6px" }}>
            Nothing needs you today
          </p>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.45, margin: 0, maxWidth: "56ch" }}>
            No school is overdue, nothing is waiting on a decision, and every run this week is
            announced.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {data.rows.map((r) => (
            <BandRow
              key={r.id}
              tone={r.tone}
              label={r.label}
              figure={r.figure}
              title={r.title}
              line={r.line}
              action={r.action ?? undefined}
            />
          ))}
        </div>
      )}

      {/* Real counts only: the number first, its name under it in mono, four
          across with nothing drawn around them. */}
      {data.figures.length > 0 && (
        <div className="joc-figures" style={{ marginTop: "22px" }}>
          {data.figures.map((f) => (
            <div key={f.label} style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{
                fontFamily: F.ui, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em",
                color: C.ink, lineHeight: 1.15,
              }}>
                {f.value}
              </span>
              <span style={{ ...label, fontSize: "10px", color: C.muted }}>{f.label}</span>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
