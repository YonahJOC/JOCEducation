import type { DiaryItem } from "@/lib/desk";
import { C, F } from "@/lib/joc-tokens";

/**
 * Your diary.
 *
 * Events booked at schools, and anything on your list with a date, in one
 * column — both are a thing on a day, and keeping them apart means checking
 * two places before you say yes to a third.
 *
 * Days, not a list of dates: today and tomorrow are the only two anybody
 * reads properly, so they get a pill and everything else gets plain mono.
 */

const DAY = 86400000;

export function YourDiary({ items, now }: { items: DiaryItem[]; now: Date }) {
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);

  // Group by day, in order, for the next week. Anything further out is a
  // count — a fortnight of empty Tuesdays is not a diary.
  const soon = items.filter((i) => i.when.getTime() < midnight.getTime() + 7 * DAY);
  const later = items.length - soon.length;

  const days = new Map<string, DiaryItem[]>();
  for (const i of soon) {
    const key = new Date(i.when).toISOString().slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), i]);
  }

  return (
    <div style={card}>
      <p style={{ ...mono, color: C.muted, marginBottom: "2px" }}>Your diary</p>

      {days.size === 0 ? (
        <p style={{
          fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted,
          margin: "8px 0 2px", fontStyle: "italic",
        }}>
          Nothing booked this week.
        </p>
      ) : (
        [...days.entries()].map(([key, list], n) => {
          const when = new Date(`${key}T00:00:00`);
          const off = Math.round((when.getTime() - midnight.getTime()) / DAY);
          return (
            <div
              key={key}
              style={{
                padding: "12px 0 2px",
                borderTop: n === 0 ? "none" : `1px solid ${C.hairline}`,
              }}
            >
              <DayLabel off={off} when={when} />
              {list.map((i) => (
                <div key={i.key} style={{ display: "flex", gap: "10px", padding: "7px 0 0" }}>
                  <span style={{
                    ...mono, flex: "0 0 52px",
                    color: i.kind === "due" ? C.destructive : C.muted,
                  }}>
                    {i.kind === "due" ? "DUE" : i.time ?? "—"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: i.kind === "due" ? F.read : F.ui,
                      fontSize: "15px", fontWeight: i.kind === "due" ? 400 : 600,
                      lineHeight: 1.35, color: C.ink, margin: 0,
                    }}>
                      {i.title}
                    </p>
                    {i.kind === "event" && (
                      <p style={{ ...mono, color: C.muted, margin: "2px 0 0" }}>{i.line}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

      {later > 0 && (
        <p style={{ ...mono, color: C.faint, margin: "12px 0 0" }}>
          {later} more later on
        </p>
      )}
    </div>
  );
}

function DayLabel({ off, when }: { off: number; when: Date }) {
  if (off <= 0) {
    return <span style={{ ...pill, backgroundColor: C.blue, color: C.white }}>Today</span>;
  }
  if (off === 1) {
    return <span style={{ ...pill, backgroundColor: C.blueTint, color: C.blue }}>Tomorrow</span>;
  }
  return (
    <span style={{ ...mono, color: C.muted }}>
      {when.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" }).toUpperCase()}
    </span>
  );
}

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: "18px", padding: "16px 18px 14px",
  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
  flex: "1 1 320px", minWidth: 0,
};

const mono: React.CSSProperties = {
  fontFamily: F.data, fontSize: "10.5px", fontWeight: 500,
  letterSpacing: "0.08em", textTransform: "uppercase", margin: 0,
};

const pill: React.CSSProperties = {
  ...mono, display: "inline-flex", alignItems: "center",
  borderRadius: "999px", padding: "4px 9px",
};
