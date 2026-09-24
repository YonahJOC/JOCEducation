import Link from "next/link";
import { label, R, C } from "@/lib/joc-tokens";
import { getCycleState } from "@/lib/cycles";
import { getCycles } from "@/lib/cycle-data";
import { PageIntro } from "@/components/admin/PageIntro";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { LessonsGuard } from "@/components/admin/Guard";

export const metadata = { title: "Cycle coverage — JOC Console" };

const BANDS = [
  { key: "es", label: "Elementary" },
  { key: "ms", label: "Middle" },
  { key: "hs", label: "High school" },
] as const;

/**
 * The planning map. Cycles down, grade bands across.
 *
 * A cell with lessons is a solid count; an empty cell is a dashed invitation
 * to write the first one. One glance shows which weeks of the year have
 * nothing behind them.
 */
async function Inner() {
  const connected = isDatabaseConfigured();

  let lessonCells = new Map<string, number>();
  let resourceCounts = new Map<string, number>();

  if (connected) {
    try {
      const [lessons, resources] = await Promise.all([
        prisma.lessonPlan.groupBy({
          by: ["cycleSlug", "grade"],
          where: { published: true },
          _count: { _all: true },
        }),
        prisma.resource.groupBy({
          by: ["cycleSlug"],
          where: { published: true },
          _count: { _all: true },
        }),
      ]);
      lessonCells = new Map(
        lessons.filter((l) => l.cycleSlug).map((l) => [`${l.cycleSlug}|${l.grade}`, l._count._all])
      );
      resourceCounts = new Map(
        resources.filter((r) => r.cycleSlug).map((r) => [r.cycleSlug!, r._count._all])
      );
    } catch {
      // Fall through to an empty grid rather than an error page.
    }
  }

  const totalLessons = [...lessonCells.values()].reduce((a, b) => a + b, 0);
  const CYCLES = await getCycles();
  const emptyCells = CYCLES.length * BANDS.length - lessonCells.size;

  return (
    <div>
      <PageIntro
        title="Cycle coverage"
        what={
          `${totalLessons} published ${totalLessons === 1 ? "lesson" : "lessons"} across ` +
          `${CYCLES.length} Cycles. ` +
          (emptyCells > 0
            ? `${emptyCells} of ${CYCLES.length * BANDS.length} slots have nothing in them yet.`
            : "Every slot has something in it.")
        }
        steps={[
          "The Cycles run down the side; the grade bands run across.",
          "A number means published lessons. A dashed cell means a teacher in that grade has nothing for those weeks.",
          "Click a dashed cell to start writing the lesson that fills it.",
        ]}
        note="This counts published lessons only. A draft you are still writing will not show here."
      />

      <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", minWidth: "660px" }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", minWidth: "220px" }}>Cycle</th>
                {BANDS.map((b) => (
                  <th key={b.key} style={{ ...th, textAlign: "center" }}>{b.label}</th>
                ))}
                <th style={{ ...th, textAlign: "center" }}>Resources</th>
              </tr>
            </thead>
            <tbody>
              {CYCLES.map((c) => {
                const state = getCycleState(c);
                const res = resourceCounts.get(c.slug) ?? 0;
                return (
                  <tr key={c.slug}>
                    <td style={{ ...td, borderLeft: `3px solid ${c.color}` }}>
                      <span style={{ fontWeight: 600, color: C.ink }}>
                        {c.num}. {c.theme}
                      </span>
                      {state === "current" && (
                        <span style={{ ...label, color: "#fff", backgroundColor: c.color, borderRadius: R.chip, padding: "2px 8px", marginLeft: "8px" }}>
                          Now
                        </span>
                      )}
                      <span style={{ display: "block", fontSize: "12px", color: "#4A5A74", marginTop: "2px" }}>
                        {c.hebrew} · {c.range}
                      </span>
                    </td>

                    {BANDS.map((b) => {
                      const n = lessonCells.get(`${c.slug}|${b.key}`) ?? 0;
                      return (
                        <td key={b.key} style={{ ...td, textAlign: "center" }}>
                          {n > 0 ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              minWidth: "34px", height: "30px", borderRadius: "9px",
                              backgroundColor: C.blue, color: "#fff", fontWeight: 700, fontSize: "15px",
                            }}>
                              {n}
                            </span>
                          ) : (
                            <Link
                              href="/admin/lessons"
                              title={`Write the first ${b.label} lesson for ${c.theme}`}
                              style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                minWidth: "34px", height: "30px", borderRadius: "9px",
                                border: `1px dashed ${C.orange}`, color: C.orangeText,
                                fontSize: "16px", lineHeight: 1, textDecoration: "none",
                              }}
                            >
                              +
                            </Link>
                          )}
                        </td>
                      );
                    })}

                    <td style={{ ...td, textAlign: "center", color: res > 0 ? "#4A5A74" : C.orangeText }}>
                      {res > 0 ? res : "Nothing yet"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: "13px", color: "#4A5A74", margin: "14px 0 0", lineHeight: 1.6, maxWidth: "62ch" }}>
        A dashed square is a Cycle and grade band with nothing written for it. Those weeks will arrive
        whether or not there is material for them, so this is the list to work down.
      </p>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "11px 16px", ...label, color: "#4A5A74", borderBottom: `1px solid ${C.hairline}`,
  backgroundColor: C.panel, whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "12px 16px", borderBottom: `1px solid ${C.hairline}`, verticalAlign: "middle",
};

export default async function CoveragePage() {
  return <LessonsGuard>{await Inner()}</LessonsGuard>;
}
