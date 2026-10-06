import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { BandRow } from "@/components/ui/BandRow";
import {
  UPDATE_TYPES, INTERACTION_TYPES, TAG, day, shortDay, monthOf, clock, away,
} from "@/lib/school-update";
import { C, F, datum, label, rowCard, pageTitle, sectionHeading } from "@/lib/joc-tokens";

/**
 * Everything JOC has done with a school, as it comes in.
 *
 * Its own page rather than a column on the app board: Boots for Israel is not
 * an app client, and a board about the app would quietly become a board about
 * everything.
 *
 * Two halves, because the rows answer two different questions. What is still
 * ahead of us sits at the top in date order — those are the only rows anybody
 * can still act on. Everything behind us reads downwards, newest first, in
 * months, which is how somebody looks for "that visit, back in the spring".
 */

export const metadata = { title: "School updates — JOC Console" };
export const dynamic = "force-dynamic";

/**
 * Which types each filter covers.
 *
 * `all` is the shared list, so a record type added to the form cannot go
 * missing from this board — which is exactly what nearly happened to the
 * phone call and the email.
 */
const FILTERS = {
  all: UPDATE_TYPES,
  talk: INTERACTION_TYPES,
  events: ["VISIT"],
  booked: ["EVENT_PLANNED"],
} as const;
type Filter = keyof typeof FILTERS;

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; who?: string; type?: string; q?: string }>;
}) {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) redirect("/admin");

  const sp = await searchParams;
  const program = sp.program ?? "";
  const who = sp.who ?? "";
  const q = (sp.q ?? "").trim();
  const filter: Filter = sp.type && sp.type in FILTERS ? (sp.type as Filter) : "all";

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

  const rows = await prisma.schoolActivity.findMany({
    where: {
      type: { in: [...FILTERS[filter]] },
      // Taken off the Buzz by a super admin. Off this board too — it is the
      // same decision about the same row.
      removedAt: null,
      ...(program ? { programId: Number(program) || undefined } : {}),
      ...(who ? { authorId: who } : {}),
      ...(q
        ? {
            OR: [
              { school: { name: { contains: q, mode: "insensitive" as const } } },
              { summary: { contains: q, mode: "insensitive" as const } },
              { detail: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 300,
    select: {
      id: true, type: true, summary: true, detail: true, occurredAt: true,
      author: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, name: true } },
      school: {
        select: { id: true, name: true, _count: { select: { contacts: true } } },
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
      id: true,
      school: { select: { id: true, name: true, status: true } },
    },
  }).catch(() => []);

  const stillProspect = unchecked.filter((u) => u.school.status === "PROSPECT");
  const noContact = rows.filter((r) => r.school._count.contacts === 0);

  // Ahead of us, and behind us. The split is the page.
  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const ahead = rows
    .filter((r) => r.type === "EVENT_PLANNED" && r.occurredAt >= midnight)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const aheadIds = new Set(ahead.map((a) => a.id));
  const behind = rows.filter((r) => !aheadIds.has(r.id));

  // Who and what to offer as filters — drawn from everything, not from the
  // filtered rows, so choosing one never hides the way back to the others.
  const everyone = await prisma.schoolActivity.findMany({
    where: { type: { in: [...FILTERS.all] } },
    select: {
      author: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, name: true } },
    },
    take: 1000,
  }).catch(() => []);

  const people = [...new Map(
    everyone.filter((r) => r.author).map((r) => [r.author!.id, r.author!]),
  ).values()].sort((a, b) => (a.name ?? a.email ?? "").localeCompare(b.name ?? b.email ?? ""));

  const programs = [...new Map(
    everyone.filter((r) => r.program).map((r) => [r.program!.id, r.program!]),
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

  /** A link that keeps every other filter where it was. */
  const href = (change: Record<string, string>) => {
    const next = new URLSearchParams();
    const merged = { type: filter === "all" ? "" : filter, program, who, q, ...change };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/admin/interactions?${s}` : "/admin/interactions";
  };

  const filtered = filter !== "all" || Boolean(program) || Boolean(who) || Boolean(q);

  // Behind us, in months. One heading per month, newest first.
  const months: { key: string; label: string; rows: typeof behind }[] = [];
  for (const r of behind) {
    const key = `${r.occurredAt.getUTCFullYear()}-${r.occurredAt.getUTCMonth()}`;
    const last = months[months.length - 1];
    if (last?.key === key) last.rows.push(r);
    else months.push({ key, label: monthOf(r.occurredAt), rows: [r] });
  }

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>School updates</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {rows.length} {filtered ? "MATCHING" : "SENT IN"} · ANYONE AT JOC CAN ADD ONE AT /LOG
          </p>
        </div>
        <SectionLinks section="schools" />
      </div>

      {/* The things that need a person. */}
      {(stillProspect.length > 0 || noContact.length > 0) && (
        <div style={{ display: "grid", gap: "10px", marginBottom: "22px" }}>
          {stillProspect.length > 0 && (
            <BandRow
              tone="warn"
              label="Needs checking"
              figure={String(stillProspect.length)}
              title={`${stillProspect.length} school${stillProspect.length === 1 ? "" : "s"} added from a school update, not yet checked`}
              line={stillProspect.map((u) => u.school.name).slice(0, 5).join(", ")}
              action={{ label: "Open schools", href: "/admin/schools" }}
            />
          )}
          {noContact.length > 0 && (
            <BandRow
              tone="quiet"
              label="Nobody to ring"
              figure={String(new Set(noContact.map((r) => r.school.id)).size)}
              title="Schools here with no contact on record"
              line={[...new Set(noContact.map((r) => r.school.name))].slice(0, 5).join(", ")}
              action={{ label: "Open schools", href: "/admin/schools" }}
            />
          )}
        </div>
      )}

      {/* ── Finding one ───────────────────────────────────────────────── */}
      <form action="/admin/interactions" style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {filter !== "all" && <input type="hidden" name="type" value={filter} />}
        {program && <input type="hidden" name="program" value={program} />}
        {who && <input type="hidden" name="who" value={who} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="School, or anything written"
          style={{
            flex: "1 1 220px", minWidth: 0, boxSizing: "border-box",
            fontFamily: F.ui, fontSize: "16px", color: C.ink, backgroundColor: C.white,
            border: `1px solid ${C.hairline}`, borderRadius: "12px",
            padding: "11px 14px", minHeight: "46px",
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white,
            backgroundColor: C.ink, border: "none", borderRadius: "12px",
            padding: "0 18px", minHeight: "46px", cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
        <Chip href={href({ type: "" })} on={filter === "all"}>Everything</Chip>
        <Chip href={href({ type: "talk" })} on={filter === "talk"}>Interactions</Chip>
        <Chip href={href({ type: "events" })} on={filter === "events"}>Events</Chip>
        <Chip href={href({ type: "booked" })} on={filter === "booked"}>In the diary</Chip>
      </div>

      {(programs.length > 0 || people.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "22px" }}>
          {programs.map((p) => (
            <Chip
              key={`p${p.id}`}
              href={href({ program: program === String(p.id) ? "" : String(p.id) })}
              on={program === String(p.id)}
              quiet
            >
              {p.name}
            </Chip>
          ))}
          {people.map((u) => (
            <Chip
              key={u.id}
              href={href({ who: who === u.id ? "" : u.id })}
              on={who === u.id}
              quiet
            >
              {u.name ?? u.email}
            </Chip>
          ))}
          {filtered && (
            <Chip href="/admin/interactions" on={false} quiet>Clear</Chip>
          )}
        </div>
      )}

      {/* ── Still ahead ───────────────────────────────────────────────── */}
      {ahead.length > 0 && (
        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Coming up</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {ahead.map((r) => (
              <article key={r.id} style={{ ...rowCard, display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
                <div style={{
                  flex: "0 0 160px", boxSizing: "border-box", minWidth: 0,
                  padding: "14px 18px", backgroundColor: C.greenTint, color: C.greenText,
                  display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px",
                }}>
                  <span style={{ ...label, color: C.greenText }}>{away(r.occurredAt, midnight)}</span>
                  <span style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>
                    {shortDay(r.occurredAt)}
                    {clock(r.occurredAt, r.type) ? `, ${clock(r.occurredAt, r.type)}` : ""}
                  </span>
                </div>
                <div style={{ flex: "100 1 220px", minWidth: 0, padding: "14px 18px" }}>
                  <Link
                    href={`/admin/schools/${r.school.id}`}
                    style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, textDecoration: "none" }}
                  >
                    {r.school.name}
                  </Link>
                  <p style={{ ...datum, color: C.muted, margin: "4px 0 0" }}>
                    {r.program?.name ?? "No program recorded"}
                    {" · "}
                    {r.author?.name ?? r.author?.email ?? "somebody at JOC"}
                  </p>
                  {r.detail && (
                    <p style={{
                      fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
                      margin: "8px 0 0", maxWidth: "62ch", whiteSpace: "pre-wrap",
                    }}>
                      {r.detail}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Behind us ─────────────────────────────────────────────────── */}
      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>
        {ahead.length > 0 ? "Already happened" : "As it came in"}
      </h2>

      {behind.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: 0, maxWidth: "58ch" }}>
            {filtered
              ? "Nothing matches that."
              : <>Nothing yet. Anyone with a justonechesed.org address can write one at <strong style={{ color: C.ink }}>/log</strong> — no console, no permission to grant.</>}
          </p>
        </div>
      ) : (
        months.map((m) => (
          <section key={m.key} style={{ marginBottom: "22px" }}>
            <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>{m.label}</p>
            <div style={{ display: "grid", gap: "10px" }}>
              {m.rows.map((r) => (
                <article key={r.id} style={{ ...rowCard, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                    <Link
                      href={`/admin/schools/${r.school.id}`}
                      style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, textDecoration: "none" }}
                    >
                      {r.school.name}
                    </Link>
                    <span style={{ ...datum, color: C.muted }}>
                      {day(r.occurredAt).toUpperCase()}
                      {clock(r.occurredAt, r.type) ? ` · ${clock(r.occurredAt, r.type)}` : ""}
                    </span>
                  </div>

                  <p style={{ ...datum, color: C.muted, margin: "4px 0 8px" }}>
                    <span style={{ color: r.type === "EVENT_PLANNED" ? C.greenText : C.ink }}>
                      {TAG[r.type] ?? "UPDATE"}
                    </span>
                    {" · "}
                    {r.program?.name ?? "No program recorded"}
                    {" · "}
                    {r.author?.name ?? r.author?.email ?? "somebody at JOC"}
                  </p>

                  {r.detail && (
                    <p style={{
                      fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
                      margin: 0, maxWidth: "62ch", whiteSpace: "pre-wrap",
                    }}>
                      {r.detail}
                    </p>
                  )}

                  {r.school._count.contacts === 0 && (
                    <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "8px 0 0" }}>
                      Nobody is on file to ring at this school.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Chip({
  href, on, quiet, children,
}: {
  href: string;
  on: boolean;
  quiet?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: F.ui, fontSize: quiet ? "13px" : "14px", fontWeight: 600,
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
