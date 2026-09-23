"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can } from "@/lib/access";
import { recomputeProgramLights, recomputeSchoolLights, LIGHT_LABEL, type Light } from "@/lib/program-lights";
import { nextMeeting } from "@/lib/program-traffic";

/**
 * Acting on the traffic light.
 *
 * Three things happen here and nothing else: a coordinator records that they
 * reached out, a coordinator puts a school on the next admin meeting, and
 * somebody with the permission changes a light.
 *
 * Nothing in this file sends anything to a school. "Reach out" writes down
 * what the coordinator did after they did it; the meeting and the lights are
 * internal. There is no new send path here, on purpose.
 */

type Result = { ok: true; message: string } | { ok: false; error: string };

/**
 * Who may work this program's list.
 *
 * Being down as a lead of the program is the permission — a coordinator holds
 * no capability at all, and asking for one would lock every one of them out
 * of the page built for them. Anyone who runs programs or school accounts
 * across JOC gets in too.
 */
async function requireProgram(programId: number) {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  const session = await safeAuth();
  const me = session?.user ?? null;

  if (openForReview) return me;

  const lead = me?.id
    ? (await prisma.programPage.count({ where: { id: programId, leads: { some: { id: me.id } } } })) > 0
    : false;

  if (lead || can(me, "programs") || can(me, "schools") || can(me, "set_program_light")) return me;
  throw new Error("You are not down as running this program.");
}

async function requireSetLight() {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "set_program_light")) {
    throw new Error("Changing a light needs the traffic-light permission.");
  }
  return session?.user ?? null;
}

const clock = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const day = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

function refresh(slug?: string) {
  revalidatePath("/admin/my-programs");
  revalidatePath("/admin/meetings");
  if (slug) revalidatePath(`/admin/programs/${slug}`);
}

// ─── Green: reach out ────────────────────────────────────────────────────────

export type Channel = "CALL" | "EMAIL" | "VISIT";

const CHANNEL_WORD: Record<Channel, string> = {
  CALL: "call",
  EMAIL: "email",
  VISIT: "in person",
};

/**
 * Record that the coordinator introduced the program.
 *
 * Written to the school's own activity log — the same log the account team
 * reads — so the next person to pick up this school can see it happened. It
 * is written after the fact: the portal did not make the call.
 */
