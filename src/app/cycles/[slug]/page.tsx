import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CYCLES, getCycleBySlug, getCycleState } from "@/lib/cycles";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return CYCLES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cycle = getCycleBySlug(slug);
  if (!cycle) return {};
  return {
    title: `Cycle ${cycle.num}: ${cycle.theme} — JOC Education`,
    description: cycle.desc,
    openGraph: {
      title: `Cycle ${cycle.num}: ${cycle.theme}`,
      description: cycle.gloss,
    },
  };
}

export default async function CycleDetailPage({ params }: Props) {
  const { slug } = await params;
  const cycle = getCycleBySlug(slug);
  if (!cycle) notFound();

  const state = getCycleState(cycle);
  const nextCycle = CYCLES[cycle.num] ?? null; // cycle.num is 1-based; CYCLES[cycle.num] is next

  return (
    <main>
      {/* Colored band */}
      <div
        style={{
          backgroundColor: cycle.color,
          padding: "56px 26px 52px",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Breadcrumb */}
          <p style={{ fontSize: "13px", fontWeight: 500, opacity: 0.75, marginBottom: "20px" }}>
            <Link href="/cycles" style={{ color: "inherit", textDecoration: "none", opacity: 0.85 }}>
              Chesed Cycles
            </Link>
            {" · "}
            Cycle {cycle.num}
          </p>

          {/* Anchor chip */}
          <div style={{ marginBottom: "18px" }}>
            <span
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,.18)",
                border: "1px solid rgba(255,255,255,.35)",
                borderRadius: "9999px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              {cycle.anchor}
            </span>
            {cycle.israel && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "8px",
                  background: "rgba(255,255,255,.18)",
                  border: "1px solid rgba(255,255,255,.35)",
                  borderRadius: "9999px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                🇮🇱 Israel-focused
              </span>
            )}
          </div>

          {/* Hebrew + theme */}
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.75,
              marginBottom: "8px",
            }}
          >
            Cycle {cycle.num} · {cycle.hebrew}
          </p>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(34px, 5vw, 64px)",
              lineHeight: 1.03,
              letterSpacing: "-0.04em",
              marginBottom: "10px",
            }}
          >
            {cycle.theme}
          </h1>
          <p style={{ fontSize: "18px", opacity: 0.8, marginBottom: "22px", fontWeight: 400 }}>
            {cycle.gloss}
          </p>

          {/* Guiding question */}
          <p
            style={{
              fontStyle: "italic",
              fontFamily: "var(--font-newsreader)",
              fontSize: "clamp(18px, 2.2vw, 24px)",
              lineHeight: 1.5,
              opacity: 0.9,
              maxWidth: "600px",
              borderLeft: "3px solid rgba(255,255,255,.5)",
              paddingLeft: "20px",
              marginBottom: "32px",
            }}
          >
            {cycle.question}
          </p>

          {/* Meta row */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px", opacity: 0.8 }}>
            <span>{cycle.range}</span>
            <span>·</span>
            <span>{cycle.weeks} weeks</span>
            {state === "current" && (
              <>
                <span>·</span>
                <span style={{ fontWeight: 700 }}>Running now</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 64px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* Left: week plan */}
          <div>
            <h2
              style={{
                fontWeight: 700,
                fontSize: "10.5px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: cycle.color,
                marginBottom: "18px",
              }}
            >
              WEEK BY WEEK
            </h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0" }}>
              {cycle.weekPlan.map((w, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: "16px",
                    paddingBottom: "24px",
                    position: "relative",
                  }}
                >
                  {/* Timeline line */}
                  {i < cycle.weekPlan.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "32px",
                        bottom: 0,
                        width: "1px",
                        backgroundColor: "rgba(16,35,63,.1)",
                      }}
                    />
                  )}
                  {/* Number bubble */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: cycle.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ paddingTop: "4px" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "16px",
                        letterSpacing: "-0.02em",
                        color: "#10233F",
                        marginBottom: "5px",
                        lineHeight: 1.2,
                      }}
                    >
                      {w.title}
                    </p>
                    <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6 }}>{w.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Description */}
            <div
              style={{
                backgroundColor: "#F4F7FD",
                borderRadius: "20px",
                padding: "26px",
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
                ABOUT THIS CYCLE
              </p>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.8)", lineHeight: 1.65 }}>{cycle.desc}</p>
            </div>

            {/* Programming */}
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(16,35,63,.1)",
                borderRadius: "20px",
                padding: "26px",
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
                PROGRAMMING
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
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

            {/* Calendar */}
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(16,35,63,.1)",
                borderRadius: "20px",
                padding: "26px",
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
                CALENDAR
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  ["Dates", cycle.range],
                  ["Weeks", `${cycle.weeks} weeks`],
                  ["Hebrew month", cycle.hebrew],
                  ["Anchor", cycle.anchor],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", gap: "12px", fontSize: "14px" }}>
                    <span style={{ color: "rgba(16,35,63,.5)", minWidth: "100px" }}>{label}</span>
                    <span style={{ color: "#10233F", fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Up Next */}
            {nextCycle && (
              <div
                style={{
                  border: "1px dashed rgba(16,35,63,.22)",
                  borderRadius: "20px",
                  padding: "22px 26px",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "10.5px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(16,35,63,.5)",
                    marginBottom: "10px",
                  }}
                >
                  UP NEXT
                </p>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "20px",
                    letterSpacing: "-0.025em",
                    color: "#10233F",
                    marginBottom: "4px",
                  }}
                >
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

            {/* CTA */}
            <Link
              href="/pricing"
              style={{
                display: "block",
                textAlign: "center",
                backgroundColor: cycle.color,
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                borderRadius: "9999px",
                padding: "16px 24px",
                textDecoration: "none",
              }}
            >
              {state === "current" ? "Join this Cycle" : state === "past" ? "See next year's program" : "Get notified when it starts"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
