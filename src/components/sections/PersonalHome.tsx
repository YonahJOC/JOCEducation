import Link from "next/link";
import { C, R, F, label, rowCard, rowInner, rowBand, rowBody, rowAction, rowTitle, secondaryButton } from "@/lib/joc-tokens";
import { getCurrentWeek, getCycleState, type Cycle } from "@/lib/cycles";
import { getCycles, getRunningCycle } from "@/lib/cycle-data";
import { getPublishedLessons } from "@/lib/content";

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

const GRADE_LABEL: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };

/**
 * The personal landing for anyone signed in — the running Cycle and its
 * guiding question, what has appeared since they were last here, and their
 * saved lessons. Plus a read-only view of their school that names the person
 * to ask for anything they cannot do themselves.
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
  // lesson, so it goes above everything except the cycle it belongs to.
  const thisWeek = lessons.filter((l) => l.cycleSlug === cycle.slug);
  const forNow = thisWeek.find((l) => l.cycleWeek === week) ?? thisWeek[0] ?? null;
  const greeting = data.firstName ? `Welcome back, ${data.firstName}.` : "Welcome back.";

  return (
    <div style={{ maxWidth: WIDTH, margin: "0 auto", padding: "34px 26px 60px" }}>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 36px)", letterSpacing: "-0.035em", color: C.ink, margin: "0 0 6px" }}>
        {greeting}
      </h1>
      <p style={{ fontSize: "15px", color: "#4A5A74", margin: "0 0 26px" }}>
        {data.isStaff
          ? "You have full access to everything on the site."
          : data.schoolName
          ? `Signed in through ${data.schoolName}.`
          : "Signed in."}
      </p>

      {/* The running Cycle */}
      <section
        style={{
          backgroundColor: C.blue, borderRadius: R.hero, padding: "30px",
          color: C.white, marginBottom: "16px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "28px", alignItems: "start" }}>
          <div>
            <p style={{ ...label, color: "#FFD8AE", margin: "0 0 12px" }}>
              Cycle {String(cycle.num).padStart(2, "0")} · Week {week} of {cycle.weeks} · {cycle.hebrew}
            </p>
            <h2 style={{ fontFamily: F.ui, fontWeight: 800, fontSize: "clamp(26px, 3.4vw, 36px)", lineHeight: 1.06, letterSpacing: "-0.035em", margin: "0 0 6px" }}>
              {cycle.theme}
            </h2>
            <p style={{ fontFamily: F.read, fontSize: "17px", color: "#C6CFF0", margin: "0 0 20px" }}>{cycle.gloss}</p>
            <p
              style={{
                fontFamily: F.read, fontStyle: "italic",
                fontSize: "clamp(18px, 2.1vw, 23px)", lineHeight: 1.5,
                color: C.white, borderLeft: `3px solid ${C.orange}`,
                paddingLeft: "18px", margin: 0, maxWidth: "34ch",
              }}
            >
              {cycle.question}
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ ...label, color: "#C6CFF0" }}>{cycle.range}</span>
            </div>
            <div style={{ height: "6px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,.16)", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: "9999px", backgroundColor: C.orange }} />
            </div>
            <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: "#C6CFF0", margin: "0 0 18px" }}>
              Everything published for these weeks points at this one middah.
            </p>
            <Link
              href={`/cycles/${cycle.slug}`}
              style={{
                display: "inline-block", backgroundColor: C.orange, color: C.ink, fontWeight: 700,
                fontSize: "14.5px", borderRadius: "9999px", padding: "12px 22px", textDecoration: "none",
              }}
            >
              See this Cycle&rsquo;s plan
            </Link>
          </div>
        </div>
      </section>

      {/* The reason a teacher opened this page. */}
      <div style={{ ...rowCard, marginBottom: "16px" }}>
        <div style={rowInner}>
          <div style={{ ...rowBand, backgroundColor: forNow ? C.blueTint : C.panel }}>
            <span style={{ ...label, color: forNow ? C.blue : C.orangeText }}>
              {forNow ? "This week" : "Nothing yet"}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, color: forNow ? C.blue : C.orangeText }}>
              {forNow ? `Week ${week}` : "None"}
            </span>
          </div>

          <div style={rowBody}>
            {forNow ? (
              <>
                <p style={rowTitle}>{forNow.title}</p>
                <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.55, margin: 0 }}>
                  {forNow.description}
                </p>
              </>
            ) : (
              <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.55, margin: 0 }}>
                No lesson is published for {cycle.theme} yet. When one is, it appears here.
              </p>
            )}
          </div>

          <div style={rowAction}>
            <Link
              href={forNow ? `/lesson-plans/${forNow.id}` : "/lesson-plans"}
              style={{ ...secondaryButton, textDecoration: "none" }}
            >
              {forNow ? "Open the lesson" : "Browse lessons"}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {/* New since last visit */}
        <section style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "20px", padding: "22px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 14px" }}>
            New since you were last here
          </p>
          {data.newSinceLastVisit.length === 0 ? (
            <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>
              Nothing new yet. When Just One Chesed publishes a lesson or resource, it will appear here.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.newSinceLastVisit.map((n, i) => (
                <div key={i} style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: C.orange, flexShrink: 0, marginTop: "7px" }} />
                  <div>
                    <p style={{ fontSize: "14.5px", color: C.ink, margin: 0, lineHeight: 1.45 }}>{n.title}</p>
                    <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "2px 0 0" }}>{n.kind}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved lessons */}
        <section style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "20px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
            <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: 0 }}>
              Your saved lessons
            </p>
            <Link href="/lesson-plans" style={{ fontSize: "13px", color: C.blue, textDecoration: "none", fontWeight: 600 }}>
              Browse all →
            </Link>
          </div>
          {data.savedLessons.length === 0 ? (
            <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>
              Nothing saved yet. Star a lesson while you are reading it and it will wait for you here.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
              {data.savedLessons.map((l) => {
                const c = allCycles.find((x) => x.slug === l.cycleSlug);
                return (
                  <Link key={l.id} href={`/lesson-plans/${l.id}`} style={{ textDecoration: "none" }}>
                    <p style={{ fontSize: "14.5px", fontWeight: 600, color: C.ink, margin: 0 }}>{l.title}</p>
                    <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "2px 0 0" }}>
                      {GRADE_LABEL[l.grade] ?? l.grade}{c ? ` · ${c.theme}` : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* My school — read only */}
      {data.schoolName && (
        <section style={{ backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "22px", marginTop: "16px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 10px" }}>
            Your school
          </p>
          <p style={{ fontWeight: 700, fontSize: "19px", color: C.ink, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {data.schoolName}
          </p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>
            {data.schoolAdmins.length > 0 ? (
              <>
                For anything to do with your school&rsquo;s account — adding a colleague, seats, or your
                plan — speak to{" "}
                <strong style={{ color: C.ink }}>
                  {data.schoolAdmins.map((a) => a.name ?? a.email).join(" or ")}
                </strong>
                .
              </>
            ) : (
              <>
                Nobody at your school administers the JOC account yet. Email{" "}
                <a href="mailto:education@justonechesed.org" style={{ color: C.blue, fontWeight: 600 }}>
                  education@justonechesed.org
                </a>{" "}
                and Just One Chesed will set that up.
              </>
            )}
          </p>
        </section>
      )}

      {/* Where to go */}
      <section style={{ marginTop: "26px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: C.orangeText, margin: "0 0 14px" }}>
          Where to go
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          {[
            { href: "/cycles", title: "The Chesed Cycles", body: `All ${allCycles.length} across the year` },
            { href: "/lesson-plans", title: "Lesson plans", body: "Ready to print and teach" },
            { href: "/resources", title: "Resource library", body: "Source sheets and activities" },
            { href: "/board", title: "Teachers' Board", body: "What other schools ran" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px",
                padding: "18px", textDecoration: "none", display: "block",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "15px", color: C.ink, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                {l.title}
              </p>
              <p style={{ fontSize: "13px", color: "#4A5A74", margin: 0 }}>{l.body}</p>
            </Link>
          ))}
        </div>
      </section>
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
