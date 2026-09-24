import Link from "next/link";
import {
  C, R, F, label, datum, rowCard, chip, plainChip, note, noteText, primaryButton,
} from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";
import { getCurrentWeek, getCycleState, type Cycle } from "@/lib/cycles";
import { getCycles, getRunningCycle } from "@/lib/cycle-data";
import { getPublishedLessons } from "@/lib/content";
import { GRADE_LABELS } from "@/lib/lessons";

const WIDTH = "1180px";

export type HomeData = {
  firstName: string | null;
  isStaff: boolean;
  role: string;
  schoolName: string | null;
  schoolAdmins: { name: string | null; email: string }[];
  savedLessons: { id: number; title: string; grade: string; cycleSlug: string | null }[];
  newSinceLastVisit: { title: string; kind: string; when: Date }[];
};

/**
 * The teacher's home (3g).
 *
 * Three things: the Cycle that is running, the one lesson published for this
 * week, and chips for what is saved and what is new. It had grown a panel for
 * "new since last visit", a panel for saved lessons, a panel for the school
 * and a grid of four links to pages the site header already lists — five
 * sections between a teacher and the lesson they came for.
 */
export async function PersonalHome({ data }: { data: HomeData }) {
  const [cycle, allCycles, lessons] = await Promise.all([
    getRunningCycle(),
    getCycles(),
    getPublishedLessons(),
  ]);
  const week = getCurrentWeek(cycle);
  const pct = Math.round((week / cycle.weeks) * 100);

  // What is published for these weeks. A teacher opens this page to find the
  // lesson, so it goes directly under the Cycle it belongs to.
  const thisWeek = lessons.filter((l) => l.cycleSlug === cycle.slug);
  const forNow = thisWeek.find((l) => l.cycleWeek === week) ?? thisWeek[0] ?? null;

  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greeting = [
    data.firstName ? `${part}, ${data.firstName}` : part,
    data.isStaff ? "JOC" : data.schoolName,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{ maxWidth: WIDTH, margin: "0 auto", padding: "32px 24px 60px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 14px" }}>{greeting}</p>

      {/* The Cycle that is running. */}
      <section style={{ backgroundColor: C.blue, borderRadius: R.hero, padding: "30px", color: C.white, marginBottom: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "28px", alignItems: "start" }}>
          <div>
            <p style={{ ...label, color: "#FFD8AE", margin: "0 0 12px" }}>
              Chesed Cycle {cycle.num} · Week {week} of {cycle.weeks} · {cycle.hebrew}
            </p>
            <h1 style={{
              fontFamily: F.ui, fontWeight: 700, fontSize: "clamp(28px, 3.4vw, 40px)",
              lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 6px",
            }}>
              {cycle.theme}
            </h1>
            <p style={{ fontFamily: F.read, fontSize: "16px", color: "#C6CFF0", margin: "0 0 20px" }}>{cycle.gloss}</p>
            <p style={{
              fontFamily: F.read, fontStyle: "italic",
              fontSize: "clamp(18px, 2.1vw, 23px)", lineHeight: 1.5,
              color: C.white, borderLeft: `3px solid ${C.orange}`,
              paddingLeft: "18px", margin: 0, maxWidth: "34ch",
            }}>
              {cycle.question}
            </p>
          </div>

          <div>
            <p style={{ ...datum, color: "#C6CFF0", margin: "0 0 8px" }}>{cycle.range}</p>
            <div style={{ height: "6px", borderRadius: R.chip, backgroundColor: "rgba(255,255,255,.16)", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: R.chip, backgroundColor: C.orange }} />
            </div>
            <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: "#C6CFF0", margin: "0 0 18px" }}>
              Everything published for these weeks points at this one middah.
            </p>
            {/* White on the blue: orange fill belongs to the public call to
                action and nowhere else. */}
            <Link
              href={`/cycles/${cycle.slug}`}
              style={{
                ...primaryButton, backgroundColor: C.white, color: C.blue,
                border: `2px solid ${C.white}`, textDecoration: "none",
              }}
            >
              See this Cycle&rsquo;s plan
            </Link>
          </div>
        </div>
      </section>

      {/* The reason a teacher opened this page. */}
      <BandRow
        tone={forNow ? "info" : "warn"}
        label={forNow ? `For ${GRADE_LABELS[forNow.grade] ?? forNow.grade}` : "This week"}
        figure={forNow ? `${forNow.time} min` : "None yet"}
        word={!forNow}
        title={forNow ? forNow.title : `No lesson for ${cycle.theme} yet`}
        line={
          forNow
            ? forNow.description
            : "When one is published for these weeks it appears here, with its printables."
        }
        action={{
          label: forNow ? "Open the lesson" : "Browse the library",
          href: forNow ? `/lesson-plans/${forNow.id}` : "/lesson-plans",
        }}
      />

      {/* What is waiting, as chips rather than as two half-empty panels. */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "16px 0 0" }}>
        <Link href="/lesson-plans?saved=1" style={{ ...plainChip, textDecoration: "none", minHeight: "44px", padding: "0 15px" }}>
          Saved · {data.savedLessons.length === 0 ? "none yet" : `${data.savedLessons.length} lesson${data.savedLessons.length === 1 ? "" : "s"}`}
        </Link>
        <Link
          href="/lesson-plans"
          style={{
            ...chip, textDecoration: "none", minHeight: "44px", padding: "0 15px",
            backgroundColor: data.newSinceLastVisit.length > 0 ? C.orangeTint : C.panel,
            color: data.newSinceLastVisit.length > 0 ? C.orangeText : C.muted,
          }}
        >
          New since you were here · {data.newSinceLastVisit.length === 0 ? "nothing" : data.newSinceLastVisit.length}
        </Link>
        <Link href="/cycles" style={{ ...plainChip, textDecoration: "none", minHeight: "44px", padding: "0 15px" }}>
          All {allCycles.length} Chesed Cycles
        </Link>
      </div>

      {/* Who to ask. Not in 3g, but it is the answer to the question a teacher
          asks most, and it is one line rather than a panel. */}
      {data.schoolName && (
        <p style={{ ...note("info"), ...noteText("info"), marginTop: "20px" }}>
          {data.schoolAdmins.length > 0 ? (
            <>
              For anything to do with {data.schoolName}&rsquo;s account — a colleague, seats or your
              plan — speak to{" "}
              <strong style={{ color: C.ink }}>
                {data.schoolAdmins.map((a) => a.name ?? a.email).join(" or ")}
              </strong>.
            </>
          ) : (
            <>
              Nobody at {data.schoolName} administers the JOC account yet. Email{" "}
              <a href="mailto:education@justonechesed.org" style={{ color: C.blue, fontWeight: 600 }}>
                education@justonechesed.org
              </a>{" "}
              and Just One Chesed will set that up.
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** Cycles that started since a given date — used for "new since last visit". */
export async function cyclesStartedSince(since: Date | null): Promise<Cycle[]> {
  if (!since) return [];
  const all = await getCycles();
  return all.filter(
    (c) => getCycleState(c) !== "upcoming" && new Date(c.startDate) > since
  );
}