export async function reachOut(
  programId: number,
  slug: string,
  schoolId: string,
  channel: Channel,
  notes: string,
): Promise<Result> {
  try {
    const me = await requireProgram(programId);
    if (!CHANNEL_WORD[channel]) return { ok: false, error: "Say how you reached out." };

    const program = await prisma.programPage.findUnique({
      where: { id: programId },
      select: { name: true },
    });
    if (!program) return { ok: false, error: "That program no longer exists." };

    const text = notes.trim();
    const at = new Date();
    await prisma.schoolActivity.create({
      data: {
        schoolId,
        type: channel,
        // The program is named in the summary so the school's own history
        // reads as a sentence, and so this page can find its own work again.
        summary: `${program.name} — reached out by ${CHANNEL_WORD[channel]}`,
        detail: text || null,
        authorId: me?.id ?? null,
        occurredAt: at,
      },
    });

    // The school joins this program's list at its first stage. It was on the
    // "nobody has reached them" list a second ago, and it should not still be
    // on it after somebody has.
    await prisma.programEnrollment.upsert({
      where: { schoolId_programId: { schoolId, programId } },
      create: {
        schoolId, programId, stage: "INTRODUCED", stageSince: at,
        note: `Introduced by ${CHANNEL_WORD[channel]}` + (text ? ` — ${text}` : ""),
      },
      // Already somewhere further along; reaching out again does not undo it.
      update: {},
    });

    // Every other program's console now shows this school as discuss-first,
    // which is the whole point of writing it down.
    await recomputeSchoolLights(schoolId);

    refresh(slug);
    return {
      ok: true,
      message:
        `Reached out at ${clock(at)} · ${CHANNEL_WORD[channel]}` +
        (text ? " · notes saved to the school's activity log" : " · saved to the school's activity log"),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that." };
  }
}

// ─── Orange and red: the admin meeting ───────────────────────────────────────

export type AgendaKind = "REVIEW" | "SEND_FOR_REVIEW" | "SUGGEST_APPEAL";

/**
 * Put a school on the next admin meeting.
 *
 * Refuses when no meeting is booked rather than inventing one. An item filed
 * against a meeting that does not exist is an item nobody ever reads, and the
 * coordinator would have gone away believing it was dealt with.
 */
export async function sendToMeeting(
  programId: number,
  slug: string,
  schoolId: string,
  kind: AgendaKind,
  note: string,
): Promise<Result> {
  try {
    const me = await requireProgram(programId);

    const text = note.trim();
    if (!text) return { ok: false, error: "Say what you want discussed — a line is enough." };

    const meeting = await nextMeeting();
    if (!meeting) {
      return { ok: false, error: "No admin meeting is booked, so there is nothing to add this to." };
    }

    const light = await prisma.schoolProgramLight.findUnique({
      where: { schoolId_programId: { schoolId, programId } },
      select: { light: true },
    });

    await prisma.adminMeetingItem.create({
      data: {
        meetingId: meeting.id,
        schoolId,
        programId,
        light: light?.light ?? "AMBER",
        kind,
        note: text,
        createdById: me?.id ?? null,
      },
    });

    refresh(slug);
    return { ok: true, message: `On the agenda for ${day(meeting.meetsAt)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add that." };
  }
}

// ─── Changing a light ────────────────────────────────────────────────────────

/**
 * Overrule the rules on one school.
 *
 * A manual light beats every rule and stays until somebody changes it or its
 * date passes. A reason is required: a red light with no reason is a school
 * nobody can ever argue back for.
 *
 * `allPrograms` writes the same light against every program, which is what
 * "hold off on this school entirely" means. It is still one row per program,
 * so a single program can be let back in later without unpicking anything.
 */
export async function setLight(
  programId: number,
  slug: string,
  schoolId: string,
  light: Light,
  reason: string,
  opts: { until?: string | null; allPrograms?: boolean } = {},
): Promise<Result> {
  try {
    const me = await requireSetLight();

    const text = reason.trim();
    if (!text) return { ok: false, error: "Say why. A light with no reason cannot be argued with." };
    if (!LIGHT_LABEL[light]) return { ok: false, error: "That is not one of the three lights." };

    let until: Date | null = null;
    if (opts.until) {
      const d = new Date(`${opts.until}T12:00:00`);
      if (Number.isNaN(d.getTime())) return { ok: false, error: "That date could not be read." };
      if (d.getTime() < Date.now()) return { ok: false, error: "That date has already passed." };
      until = d;
    }

    const programIds = opts.allPrograms
      ? (await prisma.programPage.findMany({ select: { id: true } })).map((p) => p.id)
      : [programId];

    const now = new Date();
    for (const pid of programIds) {
      await prisma.schoolProgramLight.upsert({
        where: { schoolId_programId: { schoolId, programId: pid } },
        create: {
          schoolId, programId: pid, light, reason: text,
          source: "MANUAL", setById: me?.id ?? null, setAt: now, until,
        },
        update: {
          light, reason: text,
          source: "MANUAL", setById: me?.id ?? null, setAt: now, until,
          // A fresh decision, so the expiry notice for the last one is spent.
          expiryToldAt: null,
        },
      });
    }

    // The audit trail lives on the school, where the account team reads it.
    await prisma.schoolActivity.create({
      data: {
        schoolId,
        type: "STATUS_CHANGE",
        summary:
          `Traffic light set to "${LIGHT_LABEL[light]}"` +
          (opts.allPrograms ? " for every program" : "") +
          (until ? ` until ${day(until)}` : ""),
        detail: text,
        authorId: me?.id ?? null,
        occurredAt: now,
      },
    });

    refresh(slug);
    return {
      ok: true,
      message: `Set to "${LIGHT_LABEL[light]}"${until ? ` until ${day(until)}` : ""}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not change that light." };
  }
}

/** Mark an expiry notice read, so it stops being shown. */
export async function dismissExpiry(lightId: string, slug: string): Promise<Result> {
  try {
    const session = await safeAuth();
    const meId = session?.user?.id ?? null;
    // Only the person it is addressed to can clear it.
    const { count } = await prisma.schoolProgramLight.updateMany({
      where: { id: lightId, ...(meId ? { setById: meId } : {}) },
      data: { expiryToldAt: new Date() },
    });
    if (count === 0) return { ok: false, error: "That notice is not yours to clear." };
    refresh(slug);
    return { ok: true, message: "Cleared." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not clear that." };
  }
}

/** Run the rules now rather than waiting for tonight. */
export async function refreshLights(slug?: string): Promise<Result> {
  try {
    await requireSetLight();
    const r = await recomputeProgramLights();
    if (!r.ok) return { ok: false, error: r.error ?? "The lights could not be worked out." };
    refresh(slug);
    return {
      ok: true,
      message:
        `Checked ${r.written} school and program pair${r.written === 1 ? "" : "s"}` +
        (r.expired > 0 ? ` · ${r.expired} manual light${r.expired === 1 ? "" : "s"} ran out` : ""),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not run the rules." };
  }
}

// ─── The meeting itself ──────────────────────────────────────────────────────

async function requireAgenda() {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "run_admin_agenda")) {
    throw new Error("Running the meeting needs the admin meeting permission.");
  }
  return session?.user ?? null;
}

export async function scheduleMeeting(date: string, note: string): Promise<Result> {
  try {
    await requireAgenda();
    const d = new Date(`${date}T12:00:00`);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "That date could not be read." };

    await prisma.adminMeeting.create({ data: { meetsAt: d, note: note.trim() || null } });
    refresh();
    return { ok: true, message: `Meeting booked for ${day(d)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not book that." };
  }
}

export type Outcome = "KEEP_LIGHT" | "CHANGE_LIGHT" | "CLOSED";

/**
 * What the meeting decided about one school.
 *
 * "Change the light" actually changes it, here, rather than leaving somebody
 * to remember afterwards — a decision that only exists in the minutes is a
 * decision the coordinator never sees.
 */
export async function decideItem(
  itemId: string,
  outcome: Outcome,
  note: string,
  newLight?: Light,
): Promise<Result> {
  try {
    const me = await requireAgenda();
    const text = note.trim();

    const item = await prisma.adminMeetingItem.findUnique({
      where: { id: itemId },
      select: { schoolId: true, programId: true, program: { select: { slug: true } } },
    });
    if (!item) return { ok: false, error: "That item is no longer on the agenda." };

    if (outcome === "CHANGE_LIGHT") {
      if (!newLight || !LIGHT_LABEL[newLight]) return { ok: false, error: "Say which light it becomes." };
      if (!text) return { ok: false, error: "Changing a light needs a reason." };

      const now = new Date();
      await prisma.schoolProgramLight.upsert({
        where: { schoolId_programId: { schoolId: item.schoolId, programId: item.programId } },
        create: {
          schoolId: item.schoolId, programId: item.programId, light: newLight,
          reason: text, source: "MANUAL", setById: me?.id ?? null, setAt: now,
        },
        update: {
          light: newLight, reason: text, source: "MANUAL",
          setById: me?.id ?? null, setAt: now, until: null, expiryToldAt: null,
        },
      });
      await prisma.schoolActivity.create({
        data: {
          schoolId: item.schoolId,
          type: "STATUS_CHANGE",
          summary: `Admin meeting set the traffic light to "${LIGHT_LABEL[newLight]}"`,
          detail: text,
          authorId: me?.id ?? null,
          occurredAt: now,
        },
      });
    }

    await prisma.adminMeetingItem.update({
      where: { id: itemId },
      data: {
        outcome,
        outcomeNote: text || null,
        outcomeAt: new Date(),
        outcomeById: me?.id ?? null,
      },
    });

    refresh(item.program.slug);
    return { ok: true, message: "Decision recorded." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not record that." };
  }
}

export async function closeMeeting(meetingId: string): Promise<Result> {
  try {
    await requireAgenda();
    await prisma.adminMeeting.update({
      where: { id: meetingId },
      data: { closedAt: new Date() },
    });
    refresh();
    return { ok: true, message: "Meeting closed. New items go to the next one." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not close that." };
  }
}
