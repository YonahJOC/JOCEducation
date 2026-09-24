import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { allEnrolledPairs } from "@/lib/program-enrollment";
import { C } from "@/lib/joc-tokens";

/**
 * Whether a coordinator may approach a school about a program.
 *
 * Eight programs, thirty-odd schools, and eight coordinators who cannot see
 * each other's work. Without this, two of them ring the same principal in the
 * same week about different things, and the school decides JOC is chaotic.
 *
 * The rules are deliberately dull and are stated once, here. Everything the
 * console does is arrangement; this is the part that decides whether a
 * coordinator picks up the phone.
 */

export type Light = "GREEN" | "AMBER" | "RED";

/** The words. Used everywhere, with no second set anywhere else. */
export const LIGHT_LABEL: Record<Light, string> = {
  GREEN: "Reach out",
  AMBER: "Discuss first",
  RED: "Hold off",
};

/**
 * The light itself, for the band on a row.
 *
 * LIGHT_LABEL is the instruction and belongs on the button. Putting it in the
 * band as well left every row saying "Reach out" twice, six inches apart.
 */
export const LIGHT_WORD: Record<Light, string> = {
  GREEN: "Green",
  AMBER: "Amber",
  RED: "Red",
};

export const LIGHT_MEANING: Record<Light, string> = {
  GREEN: "Fine to introduce the program",
  AMBER: "Talk it through before contacting",
  RED: "Don't pitch this program now",
};

export const LIGHT_COLOR: Record<Light, { dot: string; tint: string; text: string }> = {
  GREEN: { dot: C.green, tint: C.greenTint, text: C.greenText },
  AMBER: { dot: C.orange, tint: C.orangeTint, text: C.orangeText },
  RED: { dot: C.red, tint: C.redTint, text: C.redText },
};

/** Green, then orange, then red, then by name. */
export const LIGHT_ORDER: Record<Light, number> = { GREEN: 0, AMBER: 1, RED: 2 };

/** A contact this recent means somebody at JOC is already mid-conversation. */
export const RECENT_CONTACT_DAYS = 30;

const CONTACT_TYPES = ["CALL", "EMAIL", "MEETING", "VISIT"] as const;

const CONTACT_WORD: Record<string, string> = {
  CALL: "called",
  EMAIL: "emailed",
  MEETING: "met",
  VISIT: "visited",
};

const day = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/**
 * What the rules say about one school and one program.
 *
 * Pure, and takes everything it needs as an argument, so the whole of it can
 * be read in one go and tested without a database.
 */
export type RuleInput = {
  /** Programs this school is already active in, other than the one being asked about. */
  otherPrograms: { name: string; lead: string | null }[];
  /** The most recent time anybody at JOC spoke to this school. */
  lastContact: { type: string; by: string | null; at: Date } | null;
};

export function ruleLightFor(s: RuleInput, now = Date.now()): { light: Light; reason: string } {
  // Already running something of ours. Whoever runs that program owns the
  // relationship this term, so a second program goes through them.
  const other = s.otherPrograms[0];
  if (other) {
    const rest = s.otherPrograms.length - 1;
    return {
      light: "AMBER",
      reason:
        `Already in ${other.name}` +
        (other.lead ? `, run by ${other.lead}` : ", which has no lead down for it") +
        (rest > 0 ? ` (and ${rest} other JOC program${rest === 1 ? "" : "s"})` : "") +
        ". Talk to them before you introduce another program.",
    };
  }

  // Somebody was in touch recently. Two calls from JOC in a month reads as
  // one organisation that does not talk to itself.
  if (s.lastContact) {
    const days = Math.floor((now - new Date(s.lastContact.at).getTime()) / 86_400_000);
    if (days <= RECENT_CONTACT_DAYS) {
      const verb = CONTACT_WORD[s.lastContact.type] ?? "spoke to";
      return {
        light: "AMBER",
        reason:
          `${s.lastContact.by ?? "Somebody at JOC"} ${verb} them on ${day(s.lastContact.at)}` +
          `, ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}. ` +
          "Check where that got to first.",
      };
    }
  }

  return {
    light: "GREEN",
    reason: "Not in any JOC program, and nobody here has been in touch in the last month.",
  };
}

// ─── Recomputing ─────────────────────────────────────────────────────────────

export type RecomputeResult = {
  ok: boolean;
  /** Rows written by the rules. */
  written: number;
  /** Manual lights whose `until` had passed and which went back to the rules. */
  expired: number;
  error?: string;
};

/**
 * Work out every school's light for every program, and write the ones the
 * rules own.
 *
 * Runs nightly and whenever somebody asks for it. A manual light is never
 * touched unless its `until` has passed — a person's decision outranks a rule,
 * and a rule that could quietly undo one would be worse than no rule.
 */
