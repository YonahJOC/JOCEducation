import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { BandRow } from "@/components/ui/BandRow";
import { C, F, datum, rowCard, pageTitle, sectionHeading } from "@/lib/joc-tokens";

/**
 * Everything JOC has done at a school, as it comes in.
 *
 * Its own page rather than a column on the app board: Boots for Israel is not
 * an app client, and a board about the app would quietly become a board about
 * everything.
 *
 * Two things rise to the top, because they are the only two that need a
 * person: a school somebody added that nobody has checked, and a visit to a
 * school with nobody to ring.
 */

export const metadata = { title: "School updates — JOC Console" };
export const dynamic = "force-dynamic";

/** What each record is called on a row. */
const TAG: Record<string, string> = {
  MEETING: "MEETING",
  CALL: "PHONE CALL",
  EMAIL: "EMAIL",
  VISIT: "EVENT",
  EVENT_PLANNED: "BOOKED",
};

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * The time of a booked event, which is the only row where somebody typed one.
 *
 * Every other row carries whatever the clock said when it was written, and
 * showing that is showing a number nobody chose — a call logged at 5:35pm
 * reads as a call held at 5:35pm. Booked events are stored with their
 * wall-clock time pinned to UTC (see actions/school-update.ts) and read back
 * the same way; midnight means no time was given.
 */
const clock = (d: Date, type: string) =>
  type !== "EVENT_PLANNED" || (d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
    ? null
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; who?: string }>;
}) {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) redirect("/admin");

  const { program, who } = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={pageTitle}>School updates</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to show.
        </p>
      </div>
    );
  }

  const visits = await prisma.schoolActivity.findMany({
    where: {
      // Everything the School Update Form writes. A call, an email and a
      // booked event are not visits, and leaving them out of this query is
      // how they would have landed on nobody's screen.
      type: { in: ["VISIT", "MEETING", "CALL", "EMAIL", "EVENT_PLANNED"] },
      ...(program ? { programId: Number(program) || undefined } : {}),
      ...(who ? { authorId: who } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
    select: {
      id: true, type: true, summary: true, detail: true, occurredAt: true,
      author: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, name: true } },
      school: {
        select: {
          id: true, name: true, status: true,
          _count: { select: { contacts: true } },
        },
      },
    },
  }).catch(() => []);

  // Schools somebody added from the form and nobody has checked.
  const unchecked = await prisma.schoolActivity.findMany({
    where: {
      type: "NOTE",
      // The form used to call itself a visit log. Rows written then still say so.
      OR: [
        { summary: { contains: "Added from a school update" } },
        { summary: { contains: "Added from a visit log" } },
      ],
    },
    orderBy: { occurredAt: "desc" },
    select: {
      id: true, occurredAt: true,
      school: { select: { id: true, name: true, status: true, _count: { select: { contacts: true } } } },
    },
  }).catch(() => []);

  const stillProspect = unchecked.filter((u) => u.school.status === "PROSPECT");
  const noContact = visits.filter((v) => v.school._count.contacts === 0);

  // An event in the diary is the one row here that is about the future, so it
  // is the one row that can still be acted on.
  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const upcoming = visits
    .filter((v) => v.type === "EVENT_PLANNED" && v.occurredAt >= midnight)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const people = [...new Map(
    visits.filter((v) => v.author).map((v) => [v.author!.id, v.author!]),
  ).values()];
  const programs = [...new Map(
    visits.filter((v) => v.program).map((v) => [v.program!.id, v.program!]),
  ).values()];

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>School updates</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {visits.length} SENT IN · ANYONE AT JOC CAN ADD ONE AT /LOG
          </p>
        </div>
        <SectionLinks section="schools" />
      </div>

      {/* The only two things here that need somebody. */}
      {(upcoming.length > 0 || stillProspect.length > 0 || noContact.length > 0) && (
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          {upcoming.length > 0 && (
            <BandRow
              tone="good"
              label="In the diary"
              figure={String(upcoming.length)}
              title={`${upcoming.length} event${upcoming.length === 1 ? "" : "s"} booked and not run yet`}
              line={`Next: ${upcoming[0].school.name}, ${day(upcoming[0].occurredAt)}${
                clock(upcoming[0].occurredAt, upcoming[0].type) ? ` at ${clock(upcoming[0].occurredAt, upcoming[0].type)}` : ""
              }`}
              action={{ label: "Open schools", href: "/admin/schools" }}
            />
          )}
          {stillProspect.length > 0 && (
            <BandRow
              tone="warn"
              label="Needs checking"
              figure={String(stillProspect.length)}
              title={`${stillProspect.length} school${stillProspect.length === 1 ? "" : "s"} added from a visit, not yet checked`}
              line={stillProspect.map((u) => u.school.name).slice(0, 5).join(", ")}
              action={{ label: "Open schools", href: "/admin/schools" }}
            />
          )}
          {noContact.length > 0 && (
            <BandRow
              tone="quiet"
              label="Nobody to ring"
              figure={String(new Set(noContact.map((v) => v.school.id)).size)}
              title="Visited, with no contact on record"
              line={[...new Set(noContact.map((v) => v.school.name))].slice(0, 5).join(", ")}
              action={{ label: "Open schools", href: "/admin/schools" }}
            />
          )}
        </div>
      )}

      {(programs.length > 1 || people.length > 1) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
          <Chip href="/admin/interactions" on={!program && !who}>Everything</Chip>
          {programs.map((p) => (
            <Chip key={p.id} href={`/admin/interactions?program=${p.id}`} on={program === String(p.id)}>
              {p.name}
            </Chip>
          ))}
          {people.map((u) => (
            <Chip key={u.id} href={`/admin/interactions?who=${u.id}`} on={who === u.id}>
              {u.name ?? u.email}
            </Chip>
          ))}
        </div>
      )}

      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>As it came in</h2>

      {visits.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: 0, maxWidth: "58ch" }}>
            Nothing logged yet. Anyone with a justonechesed.org address can write one at{" "}
            <strong style={{ color: C.ink }}>/log</strong> — no console, no permission to grant.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {visits.map((v) => (
            <article key={v.id} style={{ ...rowCard, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                <Link
                  href={`/admin/schools/${v.school.id}`}
                  style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, textDecoration: "none" }}
                >
                  {v.school.name}
                </Link>
                <span style={{ ...datum, color: C.muted }}>
                  {day(v.occurredAt).toUpperCase()}
                  {clock(v.occurredAt, v.type) ? ` · ${clock(v.occurredAt, v.type)}` : ""}
                </span>
              </div>

              <p style={{ ...datum, color: C.muted, margin: "4px 0 8px" }}>
                <span style={{ color: v.type === "EVENT_PLANNED" ? C.greenText : C.ink }}>
                  {TAG[v.type] ?? "UPDATE"}
                </span>
                {" · "}
                {v.program?.name ?? "No program recorded"}
                {" · "}
                {v.author?.name ?? v.author?.email ?? "somebody at JOC"}
              </p>

              {v.detail && (
                <p style={{
                  fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
                  margin: 0, maxWidth: "62ch", whiteSpace: "pre-wrap",
                }}>
                  {v.detail}
                </p>
              )}

              {v.school._count.contacts === 0 && (
                <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "8px 0 0" }}>
                  Nobody is on file to ring at this school.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: F.ui, fontSize: "13px", fontWeight: 600,
        color: on ? C.white : C.ink,
        backgroundColor: on ? C.ink : C.white,
        border: on ? "none" : `1px solid ${C.hairline}`,
        borderRadius: "999px", padding: "8px 14px", minHeight: "36px",
        display: "inline-flex", alignItems: "center", textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
