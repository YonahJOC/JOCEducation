import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import type { Stage } from "@/lib/program-enrollment";

/**
 * How much of this site a school has.
 *
 * Until now there were two states — a subscription opened the materials, and
 * everything else was the public site. The rollout is a third: schools JOC
 * already works with, running one program or several, who get that program
 * and nothing else until the full site is opened to them.
 *
 * It is derived rather than switched. One date per school decides whether the
 * full site is open; everything else follows from the programs they are
 * actually running, so there is no flag for anybody to forget.
 *
 *   FULL_SITE  the site was launched for them and their subscription is live
 *   PROGRAMS   they run at least one live program — every school today
 *   PUBLIC     signed in, running nothing, and not launched
 */

export type AccessState = "FULL_SITE" | "PROGRAMS" | "PUBLIC";

/**
 * A live program: registered or further, and not finished.
 *
 * Introduced and Meeting booked are conversations, not programs — a school
 * JOC is talking to has not started anything, and opening a portal to them
 * would be telling them they have.
 */
const LIVE: Stage[] = ["REGISTERED", "MATERIALS_SENT", "TRAINED", "LAUNCHED", "RUNNING", "PAUSED"];

export type SchoolAccess = {
  state: AccessState;
  /** The programs this school actually runs, furthest along first. */
  programs: { id: number; slug: string; name: string; heroColor: string; stage: Stage }[];
};

const NOTHING: SchoolAccess = { state: "PUBLIC", programs: [] };

/** What one school has, and which programs it is. */
export async function schoolAccess(schoolId: string | null): Promise<SchoolAccess> {
  if (!schoolId || !isDatabaseConfigured()) return NOTHING;

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        fullSiteLaunchedAt: true,
        subscription: { select: { status: true } },
        enrollments: {
          where: { stage: { in: LIVE } },
          select: {
            stage: true,
            program: { select: { id: true, slug: true, name: true, heroColor: true } },
          },
        },
      },
    });

    if (!school) return NOTHING;

    const programs = school.enrollments
      .map((e) => ({ ...e.program, stage: e.stage as Stage }))
      .sort((a, b) => LIVE.indexOf(b.stage) - LIVE.indexOf(a.stage) || a.name.localeCompare(b.name));

    // The launch date alone does not open the site. A school whose plan has
    // lapsed is back on its programs, not shut out of everything.
    const live = school.subscription?.status === "ACTIVE" || school.subscription?.status === "TRIALING";
    if (school.fullSiteLaunchedAt && live) return { state: "FULL_SITE", programs };

    return { state: programs.length > 0 ? "PROGRAMS" : "PUBLIC", programs };
  } catch {
    return NOTHING;
  }
}

/**
 * May this person open this program's own pages?
 *
 * The capability question the screens ask, so none of them asks about a role.
 * A school on the full site can open everything; a school on its programs can
 * open the ones it runs; anybody else can open none.
 */
export function canOpenProgram(access: SchoolAccess, slug: string): boolean {
  if (access.state === "FULL_SITE") return true;
  return access.programs.some((p) => p.slug === slug);
}

/** Everything that is not a program: lessons, resources, cycles, the board. */
export function canOpenLibrary(access: SchoolAccess): boolean {
  return access.state === "FULL_SITE";
}
