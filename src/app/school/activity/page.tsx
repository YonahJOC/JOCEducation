import { mySchool, myActivity } from "@/lib/school-data";
import { CYCLES } from "@/lib/cycles";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RULE = "rgba(16,35,63,.14)";

export const metadata = { title: "Chesed activity — JOC Education" };

const GRADE_LABEL: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };

function ago(d: Date) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function SchoolActivityPage() {
  const [school, activity] = await Promise.all([mySchool(), myActivity()]);
  if (!school || !activity) {
    return <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)" }}>Could not load your school.</p>;
  }

  const byGrade = (["es", "ms", "hs"] as const).map((g) => ({
    grade: g,
    label: GRADE_LABEL[g],
    count: activity.recent.filter((r) => r.grade === g).length,
  }));
  const started = byGrade.filter((g) => g.count > 0);
  const notStarted = byGrade.filter((g) => g.count === 0);

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Chesed activity
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>
        What teachers at {school.name} are actually using.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "18px" }}>
        <Stat label="Teachers" value={String(school.seatsUsed)} sub="with a login" />
        <Stat label="Lessons saved" value={String(activity.savedTotal)} sub="across your team" />
        <Stat label="Board posts" value={String(activity.boardPosts)} sub="shared with other schools" />
      </div>

      {/* Grades */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
          By grade band
        </p>
        {activity.recent.length === 0 ? (
          <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.65)", margin: 0 }}>
            Nothing yet. Once teachers start saving lessons, you will see which grades are moving and
            which have not begun.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {byGrade.map((g) => {
                const max = Math.max(...byGrade.map((x) => x.count), 1);
                return (
                  <div key={g.grade}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "5px" }}>
                      <span style={{ color: INK }}>{g.label}</span>
                      <span style={{ color: "rgba(16,35,63,.55)" }}>{g.count}</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(g.count / max) * 100}%`, backgroundColor: g.count ? BLUE : "transparent", borderRadius: "9999px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {notStarted.length > 0 && started.length > 0 && (
              <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#C96C00", margin: "14px 0 0" }}>
                {notStarted.map((g) => g.label).join(" and ")} {notStarted.length === 1 ? "has" : "have"} not
                started yet.
              </p>
            )}
          </>
        )}
      </div>

      {/* Feed */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
          Recently
        </p>
        {activity.recent.length === 0 ? (
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>Nothing to show yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activity.recent.map((r, i) => {
              const cycle = CYCLES.find((c) => c.slug === r.cycleSlug);
              return (
                <div key={i} style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: cycle?.color ?? "rgba(16,35,63,.3)", flexShrink: 0, marginTop: "7px" }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "14px", color: INK, margin: 0, lineHeight: 1.45 }}>
                      <strong style={{ fontWeight: 600 }}>{r.who}</strong> saved {r.lesson}
                    </p>
                    <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", margin: "2px 0 0" }}>
                      {GRADE_LABEL[r.grade] ?? r.grade}
                      {cycle ? ` · ${cycle.theme}` : ""} · {ago(r.when)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "16px 18px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 8px" }}>
        {label}
      </p>
      <p style={{ fontWeight: 800, fontSize: "27px", letterSpacing: "-0.03em", color: INK, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", margin: "6px 0 0" }}>{sub}</p>
    </div>
  );
}
