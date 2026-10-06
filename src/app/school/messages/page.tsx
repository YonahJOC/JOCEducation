import { requireSchoolPanel } from "../account-only";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { currentSchoolId } from "@/lib/school-scope";
import { conversationsForSchool } from "@/lib/messages";
import { SchoolMessages, type SchoolConversation } from "@/components/school/SchoolMessages";
import { C, F, pageTitle } from "@/lib/joc-tokens";

/**
 * Talking to JOC.
 *
 * One conversation per program the school runs, plus General for logins,
 * invoices and everything that belongs to no one program. The list names the
 * person who reads each before anything is written — the screen this replaced
 * listed two coordinators above a single undivided thread whose box said
 * "Write to JOC", so nobody could tell who they were writing to.
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

  const [conversations, school, programs] = await Promise.all([
    conversationsForSchool(schoolId),
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }).catch(() => null),
    prisma.programPage
      .findMany({
        select: { id: true, starterQuestions: true, bookingUrl: true, leads: { select: { bookingUrl: true }, take: 1 } },
      })
      .catch(() => []),
  ]);

  const extra = new Map(programs.map((p) => [p.id, p]));

  // General has no program, so it borrows the account manager's own calendar.
  const managerBooking = await prisma.school
    .findUnique({
      where: { id: schoolId },
      select: { accountManager: { select: { bookingUrl: true } } },
    })
    .then((s) => s?.accountManager?.bookingUrl ?? null)
    .catch(() => null);

  const rows: SchoolConversation[] = conversations.map((c) => {
    const p = c.programId != null ? extra.get(c.programId) : null;
    return {
      programId: c.programId,
      programName: c.programName,
      slug: c.slug,
      dot: c.dot,
      reader: { name: c.reader.name, fallback: c.reader.fallback, line: c.reader.line },
      // The program's own booking page wins; otherwise whoever reads it.
      bookingUrl: p?.bookingUrl ?? p?.leads[0]?.bookingUrl ?? (c.programId == null ? managerBooking : null),
      starters: p?.starterQuestions ?? [],
      messages: c.messages,
      unread: c.unread,
      waiting: c.waiting,
      lastAt: c.lastAt ? c.lastAt.toISOString() : null,
    };
  });

  return (
    <div>
      <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>Messages</h1>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 18px", maxWidth: "62ch" }}>
        One conversation for each program you run, and General for everything else. Nothing here
        is emailed — whoever you write to reads it on their own console.
      </p>

      <SchoolMessages conversations={rows} schoolName={school?.name ?? "Your school"} />
    </div>
  );
}
