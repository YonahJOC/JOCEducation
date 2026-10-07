import { C, F, label } from "@/lib/joc-tokens";
import { Panel, GroupHead, Empty, Meta, SUB } from "./parts";
import type { DayItem } from "@/lib/my-desk";

/**
 * Your day — what is actually booked, and nothing aspirational.
 *
 * Today sits at the top with its times; the rest of the fortnight is a list of
 * days. A diary that shows a month at once is a diary nobody reads at 8am.
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
        <Empty
          head="Nothing booked this week."
          line="School visits and events you book show up here, with whatever you've dated on your list."
        />
      ) : null}

      {today.map((d) => (
        <div key={d.id} style={{ display: "flex", gap: "12px", padding: "10px 2px", borderBottom: `1px solid ${C.hairline}` }}>
          <span style={{ ...label, color: C.blue, flex: "0 0 62px", paddingTop: "2px" }}>
            {d.time ?? "ALL DAY"}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.ink, margin: 0 }}>
              {d.title}
            </p>
            {d.meta ? <Meta text={d.meta} /> : null}
          </div>
        </div>
      ))}

      {rest.length ? (
        <>
          <GroupHead text="Later this week" />
          {rest.map((d) => (
            <div key={d.id} style={{ display: "flex", gap: "12px", padding: "8px 2px" }}>
              <span style={{ ...label, color: C.faint, flex: "0 0 62px", paddingTop: "2px" }}>
                {d.when.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).toUpperCase()}
              </span>
              <p style={{ fontFamily: F.ui, fontSize: "14px", color: SUB, margin: 0 }}>{d.title}</p>
            </div>
          ))}
        </>
      ) : null}
    </Panel>
  );
}
