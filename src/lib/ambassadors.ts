import { randomInt } from "node:crypto";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";

/**
 * Student ambassadors.
 *
 * Two students per program per school run it on the ground and report back
 * after each time it happens. They are the only people on this platform who
 * are children, and that shapes every decision in this file:
 *
 *   No email ever reaches them.      They are invited by a code their teacher
 *                                    hands them. The portal's send gate would
 *                                    block it anyway; this is also the right
 *                                    answer on its own.
 *   Their name is the teacher's.     JOC sees "an ambassador at Bnos Chaya"
 *                                    and a count. The supervising teacher sees
 *                                    the student. `forStaff` is the only shape
 *                                    that ever leaves for the console.
 *   Photos are the sharpest edge.    A photo of a school event has other
 *                                    people's children in it. It reaches JOC
 *                                    only when the teacher marks it shareable,
 *                                    and is served through the authenticated
 *                                    file route like everything else.
 *   Tenure actually ends.            `endsAt` is checked here, in the scope
 *                                    helper, not hidden in the interface.
 *   Estimates stay estimates.        A participation count is a teenager's
 *                                    guess and is labelled as one everywhere.
 *                                    A CRM figure that reads as measured and
 *                                    is not is worse than no figure.
 */

/** Two. Stated once, because it is a rule and not a preference. */
export const PLACES_PER_PROGRAM = 2;

/** How long a join code is good for. Long enough to hand out, short enough to expire. */
export const INVITE_DAYS = 30;

/**
 * The scope an ambassador has: one program at one school, while their tenure
 * is current. Null for everybody else, including a student whose tenure ended
 * and a teacher looking at the wrong address.
 */
export type AmbassadorScope = {
  id: string;
  userId: string;
  schoolId: string;
  schoolName: string;
  programId: number;
  programName: string;
  programSlug: string;
  startsAt: Date;
  endsAt: Date | null;
  supervisor: { name: string | null; email: string };
};

/**
 * The signed-in person's ambassadorship, if they have a current one.
 *
 * Deliberately singular. A student could in principle hold two — the schema
 * allows it — but the page they open is about the program they run, and
 * asking them which one before they have said anything would be the platform
 * showing off its data model.
 */
