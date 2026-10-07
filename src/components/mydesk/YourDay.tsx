import { C, F } from "@/lib/joc-tokens";
import { Panel, Empty, Meta, QUIET, FAINT, RULE } from "./parts";
import type { DayItem } from "@/lib/my-desk";

/**
 * Your day — what is actually booked, and nothing aspirational.
 *
 * Today sits at the top with its times in mono, so the column of times reads
 * as a column. The rest of the fortnight is a quieter list underneath: a
 * diary showing a month at once is a diary nobody reads at 8am.
 */
export function YourDay({ day }: { day: DayItem[] }) {
  const today = day.filter((d) => d.today);
  const rest = day.filter((d) => !d.today);

  return (
    <Panel
      title="Your day"
      count={today.length ? `${today.length === 1 ? "1 THING" : `${today.length} THINGS`} TODAY` : ""}
    >
      {day.length === 0 ? (
        <Empty line="Nothing booked this week. School visits and events you book show up here." />
      ) : null}

      {today.map((d) => (
        <div key={d.id} style={{ display: "flex", gap: "14px", padding: "10px 18px", borderBottom: `1px solid ${RULE}` }}>
          <span style={{ flex: "0 0 48px", font: `600 13px/1.45 ${F.data}`, color: C.ink }}>
            {d.time ?? "—"}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: `600 15px/1.3 ${F.ui}`, color: C.ink }}>{d.title}</div>
            {d.meta ? <Meta text={d.meta} /> : null}
          </div>
        </div>
      ))}

      {rest.length ? (
        <>
          <div style={{
            padding: "12px 18px 4px", font: `600 10.5px/1 ${F.data}`,
            letterSpacing: ".1em", color: FAINT,
          }}>
            LATER THIS WEEK
          </div>
          {rest.map((d) => (
            <div key={d.id} style={{ display: "flex", gap: "14px", padding: "7px 18px" }}>
              <span style={{
                flex: "0 0 48px", font: `600 10.5px/1.7 ${F.data}`,
                letterSpacing: ".06em", color: QUIET,
              }}>
                {d.when.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).toUpperCase()}
              </span>
              <div style={{ minWidth: 0, font: `400 15px/1.45 ${F.read}`, color: "#1F304D" }}>
                {d.title}
              </div>
            </div>
          ))}
        </>
      ) : null}
    </Panel>
  );
}