export async function recomputeProgramLights(now = new Date()): Promise<RecomputeResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, written: 0, expired: 0, error: "No database is configured." };
  }

  try {
    // A manual light whose time is up goes back to the rules. It is only
    // deleted once, and the row it leaves behind is rewritten below.
    const lapsed = await prisma.schoolProgramLight.findMany({
      where: { source: "MANUAL", until: { not: null, lte: now } },
      select: { id: true },
    });
    if (lapsed.length > 0) {
      await prisma.schoolProgramLight.updateMany({
        where: { id: { in: lapsed.map((l) => l.id) } },
        // Kept, not deleted: whoever set it still has to be told, and
        // expiryToldAt is how the console knows it has not told them.
        data: { source: "RULE", until: null },
      });
    }

    const [programs, schools] = await Promise.all([
      prisma.programPage.findMany({
        select: {
          id: true, name: true, formId: true,
          leads: { select: { name: true, email: true } },
        },
      }),
      prisma.school.findMany({ select: { id: true } }),
    ]);

    if (programs.length === 0 || schools.length === 0) {
      return { ok: true, written: 0, expired: lapsed.length };
    }

    const leadName = (p: (typeof programs)[number]) => {
      const l = p.leads[0];
      return l ? l.name ?? l.email : null;
    };

    /** "schoolId:programId" for every pair that is already in. */
    const inProgram = await allEnrolledPairs();

    // The last time anybody at JOC was in touch, per school.
    const since = new Date(now.getTime() - RECENT_CONTACT_DAYS * 86_400_000);
    const contacts = await prisma.schoolActivity.findMany({
      where: { type: { in: [...CONTACT_TYPES] }, occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      select: {
        schoolId: true, type: true, occurredAt: true,
        author: { select: { name: true, email: true } },
      },
    });
    const lastContact = new Map<string, RuleInput["lastContact"]>();
    for (const c of contacts) {
      if (lastContact.has(c.schoolId)) continue;
      lastContact.set(c.schoolId, {
        type: c.type,
        by: c.author ? c.author.name ?? c.author.email : null,
        at: c.occurredAt,
      });
    }

    // Rows the rules may not touch.
    const manual = await prisma.schoolProgramLight.findMany({
      where: { source: "MANUAL" },
      select: { schoolId: true, programId: true },
    });
    const untouchable = new Set(manual.map((m) => `${m.schoolId}:${m.programId}`));

    let written = 0;
    const writes: Promise<unknown>[] = [];

    for (const school of schools) {
      const others = programs
        .filter((p) => inProgram.has(`${school.id}:${p.id}`))
        .map((p) => ({ id: p.id, name: p.name, lead: leadName(p) }));

      for (const p of programs) {
        const key = `${school.id}:${p.id}`;
        if (untouchable.has(key)) continue;

        const { light, reason } = ruleLightFor(
          {
            otherPrograms: others.filter((o) => o.id !== p.id).map(({ name, lead }) => ({ name, lead })),
            lastContact: lastContact.get(school.id) ?? null,
          },
          now.getTime(),
        );

        written++;
        writes.push(
          prisma.schoolProgramLight.upsert({
            where: { schoolId_programId: { schoolId: school.id, programId: p.id } },
            create: { schoolId: school.id, programId: p.id, light, reason, source: "RULE", setAt: now },
            // setById and expiryToldAt are left alone on purpose. On a row
            // whose manual light has just lapsed they are the only record of
            // who still has to be told about it.
            update: { light, reason, source: "RULE", setAt: now, until: null },
          }),
        );
      }
    }

    // In batches, so a hundred schools does not open a hundred connections.
    for (let i = 0; i < writes.length; i += 25) {
      await Promise.all(writes.slice(i, i + 25));
    }

    return { ok: true, written, expired: lapsed.length };
  } catch (e) {
    return { ok: false, written: 0, expired: 0, error: e instanceof Error ? e.message : "The lights could not be worked out." };
  }
}

/**
 * Redo one school's lights, now.
 *
 * Called the moment something the rules read actually changes — somebody logs
 * a call, or a school joins a program. Waiting until tonight would leave a
 * second coordinator looking at a green light on a school that was rung an
 * hour ago, which is exactly the collision this is here to stop.
 *
 * Quiet on failure on purpose: it hangs off other people's actions, and a
 * light that is a few hours stale is not a reason to fail the thing they were
 * actually doing.
 */
export async function recomputeSchoolLights(schoolId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;

  try {
    const now = new Date();
    const programs = await prisma.programPage.findMany({
      select: { id: true, name: true, formId: true, leads: { select: { name: true, email: true } } },
    });
    if (programs.length === 0) return;

    const [enrolled, contact, manual] = await Promise.all([
      prisma.programEnrollment.findMany({
        where: { schoolId, stage: { in: ["MEETING_BOOKED","REGISTERED","MATERIALS_SENT","TRAINED","LAUNCHED","RUNNING","PAUSED"] } },
        select: { programId: true },
      }),
      prisma.schoolActivity.findFirst({
        where: {
          schoolId,
          type: { in: [...CONTACT_TYPES] },
          occurredAt: { gte: new Date(now.getTime() - RECENT_CONTACT_DAYS * 86_400_000) },
        },
        orderBy: { occurredAt: "desc" },
        select: { type: true, occurredAt: true, author: { select: { name: true, email: true } } },
      }),
      prisma.schoolProgramLight.findMany({
        where: { schoolId, source: "MANUAL" },
        select: { programId: true },
      }),
    ]);

    const inProgram = new Set(enrolled.map((e) => e.programId));
    const untouchable = new Set(manual.map((m) => m.programId));

    const lastContact = contact
      ? {
          type: contact.type,
          by: contact.author ? contact.author.name ?? contact.author.email : null,
          at: contact.occurredAt,
        }
      : null;

    const others = programs
      .filter((p) => inProgram.has(p.id))
      .map((p) => ({ id: p.id, name: p.name, lead: p.leads[0] ? p.leads[0].name ?? p.leads[0].email : null }));

    for (const p of programs) {
      if (untouchable.has(p.id)) continue;
      const { light, reason } = ruleLightFor(
        {
          otherPrograms: others.filter((o) => o.id !== p.id).map(({ name, lead }) => ({ name, lead })),
          lastContact,
        },
        now.getTime(),
      );
      await prisma.schoolProgramLight.upsert({
        where: { schoolId_programId: { schoolId, programId: p.id } },
        create: { schoolId, programId: p.id, light, reason, source: "RULE", setAt: now },
        update: { light, reason, source: "RULE", setAt: now, until: null },
      });
    }
  } catch {
    // Left stale rather than breaking whatever called this.
  }
}
