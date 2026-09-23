import { BandRow } from "@/components/ui/BandRow";
import { C, R, rowCard, label, F, pageTitle } from "@/lib/joc-tokens";
import type { Today } from "@/lib/today";

/**
 * Today, for whoever is looking.
 *
 * No sentence here explains how the page works. The heading says what it is
 * and the rows say what is true; anything that needed explaining was a sign
 * the rows were not clear enough.
 */
export function TodayPage({ data, children }: { data: Today; children?: React.ReactNode }) {
  return (
    <div>
      <h1 style={pageTitle}>{data.title}</h1>

      {data.rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "28px 24px", marginTop: "18px" }}>
          <p style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, color: C.greenText, margin: "0 0 6px" }}>
            Nothing needs you today
          </p>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.45, margin: 0, maxWidth: "56ch" }}>
            No school is overdue, nothing is waiting on a decision, and every run this week is
            announced.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginTop: "18px" }}>
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

      {/* Real counts only, in one row, with no box around each. */}
      {data.figures.length > 0 && (
        <div style={{
          display: "flex", gap: "40px", flexWrap: "wrap",
          marginTop: "26px", paddingTop: "20px", borderTop: `1px solid ${C.hairline}`,
        }}>
          {data.figures.map((f) => (
            <div key={f.label}>
              <p style={{ ...label, color: C.muted, margin: "0 0 4px" }}>{f.label}</p>
              <p style={{
                fontFamily: F.ui, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em",
                color: C.ink, margin: 0, lineHeight: 1.1,
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
