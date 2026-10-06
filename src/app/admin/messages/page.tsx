import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { Inbox, type InboxRow } from "@/components/admin/Inbox";
import { C, F, label, pageTitle } from "@/lib/joc-tokens";

/**
 * What the schools have written.
 *
 * A coordinator sees the conversations they read: their own programs, plus
 * any program with no coordinator where they hold the school's account. The
 * `messages` capability widens that to every school, which is what a super
 * admin wants and a coordinator does not.
 *
 * The first thing on the page is how many schools are waiting, because that
 * is the only question somebody opens this to answer.
 */

export const metadata = { title: "Messages — JOC Console" };
export const dynamic = "force-dynamic";

const GENERAL_DOT = "#4A5A74";

export default async function AdminMessagesPage() {
  const session = await safeAuth();
  const me = session?.user;

  const seesAll = openForReview || can(me, "messages") || can(me, "schools");
  if (!seesAll && !can(me, "app_activity") && !me?.id) redirect("/admin");

  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={pageTitle}>Messages</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to read.
        </p>
      </div>
    );
  }

  const [messages, schools, programs] = await Promise.all([
    prisma.schoolMessage.findMany({
      orderBy: { sentAt: "asc" },
      take: 2000,
      select: {
        id: true, body: true, topic: true, inbound: true, sentAt: true, seenAt: true,
        schoolId: true, programId: true,
        author: { select: { name: true, email: true } },
      },
    }).catch(() => []),
    prisma.school.findMany({
      select: {
        id: true, name: true,
        accountManagerId: true,
        accountManager: { select: { name: true, email: true } },
        members: { where: { role: "SCHOOL_ADMIN" }, select: { name: true, email: true } },
        enrollments: { select: { programId: true } },
      },
    }).catch(() => []),
    prisma.programPage.findMany({
      select: {
        id: true, name: true, heroColor: true,
        leads: { select: { id: true, name: true, email: true }, take: 1 },
      },
    }).catch(() => []),
  ]);

  const programById = new Map(programs.map((p) => [p.id, p]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));

  /** Whether this person reads a given (school, program) conversation. */
  const mine = (schoolId: string, programId: number | null): boolean => {
    if (seesAll) return true;
    const school = schoolById.get(schoolId);
    const lead = programId != null ? programById.get(programId)?.leads[0] ?? null : null;
    if (lead) return lead.id === me?.id;
    // No coordinator, so it falls to whoever holds the account.
    return Boolean(me?.id) && school?.accountManagerId === me?.id;
  };

  const readerFor = (schoolId: string, programId: number | null) => {
    const school = schoolById.get(schoolId);
    const lead = programId != null ? programById.get(programId)?.leads[0] ?? null : null;
    const who = (u: { name: string | null; email: string } | null | undefined) =>
      u ? u.name ?? u.email : null;
    if (lead) return { name: who(lead) ?? "JOC", fallback: false };
    return { name: who(school?.accountManager) ?? "JOC", fallback: true };
  };

  // Group into conversations.
  const byKey = new Map<string, InboxRow>();
  for (const m of messages) {
    if (!mine(m.schoolId, m.programId)) continue;
    const school = schoolById.get(m.schoolId);
    if (!school) continue;

    const key = `${m.schoolId}:${m.programId ?? "g"}`;
    const program = m.programId != null ? programById.get(m.programId) : null;
    const reader = readerFor(m.schoolId, m.programId);

    const row = byKey.get(key) ?? {
      key,
      schoolId: m.schoolId,
      schoolName: school.name,
      programId: m.programId,
      programName: program?.name ?? "General",
      dot: program?.heroColor ?? GENERAL_DOT,
      readerName: reader.name,
      fallback: reader.fallback,
      writers: [...new Set(school.members.map((u) => u.name ?? u.email))].slice(0, 3),
      hasLogins: school.members.length > 0,
      messages: [],
      unread: 0,
      waiting: false,
      lastAt: null,
    };

    row.messages.push({
      id: m.id,
      body: m.body,
      topic: m.topic,
      inbound: m.inbound,
      author: m.author?.name ?? m.author?.email ?? null,
      sentAt: m.sentAt,
      seenAt: m.seenAt,
    });
    if (m.inbound && m.seenAt == null) row.unread++;
    row.waiting = m.inbound;
    row.lastAt = m.sentAt.toISOString();
    byKey.set(key, row);
  }

  const rows = [...byKey.values()].sort(
    (a, b) =>
      b.unread - a.unread ||
      Number(b.waiting) - Number(a.waiting) ||
      (b.lastAt ?? "").localeCompare(a.lastAt ?? "") ||
      a.schoolName.localeCompare(b.schoolName),
  );

  // Schools that run something and have never written. Not in the list —
  // found by searching, so 39 schools do not read as 39 conversations.
  const startable: Parameters<typeof Inbox>[0]["startable"] = [];
  for (const s of schools) {
    for (const e of [...s.enrollments.map((x) => x.programId), null]) {
      if (byKey.has(`${s.id}:${e ?? "g"}`)) continue;
      if (!mine(s.id, e)) continue;
      const program = e != null ? programById.get(e) : null;
      if (e != null && !program) continue;
      const reader = readerFor(s.id, e);
      startable.push({
        schoolId: s.id,
        schoolName: s.name,
        programId: e,
        programName: program?.name ?? "General",
        dot: program?.heroColor ?? GENERAL_DOT,
        readerName: reader.name,
        fallback: reader.fallback,
        hasLogins: s.members.length > 0,
      });
    }
  }

  const waitingSchools = new Set(rows.filter((r) => r.waiting).map((r) => r.schoolId)).size;
  const unreadTotal = rows.reduce((n, r) => n + r.unread, 0);

  const filterPrograms = seesAll
    ? [...new Set(rows.map((r) => r.programId))]
        .map((id) => ({
          id,
          name: id != null ? programById.get(id)?.name ?? "Program" : "General",
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const quiet = new Set(startable.map((s) => s.schoolId)).size;

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>Messages</h1>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: 0, maxWidth: "58ch" }}>
            One conversation per school per program. Nothing is emailed — a school reads your
            reply when they next open their own portal.
          </p>
        </div>

        {/* The question somebody opens this page to answer. */}
        <div style={{
          backgroundColor: waitingSchools > 0 ? C.orangeTint : C.panel,
          borderRadius: "16px", padding: "14px 18px", minWidth: "190px",
        }}>
          <p style={{ ...label, color: waitingSchools > 0 ? C.orangeText : C.muted, margin: "0 0 4px" }}>
            Waiting on you
          </p>
          <p style={{
            fontFamily: F.ui, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em",
            color: waitingSchools > 0 ? C.orangeText : C.ink, margin: "0 0 2px", lineHeight: 1.1,
          }}>
            {waitingSchools > 0 ? `${waitingSchools} school${waitingSchools === 1 ? "" : "s"}` : "Nobody"}
          </p>
          <p style={{ fontFamily: F.read, fontSize: "14px", color: C.muted, margin: 0 }}>
            {waitingSchools > 0
              ? `${unreadTotal} unread message${unreadTotal === 1 ? "" : "s"}`
              : "Every school has had a reply"}
          </p>
        </div>
      </div>

      <Inbox
        rows={rows}
        startable={startable}
        programs={filterPrograms}
        showProgram={seesAll}
        quietCount={quiet}
      />
    </div>
  );
}
