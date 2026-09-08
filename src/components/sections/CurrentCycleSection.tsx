import Link from "next/link";
import { CYCLES, type Cycle, getCycleState, getCurrentWeek } from "@/lib/cycles";

function anchorStyle(israel?: boolean): React.CSSProperties {
  return israel
    ? { background: "#F4F7FD", color: "#1E47B8", border: "1px solid rgba(30,71,184,.25)" }
    : { background: "rgba(16,35,63,.05)", color: "rgba(16,35,63,.72)", border: "1px solid rgba(16,35,63,.1)" };
}

export function CurrentCycleSection({ cycle }: { cycle: Cycle }) {
  const state = getCycleState(cycle);
  const week = getCurrentWeek(cycle);
  const progress = state === "past" ? 100 : state === "upcoming" ? 0 : Math.round((week / cycle.weeks) * 100);

  const nextCycle = CYCLES[cycle.num] ?? null; // cycle.num is 1-based so CYCLES[cycle.num] is next

  const statusLabel =
    state === "current"
      ? `Running now · week ${week} of ${cycle.weeks}`
      : state === "past"
      ? "Completed Cycle"
      : "Upcoming Cycle";

  const ctaLabel =
    state === "current"
      ? "Join this Cycle"
      : state === "past"
      ? "Read the Cycle recap"
      : "Get notified when it starts";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "32px",
        alignItems: "start",
      }}
    >
      {/* Left: identity */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          {/* Status dot + label */}
          {state === "current" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(27,127,75,.1)",
                color: "#1B7F4B",
                fontWeight: 600,
                fontSize: "12px",
                padding: "5px 11px",
                borderRadius: "9999px",
                letterSpacing: "0.01em",
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
              {statusLabel}
            </span>
          )}
          {state !== "current" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: 600,
                padding: "5px 11px",
                borderRadius: "9999px",
                background: "rgba(16,35,63,.06)",
                color: "rgba(16,35,63,.65)",
              }}
            >
              {statusLabel}
            </span>
          )}
          {/* Anchor chip */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: "12px",
              fontWeight: 500,
              padding: "5px 11px",
              borderRadius: "9999px",
              ...anchorStyle(cycle.israel),
            }}
          >
            {cycle.anchor}
          </span>
        </div>

        {/* Cycle number + theme */}
        <p
          style={{
            fontWeight: 700,
            fontSize: "11.5px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: cycle.color,
            marginBottom: "6px",
          }}
        >
          Cycle {cycle.num} · {cycle.hebrew}
        </p>
        <h2
          style={{
            fontWeight: 800,
            fontSize: "clamp(28px, 3.2vw, 42px)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: "#10233F",
            marginBottom: "4px",
          }}
        >
          {cycle.theme}
        </h2>
        <p style={{ fontWeight: 400, fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "16px" }}>
          {cycle.gloss}
        </p>

        {/* Guiding question */}
        <p
          style={{
            fontStyle: "italic",
            fontSize: "18px",
            lineHeight: 1.5,
            color: "#10233F",
            borderLeft: `3px solid ${cycle.color}`,
            paddingLeft: "16px",
            marginBottom: "24px",
            fontFamily: "var(--font-newsreader)",
          }}
        >
          {cycle.question}
        </p>

        {/* Week progress bar */}
        {state !== "upcoming" && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "rgba(16,35,63,.55)",
                marginBottom: "6px",
              }}
            >
              <span>{state === "current" ? `Week ${week} of ${cycle.weeks}` : `${cycle.weeks} weeks`}</span>
              <span>{progress}%</span>
            </div>
            <div
              style={{
                height: "5px",
                borderRadius: "9999px",
                backgroundColor: "rgba(16,35,63,.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: "9999px",
                  backgroundColor: cycle.color,
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Meta row */}
        <p
          style={{
            fontSize: "13.5px",
            color: "rgba(16,35,63,.55)",
            marginBottom: "22px",
          }}
        >
          {cycle.range} · {cycle.weeks} weeks
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/pricing"
            style={{
              display: "inline-block",
              backgroundColor: cycle.color,
              color: "#fff",
              fontWeight: 700,
              fontSize: "14.5px",
              borderRadius: "9999px",
              padding: "13px 24px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {ctaLabel}
          </Link>
          <Link
            href={`/cycles/${cycle.slug}`}
            style={{
              display: "inline-block",
              color: cycle.color,
              fontWeight: 600,
              fontSize: "14.5px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            See the Cycle plan ›
          </Link>
        </div>
      </div>

      {/* Right: detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Description */}
        <div
          style={{
            backgroundColor: "#F4F7FD",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: "10.5px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#10233F",
              marginBottom: "12px",
            }}
          >
            WHAT THIS CYCLE IS ABOUT
          </p>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.8)", lineHeight: 1.65 }}>{cycle.desc}</p>
        </div>

        {/* Focus */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            border: "1px solid rgba(16,35,63,.1)",
            padding: "24px",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: "10.5px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#10233F",
              marginBottom: "14px",
            }}
          >
            CYCLE FOCUS
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {cycle.focus.map((f, i) => (
              <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: cycle.color,
                    flexShrink: 0,
                    marginTop: "6px",
                  }}
                />
                <span style={{ fontSize: "14.5px", color: "#10233F", lineHeight: 1.5 }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats (only Cycle 1 has stats hardcoded) */}
        {cycle.stats && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px",
              border: "1px solid rgba(16,35,63,.1)",
              padding: "20px 24px",
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: cycle.color,
                  lineHeight: 1,
                }}
              >
                {cycle.stats.value}
              </span>
              <span style={{ fontSize: "13px", color: "rgba(16,35,63,.6)" }}>{cycle.stats.label}</span>
            </div>
            <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(16,35,63,.1)" }} />
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: cycle.color,
                  lineHeight: 1,
                }}
              >
                {cycle.stats.people}
              </span>
              <span style={{ fontSize: "13px", color: "rgba(16,35,63,.6)" }}>{cycle.stats.peopleLabel}</span>
            </div>
          </div>
        )}

        {/* Up Next (hidden on final cycle) */}
        {nextCycle && (
          <div
            style={{
              border: "1px dashed rgba(16,35,63,.22)",
              borderRadius: "24px",
              padding: "20px 24px",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: "10.5px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(16,35,63,.55)",
                marginBottom: "8px",
              }}
            >
              UP NEXT
            </p>
            <p style={{ fontWeight: 700, fontSize: "20px", letterSpacing: "-0.025em", color: "#10233F", marginBottom: "4px" }}>
              {nextCycle.theme}
            </p>
            <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)", marginBottom: "14px" }}>
              {nextCycle.hebrew} · {nextCycle.range} · {nextCycle.weeks} weeks
            </p>
            <Link
              href={`/cycles/${nextCycle.slug}`}
              style={{
                display: "inline-block",
                border: `1px solid ${nextCycle.color}`,
                color: nextCycle.color,
                fontWeight: 600,
                fontSize: "13.5px",
                borderRadius: "9999px",
                padding: "9px 18px",
                textDecoration: "none",
              }}
            >
              Preview Cycle {nextCycle.num} ›
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
