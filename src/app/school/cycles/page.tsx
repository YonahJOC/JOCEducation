import { mySchool, myCycleProgress } from "@/lib/school-data";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE_TEXT = "#C96C00";
const RULE = "rgba(16,35,63,.14)";

export const metadata = { title: "Cycle progress — JOC Education" };

export default async function SchoolCyclesPage() {
  const [school, cycles] = await Promise.all([mySchool(), myCycleProgress()]);
  if (!school || !cycles) {
    return <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)" }}>Could not load your school.</p>;
  }

  const current = cycles.find((c) => c.state === "current");
  const behind = cycles.filter((c) => c.state !== "upcoming" && c.ourShare < c.networkMedianShare);
  const noLessons = cycles.filter((c) => c.lessons === 0);

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Cycle progress
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 18px" }}>
        How {school.name} is tracking through the year, against the network.
      </p>

      <div
        style={{
          backgroundColor: "#F4F7FD", border: "1px solid rgba(45,70,175,.18)",
          borderRadius: "14px", padding: "13px 16px", marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: INK, margin: 0 }}>
          The grey bar is the median across all JOC schools. Individual schools are never named or
          identified — only the spread.
        </p>
      </div>

      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {cycles.map((c) => {
            const ours = Math.round(c.ourShare * 100);
            const median = Math.round(c.networkMedianShare * 100);
            const isCurrent = c.state === "current";
            return (
              <div key={c.slug} style={{ opacity: c.state === "upcoming" ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", color: INK, fontWeight: isCurrent ? 700 : 500 }}>
                    <span style={{ color: c.color, fontWeight: 700 }}>{c.num}.</span> {c.theme}
                    {isCurrent && (
                      <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", backgroundColor: c.color, borderRadius: "9999px", padding: "2px 8px", marginLeft: "9px" }}>
                        Now
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", fontVariantNumeric: "tabular-nums" }}>
                    {c.state === "upcoming" ? `${c.lessons} lessons ready` : `${ours}% of your teachers · network ${median}%`}
                  </span>
                </div>

                {/* Ours, with the network median as a marker behind it */}
                <div style={{ position: "relative", height: "8px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.07)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${median}%`, backgroundColor: "rgba(16,35,63,.16)" }} />
                  <div style={{ position: "absolute", inset: 0, width: `${ours}%`, backgroundColor: c.color, borderRadius: "9999px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What would move this */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "22px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
          What would move this
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          {current && (
            <Nudge>
              <strong style={{ fontWeight: 600 }}>{current.theme}</strong> is running now
              {current.lessons > 0
                ? ` with ${current.lessons} lesson${current.lessons === 1 ? "" : "s"} ready. Send them to your teachers this week.`
                : ". No lessons are published for it yet — Just One Chesed is writing them."}
            </Nudge>
          )}
          {behind.length > 0 && (
            <Nudge>
              Your school is below the network median on{" "}
              <strong style={{ fontWeight: 600 }}>{behind.slice(0, 2).map((c) => c.theme).join(" and ")}</strong>
              {behind.length > 2 ? ` and ${behind.length - 2} more` : ""}. One staff meeting mention usually
              moves it.
            </Nudge>
          )}
          {school.seats !== null && school.seatsUsed < school.seats && (
            <Nudge>
              You have <strong style={{ fontWeight: 600 }}>{school.seats - school.seatsUsed} unused seat
              {school.seats - school.seatsUsed === 1 ? "" : "s"}</strong>. Every teacher who joins raises
              every figure on this page.
            </Nudge>
          )}
          {noLessons.length > 0 && behind.length === 0 && (
            <Nudge>
              {noLessons.length} of the {cycles.length} Cycles have no lessons published yet. Those are
              coming from Just One Chesed.
            </Nudge>
          )}
        </ul>
      </div>
    </div>
  );
}

function Nudge({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: ORANGE_TEXT, flexShrink: 0, marginTop: "7px" }} />
      <span style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.78)" }}>{children}</span>
    </li>
  );
}
