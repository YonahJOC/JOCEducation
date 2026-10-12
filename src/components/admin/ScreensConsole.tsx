import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isScreenStaff } from "@/lib/school-screen/access";
import { ScreensList, type ScreenRow } from "./ScreensList";

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
export async function ScreensConsole({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  const me = session?.user;
  const staff = isScreenStaff(me);
  const lobby = openForReview || can(me, "lobby");
  if (!staff) return <>{children}</>;

  const schools = isDatabaseConfigured()
    ? await prisma.school.findMany({
        where: { isTest: false },
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

  const rows: ScreenRow[] = schools.map((s) => ({
    id: s.id, slug: s.slug, name: s.name, up: Boolean(s.liveScreenUrl),
    waiting: s._count.shoutOuts + s._count.screenPhotos + s._count.screenFlyers,
  }));

  return (
    <div className="joc-bleed joc-screens">
      <ScreensList rows={rows} lobby={lobby} />
      <div className="joc-screens-main">{children}</div>
    </div>
  );
}
