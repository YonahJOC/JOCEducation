import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { redirect } from "next/navigation";
import { Inbox, type InboxSchool } from "@/components/admin/Inbox";
import { C, F, datum, pageTitle } from "@/lib/joc-tokens";

/**
 * Everything the schools have written, in one place.
 *
 * This page is the answer to "where does the coordinator see it". Before it
 * existed a school could write in, a row appeared on Today saying so, and
 * the only way to read the message was to know which school it was and go
 * digging through the app console — so the portal could tell somebody they
 * had a message and then not show it to them.
 *
 * Not scoped by program. A school writes to JOC, not to eight inboxes, and
 * whoever opens this first can answer or pass it on.
 */

export const metadata = { title: "Messages — JOC Console" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools") && !can(session?.user, "app_activity")) {
    redirect("/admin");
  }

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

  const rows = await prisma.schoolMessage
    .findMany({
      orderBy: { sentAt: "asc" },
      take: 500,
      select: {
        id: true, body: true, inbound: true, sentAt: true, seenAt: true,
        school: { select: { id: true, name: true } },
        author: { select: { name: true, email: true } },
      },
    })
    .catch(() => []);

  const bySchool = new Map<string, InboxSchool>();
  for (const m of rows) {
    const s = bySchool.get(m.school.id) ?? {
      id: m.school.id,
      name: m.school.name,
      unread: 0,
      lastAt: null,
      messages: [],
    };
    s.messages.push({
      id: m.id,
      body: m.body,
      inbound: m.inbound,
      author: m.author?.name ?? m.author?.email ?? null,
      sentAt: m.sentAt,
      seenAt: m.seenAt,
    });
    if (m.inbound && m.seenAt == null) s.unread++;
    s.lastAt = m.sentAt;
    bySchool.set(m.school.id, s);
  }

  // Unread first, then whoever wrote most recently. A school with nothing
  // unread still appears — answering yesterday's question is a normal thing
  // to want to do.
  const schools = [...bySchool.values()].sort(
    (a, b) =>
      b.unread - a.unread ||
      (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0) ||
      a.name.localeCompare(b.name),
  );

  const waiting = schools.reduce((n, s) => n + s.unread, 0);

  return (
    <div>
      <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>Messages</h1>
      <p style={{ ...datum, color: waiting > 0 ? C.orangeText : C.muted, margin: "0 0 20px" }}>
        {schools.length} SCHOOL{schools.length === 1 ? "" : "S"} ·{" "}
        {waiting === 0 ? "NOTHING WAITING ON YOU" : `${waiting} WAITING ON YOU`}
      </p>

      <Inbox schools={schools} />
    </div>
  );
}
