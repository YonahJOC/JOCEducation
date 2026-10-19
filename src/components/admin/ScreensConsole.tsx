import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import type { Prisma } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isScreenStaff } from "@/lib/school-screen/access";
import { ScreensList, type ScreenRow } from "./ScreensList";
import { LOBBY_SLUG } from "@/lib/lobby/slug";

/**
 * Live screens: one console for every TV JOC looks after.
 *
 * The lobby's and each school's down the left, each with its switch and
 * what is waiting on it; whichever is chosen fills the right. It used to be
 * two pages behind two tabs, with every school's switch and way in at the
 * far end of a long row — the wrong side of the screen for a list somebody
 * works down.
 *
 * Somebody who keeps only the lobby TV gets the lobby panel and no list:
 * a column with one entry in it would be furniture.
 */
/**
 * Which schools this console is about.
 *
 * Test schools stay out, with one exception: a school on the demo portal.
 * Its screen is the thing being shown to people this month, so it is the
 * screen somebody here most needs to open — and demo schools are test
 * schools by construction, which left the rollout with no way in from the
 * console it is run from.
 *
 * Exported because the page above this draws a "screens up" tile from the
 * same set. Counted with a different filter, the tile said "0 of 43" over a
 * list of 44, and the first person to notice would have gone looking for a
 * bug in the switch.
 */
/** The schools, with our own lobby wall left out: it has its own row. */
export const SCREEN_CONSOLE_LIST: Prisma.SchoolWhereInput = {
  AND: [{ OR: [{ isTest: false }, { demoAt: { not: null } }] }, { slug: { not: LOBBY_SLUG } }],
};

export const SCREEN_CONSOLE_SCHOOLS: Prisma.SchoolWhereInput = {
  OR: [
    { isTest: false },
    { demoAt: { not: null } },
    // JOC's own lobby wall. It is a school in the database so that it can
    // use a school's screen, and flagged isTest so it stays out of every
    // count — which also hid it here, leaving its shout-outs with nowhere
    // to be approved from.
    { slug: LOBBY_SLUG },
  ],
};

export async function ScreensConsole({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  const me = session?.user;
  const staff = isScreenStaff(me);
  const lobby = openForReview || can(me, "lobby");
  if (!staff) return <>{children}</>;

  const schools = isDatabaseConfigured()
    ? await prisma.school.findMany({
        where: SCREEN_CONSOLE_SCHOOLS,
        orderBy: { name: "asc" },
        select: {
          id: true, slug: true, name: true, liveScreenUrl: true,
          _count: {
            select: {
              shoutOuts: { where: { status: "PENDING" } },
              screenPhotos: { where: { status: "PENDING" } },
              screenFlyers: { where: { status: "PENDING" } },
            },
          },
        },
      }).catch(() => [])
    : [];

  const all: ScreenRow[] = schools.map((s) => ({
    id: s.id, slug: s.slug, name: s.name, up: Boolean(s.liveScreenUrl),
    waiting: s._count.shoutOuts + s._count.screenPhotos + s._count.screenFlyers,
  }));

  /**
   * Our own wall comes out of the alphabet.
   *
   * It is a school row like any other, which put it twenty-second of
   * forty-five under the name "Just One Chesed" — so somebody looking for
   * the lobby's shout-outs scrolled a list of schools and did not find
   * anything that looked like the lobby. It goes at the top now, next to
   * the panel it belongs with, and is not left in the list twice.
   */
  const rows = all.filter((r) => r.slug !== LOBBY_SLUG);
  const own = all.find((r) => r.slug === LOBBY_SLUG) ?? null;

  return (
    <div className="joc-bleed joc-screens">
      <ScreensList rows={rows} own={own} lobby={lobby} />
      <div className="joc-screens-main">{children}</div>
    </div>
  );
}
