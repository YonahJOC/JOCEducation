import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { can } from "@/lib/access";
import { missingEnv } from "@/lib/boot";

/**
 * What needs each person at JOC today.
 *
 * /admin used to be a board of every school, which is a thing to browse
 * rather than a thing to do. Whatever your job, this is the same shape: rows
 * that are true right now, each with a figure, a sentence and one action.
 *
 * Built from capabilities rather than roles, so somebody with an unusual
 * admin type gets rows about the work they can actually do.
 */

export type TodayRow = {
  id: string;
  /** The Plex Mono band: "OVERDUE · 3 SCHOOLS". */
  band: string;
  tone: "warn" | "info" | "good";
  says: string;
  action: { label: string; href: string } | null;
  weight: number;
};

export type TodayFigure = { label: string; value: string; warn?: boolean };

export type Today = {
  title: string;
  rows: TodayRow[];
  figures: TodayFigure[];
};

const days = (from: Date, now: number) => Math.floor((now - from.getTime()) / 86_400_000);

export async function getToday(): Promise<Today> {
  const empty: Today = { title: "Today", rows: [], figures: [] };
  if (!isDatabaseConfigured()) return empty;

  try {
    const session = await safeAuth();
    const me = session?.user;
    const now = Date.now();
    const rows: TodayRow[] = [];
    const figures: TodayFigure[] = [];

    // ── Anyone who keeps the lights on ────────────────────────────────────
    // A feature that is switched off by a missing variable is invisible
    // otherwise: it simply never runs, and nothing anywhere says why.
    if (can(me, "users")) {
      const missing = missingEnv();
      if (missing.length > 0) {
        rows.push({
          id: "env",
          band: `Switched off · ${missing.length}`,
          tone: "warn",
          weight: 9000,
          says:
            `${missing.map((m) => m.name).join(", ")} ${missing.length === 1 ? "is" : "are"} not set, so ` +
            missing.map((m) => m.costs).join("; ") + ".",
          action: { label: "How to set it", href: "/admin/guide" },
        });
      }
    }

    // ── School accounts ───────────────────────────────────────────────────
    if (can(me, "schools")) {
      const [pastDue, lapsed, schools, contacts] = await Promise.all([
        prisma.subscription.findMany({
          where: { status: "PAST_DUE" },
          select: { school: { select: { id: true, name: true } } },
        }),
        prisma.school.count({ where: { status: "LAPSED" } }),
        prisma.school.count(),
        prisma.schoolContact.count(),
      ]);

      if (pastDue.length > 0) {
        rows.push({
          id: "pastdue",
          band: `Not paid · ${pastDue.length}`,
          tone: "warn",
          weight: 5000,
          says:
            pastDue.length === 1
              ? `${pastDue[0].school.name} is past due.`
              : `${pastDue.length} schools are past due.`,
          action: { label: "Open schools", href: "/admin/schools?status=ACTIVE" },
        });
      }

      if (lapsed > 0) {
        rows.push({
          id: "lapsed",
          band: `Lapsed · ${lapsed}`,
          tone: "warn",
          weight: 3000,
          says: `${lapsed} school${lapsed === 1 ? " has" : "s have"} lapsed and nobody has picked them up.`,
          action: { label: "Open schools", href: "/admin/schools?status=LAPSED" },
        });
      }

      // A school with nobody to ring is a school the traffic light cannot act on.
      if (schools > 0 && contacts < schools / 2) {
        rows.push({
          id: "contacts",
          band: `No contact · ${schools - contacts}`,
          tone: "warn",
          weight: 2500,
          says: `${schools - contacts} of ${schools} schools have nobody recorded to ring, so "reach out" has no phone number behind it.`,
          action: { label: "Open schools", href: "/admin/schools" },
        });
      }

      figures.push({ label: "Schools", value: String(schools) });
    }

    if (can(me, "demos")) {
      const demos = await prisma.demoRequest.count({ where: { status: "NEW" } });
      if (demos > 0) {
        rows.push({
          id: "demos",
          band: `New request · ${demos}`,
          tone: "info",
          weight: 4000,
          says: `${demos} school${demos === 1 ? " has" : "s have"} asked for a walkthrough and nobody has answered.`,
          action: { label: "Open requests", href: "/admin/demos" },
        });
      }
      figures.push({ label: "Demo requests", value: String(demos) });
    }

    // ── The admin meeting ─────────────────────────────────────────────────
    if (can(me, "run_admin_agenda")) {
      const meeting = await prisma.adminMeeting.findFirst({
        where: { closedAt: null, meetsAt: { gte: new Date() } },
        orderBy: { meetsAt: "asc" },
        include: { items: { select: { outcome: true } } },
      });

      if (!meeting) {
        const waiting = await prisma.adminMeetingItem.count({ where: { outcome: null } });
        rows.push({
          id: "no-meeting",
          band: "No meeting booked",
          tone: "warn",
          weight: 3500,
          says:
            waiting > 0
              ? `${waiting} school${waiting === 1 ? " is" : "s are"} waiting on a decision and there is no meeting to take them to.`
              : "No admin meeting is booked, so a coordinator with an orange or red school has nowhere to send it.",
          action: { label: "Book one", href: "/admin/meetings" },
        });
      } else {
        const undecided = meeting.items.filter((i) => !i.outcome).length;
        rows.push({
          id: "meeting",
          band: `Meeting · ${meeting.meetsAt.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`,
          tone: undecided > 0 ? "info" : "good",
          weight: 2000,
          says:
            meeting.items.length === 0
              ? "Nothing is on the next admin meeting yet."
              : `${meeting.items.length} school${meeting.items.length === 1 ? "" : "s"} on the agenda, ${undecided} still to decide.`,
          action: { label: "Open the meeting", href: "/admin/meetings" },
        });
      }
    }

    // ── Teaching material ─────────────────────────────────────────────────
    if (can(me, "lessons")) {
      const [unpublished, resources, published] = await Promise.all([
        prisma.lessonPlan.findMany({
          where: { published: false },
          select: { id: true, updatedAt: true },
        }),
        prisma.resource.count({ where: { published: true } }),
        prisma.lessonPlan.count({ where: { published: true } }),
      ]);

      const stale = unpublished.filter((l) => days(l.updatedAt, now) > 14);
      if (stale.length > 0) {
        rows.push({
          id: "unpublished",
          band: `Unpublished · ${stale.length}`,
          tone: "warn",
          weight: 2200,
          says: `${stale.length} lesson${stale.length === 1 ? " has" : "s have"} sat unpublished for more than a fortnight. Nobody can teach a draft.`,
          action: { label: "Open lessons", href: "/admin/lessons" },
        });
      }

      if (resources === 0) {
        rows.push({
          id: "resources",
          band: "Library empty",
          tone: "warn",
          weight: 2600,
          says: "No resource is published. The library is what a school renews for, and it has nothing in it.",
          action: { label: "Open resources", href: "/admin/resources" },
        });
      }

      figures.push({ label: "Lessons live", value: String(published) });
      figures.push({ label: "Resources", value: String(resources), warn: resources === 0 });
    }

    if (can(me, "board")) {
      const waiting = await prisma.boardPost.count({ where: { approved: false } });
      if (waiting > 0) {
        rows.push({
          id: "board",
          band: `Waiting · ${waiting}`,
          tone: "info",
          weight: 1500,
          says: `${waiting} board post${waiting === 1 ? "" : "s"} waiting to be approved.`,
          action: { label: "Open the board", href: "/admin/board" },
        });
      }
    }

    // ── The calendar ──────────────────────────────────────────────────────
    if (can(me, "programming")) {
      const soon = new Date(now + 7 * 86_400_000);
      const unannounced = await prisma.programEvent.count({
        where: { published: false, status: { not: "CANCELLED" }, startsAt: { gte: new Date(), lte: soon } },
      });
      if (unannounced > 0) {
        rows.push({
          id: "unannounced",
          band: `Not announced · ${unannounced}`,
          tone: "warn",
          weight: 4500,
          says: `${unannounced} run${unannounced === 1 ? "" : "s"} in the next week ${unannounced === 1 ? "is" : "are"} still unpublished, so nobody outside the console can see ${unannounced === 1 ? "it" : "them"}.`,
          action: { label: "Open the calendar", href: "/admin/programming" },
        });
      }

      const amber = await prisma.schoolProgramLight.count({ where: { light: "AMBER" } });
      figures.push({ label: "Discuss first", value: String(amber) });
    }

    if (can(me, "cycles")) {
      figures.push({ label: "Cycle dates", value: "unverified", warn: true });
    }

    rows.sort((a, b) => b.weight - a.weight);

    const name = me?.name?.trim().split(/\s+/)[0];
    return {
      title: name ? `Today, ${name}` : "Today",
      rows,
      figures,
    };
  } catch {
    return empty;
  }
}
