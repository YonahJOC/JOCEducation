"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Editing the JOC App clients board.
 *
 * Named app-board rather than board: actions/board.ts is the Teachers' Board,
 * which is teachers talking to teachers and nothing to do with this.
 *
 * Every action guards itself on the Schools capability. The page guards too,
 * but a page guard is a locked door with the window open — these are what
 * actually stop somebody posting to an endpoint.
 *
 * Nothing here sends anything to a school.
 */

export type BoardResult = { ok: true } | { ok: false; error: string };

const BOARD = "/admin/schools/board";

async function mayEdit(): Promise<boolean> {
  if (openForReview) return true;
  const session = await safeAuth();
  return can(session?.user, "schools");
}

async function guard(): Promise<BoardResult | null> {
  if (!(await mayEdit())) return { ok: false, error: "That isn't yours to change." };
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  return null;
}

/** The status column. */
export async function setSchoolStatus(schoolId: string, statusId: string | null): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: { boardStatusId: statusId || null },
    });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Who owns the relationship. */
export async function setSchoolOwner(schoolId: string, userId: string | null): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: { accountManagerId: userId || null },
    });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function setSchoolNetwork(schoolId: string, network: string | null): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const allowed = ["YESHIVA_LEAGUE", "ISRAEL", "CANADA"];
  const value = network && allowed.includes(network) ? network : null;

  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: { network: value as never },
    });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function setSchoolType(schoolId: string, type: string): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const allowed = ["DAY_SCHOOL", "MIDDLE_SCHOOL", "YESHIVA", "SEMINARY", "CHEDER", "HIGH_SCHOOL", "OTHER"];
  if (!allowed.includes(type)) return { ok: false, error: "Not a kind of school we know." };

  try {
    await prisma.school.update({ where: { id: schoolId }, data: { type: type as never } });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** One of JOC's own columns, for one school. */
export async function setFieldValue(
  fieldId: string,
  schoolId: string,
  value: string,
): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const text = value.trim();

  try {
    if (!text) {
      await prisma.boardFieldValue.deleteMany({ where: { fieldId, schoolId } });
    } else {
      await prisma.boardFieldValue.upsert({
        where: { fieldId_schoolId: { fieldId, schoolId } },
        create: { fieldId, schoolId, value: text.slice(0, 300) },
        update: { value: text.slice(0, 300) },
      });
    }
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Renaming a column header. */
export async function renameField(fieldId: string, label: string): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const text = label.trim();
  if (!text) return { ok: false, error: "A column needs a name." };

  try {
    await prisma.boardField.update({ where: { id: fieldId }, data: { label: text.slice(0, 60) } });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function addField(label: string): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const text = label.trim();
  if (!text) return { ok: false, error: "Give the column a name." };

  try {
    const last = await prisma.boardField.findFirst({ orderBy: { sort: "desc" } });
    await prisma.boardField.create({
      data: { label: text.slice(0, 60), sort: (last?.sort ?? -1) + 1 },
    });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** A one-off tick. Ticking records today; unticking removes the row. */
export async function setCheck(
  checkId: string,
  schoolId: string,
  ticked: boolean,
): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  try {
    if (!ticked) {
      await prisma.boardCheckMark.deleteMany({ where: { checkId, schoolId } });
    } else {
      const session = await safeAuth();
      await prisma.boardCheckMark.upsert({
        where: { checkId_schoolId: { checkId, schoolId } },
        create: { checkId, schoolId, byId: session?.user?.id ?? undefined, imported: false },
        update: { at: new Date(), byId: session?.user?.id ?? undefined, imported: false },
      });
    }
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function addCheck(label: string): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const text = label.trim();
  if (!text) return { ok: false, error: "Give the check a name." };

  try {
    const last = await prisma.boardCheck.findFirst({ orderBy: { sort: "desc" } });
    await prisma.boardCheck.create({
      data: { label: text.slice(0, 60), sort: (last?.sort ?? -1) + 1 },
    });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** The statuses themselves: rename, recolour, reorder, add, remove. */
export async function saveStatus(
  id: string | null,
  label: string,
  tone: string,
): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  const text = label.trim();
  if (!text) return { ok: false, error: "A status needs a name." };

  const tones = ["green", "orange", "red", "blue", "ink"];
  const colour = tones.includes(tone) ? tone : "ink";

  try {
    if (id) {
      await prisma.boardStatus.update({ where: { id }, data: { label: text.slice(0, 40), tone: colour } });
    } else {
      const last = await prisma.boardStatus.findFirst({ orderBy: { sort: "desc" } });
      await prisma.boardStatus.create({
        data: { label: text.slice(0, 40), tone: colour, sort: (last?.sort ?? -1) + 1 },
      });
    }
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function moveStatus(id: string, direction: "up" | "down"): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  try {
    const all = await prisma.boardStatus.findMany({ orderBy: { sort: "asc" } });
    const i = all.findIndex((s) => s.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return { ok: true };

    await prisma.$transaction([
      prisma.boardStatus.update({ where: { id: all[i].id }, data: { sort: j } }),
      prisma.boardStatus.update({ where: { id: all[j].id }, data: { sort: i } }),
    ]);
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/**
 * Removing a status.
 *
 * Refused while any school is on it. Deleting would silently blank that
 * column for them, and a board that loses data when somebody tidies it is a
 * board nobody tidies.
 */
export async function deleteStatus(id: string): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  try {
    const used = await prisma.school.count({ where: { boardStatusId: id } });
    if (used > 0) {
      return {
        ok: false,
        error: `${used} school${used === 1 ? " is" : "s are"} on this status. Move them first.`,
      };
    }
    await prisma.boardStatus.delete({ where: { id } });
    revalidatePath(BOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't delete." };
  }
}

/** The student list's state, and why it is stuck. */
export async function setStudentList(
  schoolId: string,
  state: "NOT_SENT" | "UPLOADED" | "STUCK",
  note?: string,
): Promise<BoardResult> {
  const no = await guard();
  if (no) return no;

  if (state === "STUCK" && !note?.trim()) {
    return { ok: false, error: "Say what is wrong with it, so the school can fix it." };
  }

  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        studentListState: state,
        studentListNote: state === "STUCK" ? note!.trim().slice(0, 300) : null,
        // Kept in step, because the status board and the school's Today both
        // read studentListAt rather than the state.
        studentListAt: state === "UPLOADED" ? new Date() : state === "NOT_SENT" ? null : undefined,
      },
    });
    revalidatePath(BOARD);
    revalidatePath("/school");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}
