import { requireSchoolPanel } from "../account-only";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { currentSchoolId } from "@/lib/school-scope";
import { MessagesFromJOC } from "@/components/school/MessagesFromJOC";
import { C, F, label, pageTitle, rowCard } from "@/lib/joc-tokens";

/**
 * Talking to JOC.
 *
 * The thread already existed on each program's page, which is one level in
 * from anywhere a school actually starts. Somebody wanting to ask a question
 * had to first decide which program it was about — and "can you add another
 * admin" belongs to no program at all.
 *
 * So it is a page of its own, in the rail, and the conversation is per school
 * rather than per program: a school talks to JOC, not to eight inboxes, and
 * splitting it would hide an answer behind whichever page somebody happened
 * to open.
 */

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function SchoolMessagesPage() {
  await requireSchoolPanel();

  const schoolId = await currentSchoolId();
  if (!isDatabaseConfigured() || !schoolId) {
    return (
      <div>
        <h1 style={pageTitle}>Messages</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.6, margin: 0 }}>
          Your account is not attached to a school yet, so there is nobody to write to.
        </p>
      </div>
    );
  }

  const [thread, enrollments] = await Promise.all([
    prisma.schoolMessage
      .findMany({
        where: { schoolId },
        orderBy: { sentAt: "asc" },
        take: 100,
        select: {
          id: true, body: true, inbound: true, sentAt: true,
          author: { select: { name: true, email: true } },
        },
      })
      .catch(() => []),
    prisma.programEnrollment
      .findMany({
        where: { schoolId },
        select: {
          program: {
            select: { name: true, leads: { select: { name: true, email: true } } },
          },
        },
      })
      .catch(() => []),
  ]);

  // Who this actually reaches. A school asking "who am I writing to" deserves
  // an answer, and the honest one is a list of the people who run what they
  // run — not the word "JOC".
  const people = new Map<string, string[]>();
  for (const e of enrollments) {
    const lead = e.program.leads[0];
    if (!lead) continue;
    const who = lead.name ?? lead.email;
    people.set(who, [...(people.get(who) ?? []), e.program.name]);
  }

  return (
    <div>
      <h1 style={pageTitle}>Messages</h1>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 20px", maxWidth: "62ch" }}>
        Anything here reaches whoever looks after your programs at JOC. They read it on their own
        console — nothing is emailed either way.
      </p>

      {people.size > 0 && (
        <div style={{ ...rowCard, padding: "16px 18px", marginBottom: "20px" }}>
          <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>Who you&rsquo;re writing to</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "6px" }}>
            {[...people.entries()].map(([who, programs]) => (
              <li key={who} style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.ink }}>
                <strong>{who}</strong>
                <span style={{ color: C.muted }}> — {programs.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MessagesFromJOC
        programId={null}
        messages={thread.map((m) => ({
          id: m.id,
          body: m.body,
          inbound: m.inbound,
          author: m.author?.name ?? m.author?.email ?? null,
          sentAt: m.sentAt,
        }))}
      />
    </div>
  );
}