export async function myAmbassadorship(): Promise<AmbassadorScope | null> {
  if (!isDatabaseConfigured()) return null;
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const row = await prisma.programAmbassador.findFirst({
    where: {
      userId,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { startsAt: "desc" },
    select: {
      id: true, userId: true, schoolId: true, programId: true, startsAt: true, endsAt: true,
      school: { select: { name: true } },
      program: { select: { name: true, slug: true } },
      supervisor: { select: { name: true, email: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    schoolId: row.schoolId,
    schoolName: row.school.name,
    programId: row.programId,
    programName: row.program.name,
    programSlug: row.program.slug,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    supervisor: row.supervisor,
  };
}

/** Did this person's tenure end rather than never exist? Worth saying differently. */
export async function myEndedAmbassadorship(): Promise<{ programName: string; endedOn: Date } | null> {
  if (!isDatabaseConfigured()) return null;
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const row = await prisma.programAmbassador.findFirst({
    where: { userId, endsAt: { not: null, lte: new Date() } },
    orderBy: { endsAt: "desc" },
    select: { endsAt: true, program: { select: { name: true } } },
  });
  return row?.endsAt ? { programName: row.program.name, endedOn: row.endsAt } : null;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

/** What the ambassador who wrote it sees, and what their teacher sees. */
export type ReportForTeacher = {
  id: string;
  occurredOn: Date;
  participants: number | null;
  whatHappened: string;
  wentWell: string | null;
  wouldChange: string | null;
  photoId: string | null;
  photoShared: boolean;
  submittedAt: Date;
  seen: boolean;
  /** The student's name. Never leaves the teacher's view. */
  byName: string | null;
  eventTitle: string | null;
};

/**
 * The same report with the child taken out of it.
 *
 * This is the only shape that reaches the JOC console. Not a filter applied
 * in a component — a different type, so a page cannot render the name by
 * forgetting to leave it out.
 */
export type ReportForStaff = {
  id: string;
  occurredOn: Date;
  participants: number | null;
  whatHappened: string;
  wentWell: string | null;
  wouldChange: string | null;
  /** Present only when the supervising teacher marked it shareable. */
  photoId: string | null;
  submittedAt: Date;
  schoolId: string;
  schoolName: string;
  programId: number;
  programName: string;
};

/** One ambassador's own reports, newest first. */
export async function myReports(ambassadorId: string): Promise<ReportForTeacher[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.eventReport.findMany({
    where: { ambassadorId },
    orderBy: { occurredOn: "desc" },
    select: {
      id: true, occurredOn: true, participants: true, whatHappened: true,
      wentWell: true, wouldChange: true, photoId: true, photoShared: true,
      submittedAt: true, seenBySupervisorAt: true,
      ambassador: { select: { user: { select: { name: true } } } },
      event: { select: { title: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    occurredOn: r.occurredOn,
    participants: r.participants,
    whatHappened: r.whatHappened,
    wentWell: r.wentWell,
    wouldChange: r.wouldChange,
    photoId: r.photoId,
    photoShared: r.photoShared,
    submittedAt: r.submittedAt,
    seen: Boolean(r.seenBySupervisorAt),
    byName: r.ambassador.user.name,
    eventTitle: r.event?.title ?? null,
  }));
}

/**
 * Everything the signed-in teacher supervises: their ambassadors and what
 * those students have written.
 */
export type SupervisedAmbassador = {
  id: string;
  studentName: string | null;
  studentEmail: string;
  programId: number;
  programName: string;
  programSlug: string;
  startsAt: Date;
  endsAt: Date | null;
  current: boolean;
  reports: ReportForTeacher[];
};

export async function whoISupervise(): Promise<SupervisedAmbassador[]> {
  if (!isDatabaseConfigured()) return [];
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const now = Date.now();
  const rows = await prisma.programAmbassador.findMany({
    where: { supervisorId: userId },
    orderBy: { startsAt: "desc" },
    select: {
      id: true, startsAt: true, endsAt: true, programId: true,
      user: { select: { name: true, email: true } },
      program: { select: { name: true, slug: true } },
      reports: {
        orderBy: { occurredOn: "desc" },
        select: {
          id: true, occurredOn: true, participants: true, whatHappened: true,
          wentWell: true, wouldChange: true, photoId: true, photoShared: true,
          submittedAt: true, seenBySupervisorAt: true,
          event: { select: { title: true } },
        },
      },
    },
  });

  return rows.map((a) => ({
    id: a.id,
    studentName: a.user.name,
    studentEmail: a.user.email,
    programId: a.programId,
    programName: a.program.name,
    programSlug: a.program.slug,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    current: !a.endsAt || a.endsAt.getTime() > now,
    reports: a.reports.map((r) => ({
      id: r.id,
      occurredOn: r.occurredOn,
      participants: r.participants,
      whatHappened: r.whatHappened,
      wentWell: r.wentWell,
      wouldChange: r.wouldChange,
      photoId: r.photoId,
      photoShared: r.photoShared,
      submittedAt: r.submittedAt,
      seen: Boolean(r.seenBySupervisorAt),
      byName: a.user.name,
      eventTitle: r.event?.title ?? null,
    })),
  }));
}

// ─── The JOC side ────────────────────────────────────────────────────────────

export type ProgramReporting = {
  /** Schools with an ambassador on this program, and how they are doing. */
  schools: {
    schoolId: string;
    schoolName: string;
    ambassadors: number;
    reportsThisMonth: number;
    participantsThisMonth: number | null;
    lastReportOn: Date | null;
    /** Nothing for a fortnight at a school that has ambassadors. */
    quiet: boolean;
  }[];
  /** The narratives, with no student named. */
  recent: ReportForStaff[];
  totals: { schools: number; ambassadors: number; reportsThisMonth: number; quiet: number };
};

const QUIET_DAYS = 14;

/**
 * One program's ambassador activity, for the console.
 *
 * Never returns a student's name. The type it returns cannot carry one.
 */
export async function programReporting(programId: number): Promise<ProgramReporting> {
  const empty: ProgramReporting = {
    schools: [],
    recent: [],
    totals: { schools: 0, ambassadors: 0, reportsThisMonth: 0, quiet: 0 },
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const ambassadors = await prisma.programAmbassador.findMany({
      where: { programId, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      select: {
        id: true, schoolId: true,
        school: { select: { name: true } },
        reports: {
          orderBy: { occurredOn: "desc" },
          select: {
            id: true, occurredOn: true, participants: true, whatHappened: true,
            wentWell: true, wouldChange: true, photoId: true, photoShared: true, submittedAt: true,
          },
        },
      },
    });

    const program = await prisma.programPage.findUnique({
      where: { id: programId },
      select: { name: true },
    });

    const bySchool = new Map<string, ProgramReporting["schools"][number]>();
    const recent: ReportForStaff[] = [];

    for (const a of ambassadors) {
      const row =
        bySchool.get(a.schoolId) ?? {
          schoolId: a.schoolId,
          schoolName: a.school.name,
          ambassadors: 0,
          reportsThisMonth: 0,
          participantsThisMonth: null,
          lastReportOn: null,
          quiet: false,
        };
      row.ambassadors++;

      for (const r of a.reports) {
        if (r.occurredOn >= monthStart) {
          row.reportsThisMonth++;
          if (r.participants != null) {
            row.participantsThisMonth = (row.participantsThisMonth ?? 0) + r.participants;
          }
        }
        if (!row.lastReportOn || r.occurredOn > row.lastReportOn) row.lastReportOn = r.occurredOn;

        recent.push({
          id: r.id,
          occurredOn: r.occurredOn,
          participants: r.participants,
          whatHappened: r.whatHappened,
          wentWell: r.wentWell,
          wouldChange: r.wouldChange,
          // The teacher's decision, honoured here and nowhere else.
          photoId: r.photoShared ? r.photoId : null,
          submittedAt: r.submittedAt,
          schoolId: a.schoolId,
          schoolName: a.school.name,
          programId,
          programName: program?.name ?? "This program",
        });
      }

      bySchool.set(a.schoolId, row);
    }

    const quietBefore = now.getTime() - QUIET_DAYS * 86_400_000;
    for (const row of bySchool.values()) {
      row.quiet = !row.lastReportOn || row.lastReportOn.getTime() < quietBefore;
    }

    const schools = [...bySchool.values()].sort(
      (a, b) => Number(b.quiet) - Number(a.quiet) || a.schoolName.localeCompare(b.schoolName),
    );
    recent.sort((a, b) => b.occurredOn.getTime() - a.occurredOn.getTime());

    return {
      schools,
      recent: recent.slice(0, 20),
      totals: {
        schools: schools.length,
        ambassadors: ambassadors.length,
        reportsThisMonth: schools.reduce((n, s) => n + s.reportsThisMonth, 0),
        quiet: schools.filter((s) => s.quiet).length,
      },
    };
  } catch {
    return empty;
  }
}

// ─── Join codes ──────────────────────────────────────────────────────────────

/**
 * Six characters a teenager can read off a whiteboard and type correctly.
 *
 * No 0/O, no 1/I/L. Random from a CSPRNG rather than Math.random: a guessable
 * code is a stranger in a school's program.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** What a code is worth, said in the words the join page shows. */
export type CodeCheck =
  | { ok: true; schoolName: string; programName: string; placesLeft: number }
  | { ok: false; reason: string };

export async function checkCode(raw: string): Promise<CodeCheck> {
  if (!isDatabaseConfigured()) return { ok: false, reason: "Joining is not switched on yet." };

  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length !== 6) return { ok: false, reason: "A code is six letters and numbers." };

  const invite = await prisma.ambassadorInvite.findUnique({
    where: { code },
    select: {
      id: true, expiresAt: true, revokedAt: true, usedCount: true,
      schoolId: true, programId: true,
      school: { select: { name: true } },
      program: { select: { name: true } },
    },
  });

  if (!invite) return { ok: false, reason: "That code does not match anything. Check it with your teacher." };
  if (invite.revokedAt) return { ok: false, reason: "That code was cancelled. Ask your teacher for a new one." };
  if (invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "That code has expired. Ask your teacher for a new one." };
  }

  // A tenure that has ended does not use up a place.
  const taken = await prisma.programAmbassador.count({
    where: {
      schoolId: invite.schoolId,
      programId: invite.programId,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
  });
  if (taken >= PLACES_PER_PROGRAM) {
    return {
      ok: false,
      reason: `${invite.program.name} already has its two ambassadors at ${invite.school.name}. Ask your teacher.`,
    };
  }

  return {
    ok: true,
    schoolName: invite.school.name,
    programName: invite.program.name,
    placesLeft: PLACES_PER_PROGRAM - taken,
  };
}
