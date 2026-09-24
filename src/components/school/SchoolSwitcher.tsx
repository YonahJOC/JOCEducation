"use client";

import { useTransition } from "react";
import { viewAsSchool } from "@/app/actions/view-as-school";
import { C, R, F, label } from "@/lib/joc-tokens";

/**
 * Hop straight from one school's panel to another's.
 *
 * Looking in on a school meant going back to the console, opening Schools,
 * finding the next one and pressing its button — four steps to answer "and
 * what does a school with nothing set up see?". The whole point of the three
 * test schools is comparing them, so the comparison should be one click.
 *
 * It only ever appears inside the looking-in banner, which only appears for
 * somebody who already holds the schools capability.
 */
export function SchoolSwitcher({
  schools, current,
}: {
  schools: { slug: string; name: string }[];
  current: string;
}) {
  const [pending, start] = useTransition();

  if (schools.length < 2) return null;

  return (
    <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ ...label, color: C.onDarkLabel }}>Look at</span>

      <select
        value={current}
        disabled={pending}
        onChange={(e) => {
          const slug = e.target.value;
          if (slug !== current) start(() => { void viewAsSchool(slug); });
        }}
        style={{
          fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink,
          backgroundColor: C.white, border: "none", borderRadius: R.button,
          padding: "0 12px", minHeight: "44px", cursor: pending ? "default" : "pointer",
          maxWidth: "240px",
        }}
      >
        {schools.map((s) => (
          <option key={s.slug} value={s.slug}>{s.name}</option>
        ))}
      </select>
    </span>
  );
}
