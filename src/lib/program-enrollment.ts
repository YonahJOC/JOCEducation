import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Which school runs which program.
 *
 * One table, one answer. It used to be inferred — "in the program" meant
 * either a ProgramEvent that had not been cancelled or a form response
 * against the program's form — and that inference was written out twice, in
 * program-traffic.ts and program-lights.ts. Two copies of a rule drift, and
 * neither could say a school was registered but not trained yet, which is the
 * question a growing nonprofit asks most often.
 */

export type Stage =
  | "INTRODUCED"
  | "MEETING_BOOKED"
  | "REGISTERED"
  | "MATERIALS_SENT"
  | "TRAINED"
  | "LAUNCHED"
  | "RUNNING"
  | "PAUSED"
  | "ENDED";

/** In the order a school travels through them. */
export const STAGES: Stage[] = [
  "INTRODUCED", "MEETING_BOOKED", "REGISTERED", "MATERIALS_SENT",
  "TRAINED", "LAUNCHED", "RUNNING", "PAUSED", "ENDED",
];

export const STAGE_LABEL: Record<Stage, string> = {
  INTRODUCED: "Introduced",
  MEETING_BOOKED: "Meeting booked",
  REGISTERED: "Registered",
  MATERIALS_SENT: "Materials sent",
  TRAINED: "Trained",
  LAUNCHED: "Launched",
  RUNNING: "Running",
  PAUSED: "Paused",
  ENDED: "Ended",
};

export const STAGE_MEANING: Record<Stage, string> = {
  INTRODUCED: "Somebody has told them about it.",
  MEETING_BOOKED: "A date is in the diary to talk it through.",
  REGISTERED: "Their form is in.",
  MATERIALS_SENT: "Whatever they need has gone out to them.",
  TRAINED: "Their staff know how to run it.",
  LAUNCHED: "It has run there once.",
  RUNNING: "It runs there as a matter of course.",
  PAUSED: "On hold, expected back.",
  ENDED: "They stopped.",
};

/**
 * Stages where the school counts as having this program.
 *
 * A school that was only introduced to it is not in it — that is the whole
 * point of the traffic light, which is about schools nobody has got anywhere
 * with yet. Ended is not in it either, but it is not on the list of schools
 * to approach either; a school that dropped a program is its own
 * conversation.
 */
const IN_PROGRAM: Stage[] = [
  "MEETING_BOOKED", "REGISTERED", "MATERIALS_SENT", "TRAINED", "LAUNCHED", "RUNNING", "PAUSED",
];

export function countsAsIn(stage: Stage): boolean {
  return IN_PROGRAM.includes(stage);
}


/** Green at running, orange while it is still being set up, grey once it stops. */
export const STAGE_TONE: Record<Stage, "going" | "setup" | "stopped"> = {
  INTRODUCED: "setup",
  MEETING_BOOKED: "setup",
  REGISTERED: "setup",
  MATERIALS_SENT: "setup",
  TRAINED: "setup",
  LAUNCHED: "going",
  RUNNING: "going",
  PAUSED: "stopped",
  ENDED: "stopped",
};

/**
 * The schools this program has reached at all.
 *
 * Any stage counts, including "introduced" and "ended". They are the schools
 * that belong in the stage list rather than on the list of schools nobody has
 * approached, and a school in both lists at once would be the console
 * contradicting itself.
 *
 * Not the same question as `allEnrolledPairs`, which asks whether a school is
 * busy enough with one program to be worth a conversation before another one
 * is introduced. Being told about a program is not being in it.
 */
export async function schoolsInProgram(programId: number): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  const rows = await prisma.programEnrollment.findMany({
    where: { programId },
    select: { schoolId: true },
  });
  return new Set(rows.map((r) => r.schoolId));
}

/** Every school × program pair that is in, as "schoolId:programId". */
export async function allEnrolledPairs(): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  const rows = await prisma.programEnrollment.findMany({
    where: { stage: { in: STAGES.filter(countsAsIn) } },
    select: { schoolId: true, programId: true },
  });
  return new Set(rows.map((r) => `${r.schoolId}:${r.programId}`));
}

export type EnrolledRow = {
  id: string;
  schoolId: string;
  schoolName: string;
  place: string | null;
  stage: Stage;
  stageSince: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  note: string | null;
  contact: { id: string; name: string; phone: string | null; email: string | null } | null;
  /** Contacts at this school, so somebody can be named without leaving the page. */
  contactChoices: { id: string; name: string; title: string | null }[];
  /** Runs on the calendar, so a stage can be checked against what happened. */
  runs: number;
  nextRun: Date | null;
};

