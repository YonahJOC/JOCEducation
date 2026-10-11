"use client";

import { useState, useTransition } from "react";
import { C, F, T, HIT } from "@/lib/joc-tokens";
import { Panel } from "./parts";
import { addColleagueEvent } from "@/app/actions/my-desk";
import type { ColleagueItem } from "@/lib/my-desk";

/**
 * The office's week: what everybody else has put in their diary.
 *
 * It sits beside This week rather than inside it. Your week is what you are
 * doing; this is what the office is doing, and you choose what to take on —
 * a meeting Dalia booked with a school is worth knowing about, and only worth
 * a place in your own day if you are going.
 *
 * Adding copies it into your week, and it then leaves this card.
 */
export function ColleaguesWeek({ items }: { items: ColleagueItem[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  function add(id: string) {
    setError(null);
    setAdding(id);
    start(async () => {
      const res = await addColleagueEvent(id);
      if (!res.ok) setError(res.error);
      setAdding(null);
    });
  }

  return (
    <Panel
      title="The office's week"
      icon="groups"
      iconTint={[C.blue, C.blueTint]}
      count={`${items.length} ${items.length === 1 ? "ENTRY" : "ENTRIES"}`}
    >
      {error ? (
        <div style={{ ...T.meta, color: C.destructive, paddingBottom: "6px" }}>{error}</div>
      ) : null}

      {items.map((d) => {
        const weekday = d.today
          ? "TODAY"
          : d.when.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase();
        return (
          <div
            key={d.id}
            style={{
              display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) auto",
              gap: "14px", alignItems: "center", padding: "7px 0", minHeight: HIT,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                borderRadius: "12px", padding: "6px 0", textAlign: "center",
                background: C.blueTint, color: C.ink,
              }}
            >
              <div style={{ fontFamily: F.data, fontSize: "11px", fontWeight: 600, color: C.faint }}>
                {weekday}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: "22px", fontWeight: 700, lineHeight: 1.1 }}>
                {d.today && d.time ? d.time.replace(/\s?[AP]M$/i, "") : d.when.getUTCDate()}
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 600, color: C.ink }}>
                {d.title}
              </div>
              <div style={{ ...T.meta, marginTop: "2px" }}>
                {[d.who.toUpperCase(), d.time && !d.today ? d.time : null, d.meta].filter(Boolean).join(" · ")}
              </div>
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={() => add(d.id)}
              aria-label={`Add ${d.title} to my week`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                minHeight: HIT, padding: "0 14px", borderRadius: "999px",
                background: C.blueTint, color: C.blue, border: 0,
                fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                cursor: pending ? "default" : "pointer", whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "18px" }}>add</span>
              {adding === d.id ? "Adding…" : "Add to my week"}
            </button>
          </div>
        );
      })}
    </Panel>
  );
}
