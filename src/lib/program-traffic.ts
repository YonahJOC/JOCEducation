import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { ruleLightFor, LIGHT_ORDER, type Light } from "@/lib/program-lights";

/**
 * "Not in <Program> yet" — the list under every program console.
 *
 * Every school that is not in this program, with a light saying whether the
 * coordinator may approach it. This is the other half of the console: the
 * first half is the schools you already have, and without this one a
 * coordinator has no idea who is left or which of them is safe to ring.
 */

export type TrafficRow = {
  schoolId: string;
  name: string;
  /** Where they are, for a coordinator deciding who to ring first. */
  place: string | null;
  light: Light;
  reason: string;
  /** Who decided, said in the words the row shows. */
  source: { kind: "rule" } | { kind: "manual"; by: string; on: Date; until: Date | null };
  /** Set once the coordinator has acted on this school today. */
  done:
    | { kind: "reached"; at: Date; channel: string }
    | { kind: "agenda"; meetsAt: Date; kind2: string }
    | null;
};

export type TrafficMeeting = {
  id: string;
  meetsAt: Date;
  items: {
    id: string;
    schoolName: string;
    light: Light;
    kind: string;
    note: string;
    by: string | null;
    outcome: string | null;
  }[];
};

export type ProgramTraffic = {
  rows: TrafficRow[];
  counts: { all: number; GREEN: number; AMBER: number; RED: number };
  /** The next meeting an amber or red school can be sent to. Null when none is booked. */
  meeting: TrafficMeeting | null;
  /**
   * Manual lights this person set that have run out and gone back to the
   * rules. Told inside the portal, because nothing here sends anything.
   */
  expired: { schoolName: string; light: Light; lightId: string }[];
  /** May this person change a light, as opposed to acting on one? */
  canSetLight: boolean;
  /** Is anyone keeping the lights up to date? False before the first run. */
  everComputed: boolean;
};

const KIND_WORD: Record<string, string> = {
  REVIEW: "for review",
  SEND_FOR_REVIEW: "sent for review",
  SUGGEST_APPEAL: "appeal suggested",
};

const OUTCOME_WORD: Record<string, string> = {
  KEEP_LIGHT: "Light kept",
  CHANGE_LIGHT: "Light changed",
  CLOSED: "Closed, nothing changed",
};

export const AGENDA_KIND_LABEL = KIND_WORD;
export const AGENDA_OUTCOME_LABEL = OUTCOME_WORD;

/** The meeting things get added to: the next one that has not happened. */
export async function nextMeeting() {
  if (!isDatabaseConfigured()) return null;
  return prisma.adminMeeting.findFirst({
    where: { closedAt: null, meetsAt: { gte: new Date() } },
    orderBy: { meetsAt: "asc" },
  });
}