/** One program's schools, furthest along first. */
export async function enrolledSchools(programId: number): Promise<EnrolledRow[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const rows = await prisma.programEnrollment.findMany({
      where: { programId },
      select: {
        id: true, stage: true, stageSince: true, startedAt: true, endedAt: true, note: true,
        contact: { select: { id: true, name: true, phone: true, email: true } },
        school: {
          select: {
            id: true, name: true, city: true, region: true,
            contacts: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
              select: { id: true, name: true, title: true },
            },
            events: {
              where: { programId, status: { not: "CANCELLED" } },
              orderBy: { startsAt: "asc" },
              select: { startsAt: true },
            },
          },
        },
      },
    });

    const now = Date.now();
    const out: EnrolledRow[] = rows.map((r) => ({
      id: r.id,
      schoolId: r.school.id,
      schoolName: r.school.name,
      place: r.school.city ?? r.school.region ?? null,
      stage: r.stage as Stage,
      stageSince: r.stageSince,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      note: r.note,
      contact: r.contact,
      contactChoices: r.school.contacts,
      runs: r.school.events.length,
      nextRun: r.school.events.find((e) => e.startsAt.getTime() >= now)?.startsAt ?? null,
    }));

    // Furthest along first, then whichever has been stuck longest, then name.
    out.sort(
      (a, b) =>
        STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage) ||
        a.stageSince.getTime() - b.stageSince.getTime() ||
        a.schoolName.localeCompare(b.schoolName),
    );
    return out;
  } catch {
    return [];
  }
}

/**
 * Write the enrollments the old inference implied.
 *
 * Run once, when the table is empty, and again whenever somebody wants the
 * calendar and the sign-ups reconciled. It only ever creates: a stage
 * somebody set by hand is a decision, and a backfill that overwrote one would
 * be worse than no backfill.
 */
export async function backfillEnrollments(): Promise<{ created: number; scanned: number }> {
  if (!isDatabaseConfigured()) return { created: 0, scanned: 0 };

  const programs = await prisma.programPage.findMany({ select: { id: true, formId: true } });
  const formIds = programs.map((p) => p.formId).filter((f): f is string => Boolean(f));
  const programOfForm = new Map(programs.filter((p) => p.formId).map((p) => [p.formId!, p.id]));

  const [events, responses, existing] = await Promise.all([
    prisma.programEvent.findMany({
      where: { schoolId: { not: null }, programId: { not: null }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      select: { schoolId: true, programId: true, status: true, startsAt: true },
    }),
    formIds.length
      ? prisma.formResponse.findMany({
          where: { formId: { in: formIds }, schoolId: { not: null } },
          orderBy: { createdAt: "asc" },
          select: { schoolId: true, formId: true, createdAt: true },
        })
      : Promise.resolve([] as { schoolId: string | null; formId: string; createdAt: Date }[]),
    prisma.programEnrollment.findMany({ select: { schoolId: true, programId: true } }),
  ]);

  const have = new Set(existing.map((e) => `${e.schoolId}:${e.programId}`));

  /** What the old evidence says about one pair. */
  const implied = new Map<string, { schoolId: string; programId: number; stage: Stage; since: Date; startedAt: Date | null }>();

  const note = (
    schoolId: string,
    programId: number,
    stage: Stage,
    since: Date,
    startedAt: Date | null,
  ) => {
    const key = `${schoolId}:${programId}`;
    const prev = implied.get(key);
    // Furthest along wins: a school with a form response and a run that has
    // happened is launched, not registered.
    if (!prev || STAGES.indexOf(stage) > STAGES.indexOf(prev.stage)) {
      implied.set(key, { schoolId, programId, stage, since, startedAt: startedAt ?? prev?.startedAt ?? null });
    } else if (startedAt && !prev.startedAt) {
      implied.set(key, { ...prev, startedAt });
    }
  };

  for (const e of events) {
    if (!e.schoolId || e.programId == null) continue;
    // A date in the diary is a booking; a date that has happened is a launch.
    const done = e.status === "DONE" || e.startsAt.getTime() < Date.now();
    note(e.schoolId, e.programId, done ? "LAUNCHED" : "MEETING_BOOKED", e.startsAt, done ? e.startsAt : null);
  }

  for (const r of responses) {
    const pid = programOfForm.get(r.formId);
    if (!pid || !r.schoolId) continue;
    note(r.schoolId, pid, "REGISTERED", r.createdAt, null);
  }

  let created = 0;
  for (const v of implied.values()) {
    if (have.has(`${v.schoolId}:${v.programId}`)) continue;
    await prisma.programEnrollment.create({
      data: {
        schoolId: v.schoolId,
        programId: v.programId,
        stage: v.stage,
        stageSince: v.since,
        startedAt: v.startedAt,
        note: "Worked out from the calendar and the sign-ups when this table was added.",
      },
    });
    created++;
  }

  return { created, scanned: implied.size };
}
