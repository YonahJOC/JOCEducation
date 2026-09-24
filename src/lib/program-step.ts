import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import type { Stage } from "@/lib/program-enrollment";

/**
 * Where a school has got to on one program, as a step out of four.
 *
 * The console thinks in nine enrollment stages, because the people running
 * the programs need that much detail. A school looking at a program page
 * needs one number and one sentence: where am I, and what happens next. This
 * is the mapping between the two, in one place, so the public page and the
 * console can never disagree about it.
 */

export const STEPS = 4;

/** The brief's mapping, verbatim. */
export function stepFor(stage: Stage): number {
  switch (stage) {
    case "INTRODUCED":
    case "MEETING_BOOKED":
      return 1;
    case "REGISTERED":
      return 2;
    case "MATERIALS_SENT":
      return 3;
    default:
      // TRAINED, LAUNCHED, RUNNING, PAUSED, ENDED.
      return 4;
  }
}

/** The short word under the step number. */
export const STEP_SHORT: Record<number, string> = {
  1: "TALK",
  2: "REGISTER",
  3: "PREPARE",
  4: "RUN IT",
};

export const STEP_TITLE: Record<number, string> = {
  1: "Talk it through",
  2: "Register your school",
  3: "Get everything you need",
  4: "Run it",
};

/**
 * What happens next, per step, in one line.
 *
 * Written to the school rather than about them: "we will send you" rather
 * than "materials pending".
 */
export const STEP_NEXT: Record<number, string> = {
  1: "Someone from JOC will talk it through with you and answer whatever you want to ask.",
  2: "Fill in the sign-up form and we will know your school is coming.",
  3: "Everything you need to run it is on its way to you.",
  4: "It is yours to run. Your coordinator is there when you want them.",
};

export type SchoolStep = {
  step: number;
  stage: Stage;
  /** Whether it has actually run there yet. */
  startedAt: Date | null;
  schoolName: string;
};

/**
 * The signed-in person's school on this program, if there is one.
 *
 * Returns null for a visitor, for somebody with no school, and for a school
 * that has never been introduced to this program — all three of which see the
 * same signed-out card, because "we have not started" is one state rather
 * than three.
 */
export async function myStepOn(slug: string): Promise<SchoolStep | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const session = await safeAuth();
    const schoolId = session?.user?.schoolId;
    if (!schoolId) return null;

    // The public page works from a slug, because a program's rows are
    // editable and its id is not something the page should have to know.
    const program = await prisma.programPage.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!program) return null;

    const row = await prisma.programEnrollment.findUnique({
      where: { schoolId_programId: { schoolId, programId: program.id } },
      select: { stage: true, startedAt: true, school: { select: { name: true } } },
    });
    if (!row) return null;

    return {
      step: stepFor(row.stage as Stage),
      stage: row.stage as Stage,
      startedAt: row.startedAt,
      schoolName: row.school.name,
    };
  } catch {
    return null;
  }
}

/**
 * What a school does next, per step, and where.
 *
 * One table, used by the public program page's next-step card and by the
 * school's own program page (5c). The two said different things for a while,
 * which is the kind of disagreement nobody notices until a school acts on
 * the wrong one.
 *
 * `href` is null where the next move is ours rather than theirs. The card
 * then shows the sentence with no button, which is honest: a button that
 * opens a page where nothing can be done is worse than no button.
 */
export const STEP_ACTION: Record<number, { label: string; href: string | null }> = {
  1: { label: "Book a 20-minute meeting", href: "/contact" },
  2: { label: "Fill in the sign-up form", href: null },
  3: { label: "See what's coming to you", href: null },
  4: { label: "Open your dates", href: null },
};
