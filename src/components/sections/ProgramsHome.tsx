import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { stepFor, STEPS, STEP_NEXT } from "@/lib/program-step";
import { STAGE_LABEL, type Stage } from "@/lib/program-enrollment";
import { heroFg } from "@/lib/hero-color";
import type { SchoolAccess } from "@/lib/school-access";
import { C, R, F, label, datum, rowCard, primaryButton, textButton } from "@/lib/joc-tokens";

/**
 * Home, for a school that runs programs and has not been given the site (4a).
 *
 * Every school today is one of these. They are not subscribers and they are
 * not prospects — they run something with JOC already, and this is the front
 * door to it. The work itself happens in the program's own portal, so the
 * biggest thing here is the way through to it.
 *
 * What is deliberately not on this page: the Chesed Cycle card, this week's
 * lesson, saved lessons. None of it is theirs yet, and showing it greyed out
 * would be a locked door where there should be a conversation.
 */

const day = (d: Date) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

export async function ProgramsHome({
  access, schoolId, schoolName, firstName,
}: {
  access: SchoolAccess;
  schoolId: string | null;
  schoolName: string | null;
  firstName: string | null;
}) {
  // What each program's portal is, and when it next runs. One query, not one
  // per card.
  const [portals, runs] = isDatabaseConfigured() && schoolId
    ? await Promise.all([
        prisma.programPage.findMany({
          where: { id: { in: access.programs.map((p) => p.id) } },
          select: { id: true, portalHref: true },
        }),
        prisma.programEvent.findMany({
          where: {
            schoolId,
            programId: { in: access.programs.map((p) => p.id) },
            status: { not: "CANCELLED" },
            startsAt: { gte: new Date() },
          },
          orderBy: { startsAt: "asc" },
          select: { programId: true, startsAt: true },
        }),
      ])
    : [[], []];

  const portalOf = new Map(portals.map((p) => [p.id, p.portalHref]));
  const nextOf = new Map<number, Date>();
  for (const r of runs) {
    if (r.programId != null && !nextOf.has(r.programId)) nextOf.set(r.programId, r.startsAt);
  }

  const [first, ...rest] = access.programs;
  const greeting = firstName ? `Good to see you, ${firstName}` : "Your programs";

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "32px 24px 64px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 16px" }}>
        {greeting}
        {schoolName ? ` · ${schoolName}` : ""}
      </p>

      {first && (
        <Hero
          program={first}
          schoolName={schoolName}
          portalHref={portalOf.get(first.id) ?? null}
          nextRun={nextOf.get(first.id) ?? null}
        />
      )}

      {/* Three or more, and the rest are rows rather than heroes — a page of
          heroes has no first thing on it. */}
      {rest.length > 0 && (
        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
          {rest.map((p) =>
            rest.length === 1 ? (
              <Hero
                key={p.id}
                program={p}
                schoolName={schoolName}
                portalHref={portalOf.get(p.id) ?? null}
                nextRun={nextOf.get(p.id) ?? null}
              />
            ) : (
              <CompactRow
                key={p.id}
                program={p}
                portalHref={portalOf.get(p.id) ?? null}
                nextRun={nextOf.get(p.id) ?? null}
              />
            ),
          )}
        </div>
      )}

      {first && <Path program={first} />}

      <AlsoFromJOC count={access.programs.length} />
    </div>
  );
}

type P = SchoolAccess["programs"][number];

function line(p: P, nextRun: Date | null): string {
  const stage = STAGE_LABEL[p.stage].toLowerCase();
  if (nextRun) return `${stage} — next on ${day(nextRun)}.`;
  return `${stage}. Nothing is on the calendar yet.`;
}

