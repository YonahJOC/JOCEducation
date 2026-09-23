import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { C, pageTitle } from "@/lib/joc-tokens";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { AdminMeetingClient, type MeetingView } from "./AdminMeetingClient";

/**
 * The admin meeting.
 *
 * Every school a coordinator could not decide about on their own, grouped by
 * program, with what they asked and room for what was decided. The whole
 * traffic light funnels here: orange and red both end at this page, and a
 * coordinator is told which meeting their school is on so they can stop
 * wondering.
 */

export const metadata = { title: "Admin meeting — JOC Console" };
export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "run_admin_agenda")) {
    return (
      <div style={{ maxWidth: "460px", padding: "40px 0" }}>
        <h1 style={pageTitle}>
          Not one of yours
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>
          Running the admin meeting is its own permission. A super admin can add it to your admin
          type under Admin types.
        </p>
      </div>
    );
  }

  if (!isDatabaseConfigured()) {
    return <AdminMeetingClient meetings={[]} />;
  }

  const rows = await prisma.adminMeeting.findMany({
    orderBy: { meetsAt: "desc" },
    take: 12,
    include: {
      items: {
        orderBy: [{ programId: "asc" }, { createdAt: "asc" }],
        include: {
          school: { select: { id: true, name: true } },
          program: { select: { id: true, name: true, slug: true } },
          createdBy: { select: { name: true, email: true } },
          outcomeBy: { select: { name: true, email: true } },
        },
      },
    },
  });

  // A dynamic server component, rendered once per request — reading the clock
  // here is the point. The purity rule cannot tell this from a client render.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const nextId = rows
    .filter((m) => !m.closedAt && m.meetsAt.getTime() >= now)
    .sort((a, b) => a.meetsAt.getTime() - b.meetsAt.getTime())[0]?.id ?? null;

  const meetings: MeetingView[] = rows.map((m) => ({
    id: m.id,
    meetsAt: m.meetsAt,
    note: m.note,
    closedAt: m.closedAt,
    isNext: m.id === nextId,
    isOverdue: !m.closedAt && m.meetsAt.getTime() < now,
    items: m.items.map((i) => ({
      id: i.id,
      schoolId: i.school.id,
      schoolName: i.school.name,
      programId: i.program.id,
      programName: i.program.name,
      programSlug: i.program.slug,
      light: i.light,
      kind: i.kind,
      note: i.note,
      by: i.createdBy?.name ?? i.createdBy?.email ?? null,
      createdAt: i.createdAt,
      outcome: i.outcome,
      outcomeNote: i.outcomeNote,
      outcomeBy: i.outcomeBy?.name ?? i.outcomeBy?.email ?? null,
      outcomeAt: i.outcomeAt,
    })),
  }));

  return <AdminMeetingClient meetings={meetings} />;
}