export async function getProgramTraffic(
  programId: number,
  opts: { canSetLight: boolean },
): Promise<ProgramTraffic> {
  const empty: ProgramTraffic = {
    rows: [],
    counts: { all: 0, GREEN: 0, AMBER: 0, RED: 0 },
    meeting: null,
    expired: [],
    canSetLight: opts.canSetLight,
    everComputed: false,
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const session = await safeAuth();
    const meId = session?.user?.id ?? null;

    const program = await prisma.programPage.findUnique({
      where: { id: programId },
      select: { id: true, name: true, formId: true },
    });
    if (!program) return empty;

    // Who is already in. Both ways a school can be: it is on the calendar for
    // this program, or somebody there filled in its form.
    const [events, responses] = await Promise.all([
      prisma.programEvent.findMany({
        where: { programId, schoolId: { not: null }, status: { not: "CANCELLED" } },
        select: { schoolId: true },
      }),
      program.formId
        ? prisma.formResponse.findMany({
            where: { formId: program.formId, schoolId: { not: null } },
            select: { schoolId: true },
          })
        : Promise.resolve([] as { schoolId: string | null }[]),
    ]);
    const inProgram = new Set<string>();
    for (const e of events) if (e.schoolId) inProgram.add(e.schoolId);
    for (const r of responses) if (r.schoolId) inProgram.add(r.schoolId);

    const schools = await prisma.school.findMany({
      where: { id: { notIn: [...inProgram] } },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, city: true, region: true,
        programLights: {
          where: { programId },
          select: {
            id: true, light: true, reason: true, source: true, setAt: true, until: true,
            expiryToldAt: true,
            setBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const meeting = await nextMeeting();

    // What has already been done about these schools, so a row that has been
    // dealt with says so rather than offering the button again.
    const schoolIds = schools.map((s) => s.id);
    const [queued, reached] = await Promise.all([
      meeting && schoolIds.length
        ? prisma.adminMeetingItem.findMany({
            where: { meetingId: meeting.id, programId, schoolId: { in: schoolIds } },
            select: { schoolId: true, kind: true },
          })
        : Promise.resolve([] as { schoolId: string; kind: string }[]),
      schoolIds.length
        ? prisma.schoolActivity.findMany({
            where: {
              schoolId: { in: schoolIds },
              type: { in: ["CALL", "EMAIL", "VISIT"] },
              occurredAt: { gte: new Date(Date.now() - 86_400_000) },
              summary: { contains: program.name },
            },
            orderBy: { occurredAt: "desc" },
            select: { schoolId: true, type: true, occurredAt: true },
          })
        : Promise.resolve([] as { schoolId: string; type: string; occurredAt: Date }[]),
    ]);

    const queuedBy = new Map(queued.map((q) => [q.schoolId, q.kind]));
    const reachedBy = new Map<string, { type: string; at: Date }>();
    for (const r of reached) {
      if (!reachedBy.has(r.schoolId)) reachedBy.set(r.schoolId, { type: r.type, at: r.occurredAt });
    }

    const channelWord: Record<string, string> = { CALL: "call", EMAIL: "email", VISIT: "in person" };

    const rows: TrafficRow[] = schools.map((s) => {
      const row = s.programLights[0];

      // No row yet means the nightly run has not reached this pair. Rather
      // than an empty cell, work it out now from what is on this page: it is
      // the same rule, and the school still gets an answer.
      const light: Light = (row?.light as Light) ?? "AMBER";
      const reason =
        row?.reason ??
        "The nightly check has not reached this school yet. Treat it as a discuss-first until it has.";

      const done =
        reachedBy.get(s.id) != null
          ? {
              kind: "reached" as const,
              at: reachedBy.get(s.id)!.at,
              channel: channelWord[reachedBy.get(s.id)!.type] ?? "contact",
            }
          : queuedBy.has(s.id) && meeting
          ? { kind: "agenda" as const, meetsAt: meeting.meetsAt, kind2: KIND_WORD[queuedBy.get(s.id)!] ?? "on the agenda" }
          : null;

      return {
        schoolId: s.id,
        name: s.name,
        place: s.city ?? s.region ?? null,
        light,
        reason,
        source:
          row && row.source === "MANUAL"
            ? {
                kind: "manual" as const,
                by: row.setBy?.name ?? row.setBy?.email ?? "somebody at JOC",
                on: row.setAt,
                until: row.until,
              }
            : { kind: "rule" as const },
        done,
      };
    });

    rows.sort((a, b) => LIGHT_ORDER[a.light] - LIGHT_ORDER[b.light] || a.name.localeCompare(b.name));

    const counts = {
      all: rows.length,
      GREEN: rows.filter((r) => r.light === "GREEN").length,
      AMBER: rows.filter((r) => r.light === "AMBER").length,
      RED: rows.filter((r) => r.light === "RED").length,
    };

    // A manual light of this person's that has run out. Told here, in the
    // portal, because no path in this feature sends anything anywhere.
    const expired = meId
      ? (
          await prisma.schoolProgramLight.findMany({
            where: { programId, source: "RULE", setById: meId, expiryToldAt: null },
            select: { id: true, light: true, school: { select: { name: true } } },
          })
        ).map((e) => ({ schoolName: e.school.name, light: e.light as Light, lightId: e.id }))
      : [];

    const items = meeting
      ? await prisma.adminMeetingItem.findMany({
          where: { meetingId: meeting.id, programId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, light: true, kind: true, note: true, outcome: true,
            school: { select: { name: true } },
            createdBy: { select: { name: true, email: true } },
          },
        })
      : [];

    const anyLight = await prisma.schoolProgramLight.count({ where: { programId } });

    return {
      rows,
      counts,
      meeting: meeting
        ? {
            id: meeting.id,
            meetsAt: meeting.meetsAt,
            items: items.map((i) => ({
              id: i.id,
              schoolName: i.school.name,
              light: i.light as Light,
              kind: KIND_WORD[i.kind] ?? i.kind,
              note: i.note,
              by: i.createdBy?.name ?? i.createdBy?.email ?? null,
              outcome: i.outcome ? OUTCOME_WORD[i.outcome] ?? i.outcome : null,
            })),
          }
        : null,
      expired,
      canSetLight: opts.canSetLight,
      everComputed: anyLight > 0,
    };
  } catch {
    return empty;
  }
}

/** Kept here so the rule can be quoted on the page it governs. */
export { ruleLightFor };
