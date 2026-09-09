"use client";

import Link from "next/link";
import { CYCLES, getCycleState, getCurrentWeek } from "@/lib/cycles";

export function CycleStripSection() {
  const current = CYCLES.find((c) => getCycleState(c) === "current") ?? CYCLES[0];
  const state = getCycleState(current);
  const week = getCurrentWeek(current);
  const progress =
    state === "past" ? 100 : state === "upcoming" ? 0 : Math.round((week / current.weeks) * 100);

  return (
    <section
      id="chesed-cycle"
      style={{ padding: "16px 26px 0", maxWidth: "1280px", margin: "0 auto" }}
    >
      {/* Eyebrow */}
      <p
        style={{
          fontWeight: 700,
          fontSize: "11.5px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#C96C00",
          marginBottom: "10px",
        }}
      >
        01 — THE CHESED CYCLE
      </p>

      {/* Strip card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(16,35,63,.1)",
          borderRadius: "26px",
          overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: "5px", backgroundColor: current.color }} />

        <div
          style={{
            padding: "28px 30px 26px",
            display: "flex",
            flexWrap: "wrap",
            gap: "28px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Identity */}
          <div style={{ minWidth: "220px", flex: "1 1 220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              {state === "current" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(27,127,75,.1)",
                    color: "#1B7F4B",
                    fontWeight: 600,
                    fontSize: "11.5px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                  }}
                >
                  <span
                    className="joc-pulse"
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#1B7F4B",
                      flexShrink: 0,
                    }}
                  />
                  Running now
                </span>
              )}
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: current.color,
                  letterSpacing: "0.01em",
                }}
              >
                Cycle {current.num} · {current.hebrew}
              </span>
            </div>
            <p
              style={{
                fontWeight: 800,
                fontSize: "clamp(20px, 2.5vw, 28px)",
                letterSpacing: "-0.03em",
                color: "#10233F",
                lineHeight: 1.1,
                marginBottom: "3px",
              }}
            >
              {current.theme}
            </p>
            <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)" }}>{current.gloss}</p>
          </div>

          {/* Progress */}
          <div style={{ flex: "1 1 200px", minWidth: "180px", maxWidth: "320px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "rgba(16,35,63,.55)",
                marginBottom: "7px",
              }}
            >
              <span>
                {state === "current"
                  ? `Week ${week} of ${current.weeks}`
                  : state === "past"
                  ? `${current.weeks} weeks complete`
                  : `${current.weeks} weeks`}
              </span>
              <span>{progress}%</span>
            </div>
            <div
              style={{
                height: "5px",
                borderRadius: "9999px",
                backgroundColor: "rgba(16,35,63,.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: "9999px",
                  backgroundColor: current.color,
                  transition: "width .4s ease",
                }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "rgba(16,35,63,.45)", marginTop: "6px" }}>{current.range}</p>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href={`/cycles/${current.slug}`}
              style={{
                display: "inline-block",
                backgroundColor: current.color,
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "9999px",
                padding: "12px 22px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              See the Cycle plan
            </Link>
            <Link
              href="/cycles"
              style={{
                display: "inline-block",
                color: "rgba(16,35,63,.6)",
                fontWeight: 500,
                fontSize: "13.5px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              All {CYCLES.length} Cycles ›
            </Link>
          </div>
        </div>

        {/* Month chip rail */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "0 30px 22px",
            scrollbarWidth: "none",
          }}
        >
          {CYCLES.map((c) => {
            const s = getCycleState(c);
            const isActive = c.num === current.num;
            return (
              <Link
                key={c.slug}
                href={`/cycles/${c.slug}`}
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  flexShrink: 0,
                  padding: "10px 14px",
                  borderRadius: "14px",
                  textDecoration: "none",
                  backgroundColor: isActive ? c.color : "rgba(16,35,63,.04)",
                  border: isActive ? "none" : "1px solid rgba(16,35,63,.09)",
                  transition: "background .15s",
                  minWidth: "92px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: isActive ? "rgba(255,255,255,.75)" : "rgba(16,35,63,.45)",
                    marginBottom: "2px",
                  }}
                >
                  {c.hebrew.split(" – ")[0]}
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: isActive ? "#fff" : s === "past" ? "rgba(16,35,63,.45)" : "#10233F",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {c.theme.split(" ").slice(0, 2).join(" ")}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
