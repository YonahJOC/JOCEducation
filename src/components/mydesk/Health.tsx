"use client";

import Link from "next/link";
import { useState } from "react";
import { C, F, R, label, ROW_SHADOW } from "@/lib/joc-tokens";
import { btn } from "./parts";
import type { TodayRow } from "@/lib/today";

const DOT: Record<string, string> = {
  red: "#D8412F", orange: "#FA912D", blue: "#2D46AF", green: "#2FA457", grey: C.faint,
};

/**
 * Console health — the super admin's own corner, folded shut.
 *
 * These are the things that are wrong with the installation rather than with
 * the work: settings missing, no meeting booked, nothing published. They used
 * to be the first thing everybody saw on opening the console, which made the
 * console feel like a fault report. Nobody else can see this section at all.
 */
export function Health({ rows }: { rows: TodayRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section
      style={{
        marginTop: "18px", backgroundColor: C.white, borderRadius: R.hero,
        boxShadow: ROW_SHADOW, overflow: "hidden",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px" }}>
        <h2 style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink, margin: 0 }}>
          Admin · console health
        </h2>
        <span
          style={{
            ...label, backgroundColor: C.orangeTint, color: C.orangeText,
            padding: "2px 8px", borderRadius: "9999px",
          }}
        >
          {rows.length} OPEN
        </span>
        <span style={{ ...label, color: C.outline }}>ONLY YOU SEE THIS</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ ...btn.base, ...btn.quiet, marginLeft: "auto" }}
        >
          {open ? "Hide" : "Show"}
        </button>
      </header>

      {open ? (
        <div style={{ borderTop: `1px solid ${C.hairline}` }}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                padding: "11px 16px", borderBottom: `1px solid ${C.hairline}`,
              }}
            >
              <span
                style={{
                  flex: "0 0 auto", width: "8px", height: "8px", borderRadius: "9999px",
                  backgroundColor: DOT[r.tone] ?? DOT.grey, marginTop: "6px",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.ink, margin: 0 }}>
                  {r.title}
                </p>
                {r.line ? (
                  <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted, margin: "2px 0 0" }}>
                    {r.line}
                  </p>
                ) : null}
              </div>
              {r.action ? (
                <Link
                  href={r.action.href}
                  style={{ ...btn.base, ...btn.quiet, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
                >
                  {r.action.label}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