function Hero({
  program, schoolName, portalHref, nextRun,
}: {
  program: P; schoolName: string | null; portalHref: string | null; nextRun: Date | null;
}) {
  const fg = heroFg(program.heroColor);

  return (
    <section style={{ backgroundColor: program.heroColor, borderRadius: R.hero, padding: "clamp(26px, 4vw, 38px)", color: fg }}>
      <p style={{ ...label, color: fg, opacity: 0.85, margin: "0 0 10px" }}>
        Your program{schoolName ? ` · ${schoolName}` : ""}
      </p>

      <h1 style={{
        fontFamily: F.ui, fontSize: "clamp(30px, 4.4vw, 44px)", fontWeight: 800,
        letterSpacing: "-0.035em", lineHeight: 1.03, margin: "0 0 10px",
      }}>
        {program.name}
      </h1>

      <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.55, margin: "0 0 22px", opacity: 0.92 }}>
        {line(program, nextRun)}
      </p>

      {portalHref ? (
        <a
          href={portalHref}
          target="_blank"
          rel="noreferrer"
          style={{ ...primaryButton, backgroundColor: C.white, color: C.ink, border: "none", textDecoration: "none" }}
        >
          Open the {program.name} portal ↗
        </a>
      ) : (
        <p style={{ ...datum, color: fg, opacity: 0.9, margin: 0 }}>
          The {program.name} portal link isn&rsquo;t set yet.
        </p>
      )}
    </section>
  );
}

function CompactRow({
  program, portalHref, nextRun,
}: {
  program: P; portalHref: string | null; nextRun: Date | null;
}) {
  return (
    <div style={{ ...rowCard, display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", padding: "16px 18px" }}>
      <span aria-hidden="true" style={{ width: "6px", alignSelf: "stretch", minHeight: "40px", borderRadius: "3px", backgroundColor: program.heroColor }} />

      <span style={{ flex: 1, minWidth: "180px" }}>
        <span style={{ display: "block", fontFamily: F.ui, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink }}>
          {program.name}
        </span>
        <span style={{ display: "block", fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.45 }}>
          {line(program, nextRun)}
        </span>
      </span>

      {portalHref ? (
        <a href={portalHref} target="_blank" rel="noreferrer" style={{ ...primaryButton, textDecoration: "none" }}>
          Open the portal ↗
        </a>
      ) : (
        <span style={{ ...datum, color: C.orangeText }}>Portal link not set</span>
      )}
    </div>
  );
}

/** Where it has got to: the same four steps the public program page shows. */
function Path({ program }: { program: P }) {
  const now = stepFor(program.stage);

  return (
    <section style={{ marginTop: "26px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 12px" }}>Where it has got to</p>

      <div className="joc-path">
        {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => {
          const done = n < now;
          const here = n === now;
          return (
            <div key={n} style={{ minWidth: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  display: "block", height: "6px", borderRadius: "3px", marginBottom: "8px",
                  backgroundColor: done ? C.green : here ? program.heroColor : C.hairline,
                }}
              />
              <span style={{ ...datum, color: done ? C.greenText : here ? C.ink : C.muted }}>
                {String(n).padStart(2, "0")}
              </span>
              <span style={{
                display: "block", fontFamily: F.ui, fontSize: "14px",
                fontWeight: here ? 700 : 500, color: here ? C.ink : C.muted, lineHeight: 1.35,
              }}>
                {here ? STAGE_LABEL[program.stage] : done ? "Done" : STEP_NEXT[n] ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * The rest of what JOC does, quietly.
 *
 * Three panels, no prices, each ending at the page that explains it and asks
 * whether they want it.
 */
function AlsoFromJOC({ count }: { count: number }) {
  const cards = [
    { kind: "lessons", title: "Chesed Cycle lessons", body: "Ready-to-teach plans for every grade, tied to the Cycle the whole school is on." },
    { kind: "joc-app", title: "The JOC App", body: "Students log what they do, and their teachers approve it." },
    { kind: "programs", title: count > 1 ? `The other JOC programs` : "The other JOC programs", body: "Kindness Booth, Bake for Chesed, Just One Tutor and the rest." },
  ];

  return (
    <section style={{ marginTop: "34px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 12px" }}>Also from JOC</p>

      <div className="joc-also">
        {cards.map((c) => (
          <div key={c.kind} style={{ backgroundColor: C.panel, borderRadius: R.row, padding: "20px" }}>
            <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>
              {c.title}
            </p>
            <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted, margin: "0 0 14px" }}>
              {c.body}
            </p>
            <Link href={`/not-yet/${c.kind}`} style={{ ...textButton, display: "inline-flex", alignItems: "center" }}>
              Tell me more
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
