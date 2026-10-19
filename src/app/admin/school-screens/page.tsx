import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isScreenStaff } from "@/lib/school-screen/access";
import { ScreensConsole, SCREEN_CONSOLE_LIST } from "@/components/admin/ScreensConsole";
import { C, F, R, T, pageTitle } from "@/lib/joc-tokens";

/**
 * Live screens, with no one school chosen: where things stand across all of
 * them. The schools themselves, with their switches, are down the left.
 */

export const metadata = { title: "School screens — JOC Console" };
export const dynamic = "force-dynamic";

export default async function SchoolScreensPage() {
  const session = await safeAuth();
  if (!isScreenStaff(session?.user)) {
    return (
      <div style={{ padding: "40px 26px", maxWidth: "520px" }}>
        <h1 style={{ ...pageTitle, color: C.ink, marginBottom: "10px" }}>School screens aren&rsquo;t yours</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted }}>
          Looking after the schools&rsquo; screens needs the <strong style={{ color: C.ink }}>schools</strong> permission.
          A super admin can give it to you in People &amp; access.
        </p>
      </div>
    );
  }

  const [schools, up, flyers, photos, shouts, lastSync] = isDatabaseConfigured()
    ? await Promise.all([
        prisma.school.count({ where: SCREEN_CONSOLE_LIST }).catch(() => 0),
        prisma.school.count({ where: { AND: [SCREEN_CONSOLE_LIST, { liveScreenUrl: { not: null } }] } }).catch(() => 0),
        prisma.screenFlyer.count({ where: { status: "PENDING" } }).catch(() => 0),
        prisma.screenPhoto.count({ where: { status: "PENDING" } }).catch(() => 0),
        prisma.shoutOut.count({ where: { status: "PENDING" } }).catch(() => 0),
        // When the app's figures were last read. The nightly cron needs
        // CRON_SECRET set, and without it the route answers 503 to a caller
        // nobody reads — which is how these sat 25 days old on the lobby
        // wall with nothing anywhere saying so.
        prisma.appSchoolStats
          .findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } })
          .catch(() => null),
      ])
    : [0, 0, 0, 0, 0, null];

  /**
   * How old the app's figures are, said plainly.
   *
   * They are what the lobby wall and every school's ticker count up to, so
   * when the sync stops they do not look broken — they look like nothing is
   * happening at JOC. Two days is a missed night; anything more has been
   * missed more than once.
   */
  const syncedAt = (lastSync as { syncedAt: Date } | null)?.syncedAt ?? null;
  const daysOld = syncedAt ? Math.floor((Date.now() - syncedAt.getTime()) / 86400000) : null;
  const stale = daysOld === null || daysOld >= 2;

  const tiles = [
    { n: `${up} of ${schools}`, label: "screens up" },
    { n: String(shouts), label: "shout-outs waiting" },
    { n: String(photos), label: "photos waiting" },
    { n: String(flyers), label: "flyers waiting" },
  ];

  return (
    <ScreensConsole>
      <div style={{ padding: "32px 32px 60px", maxWidth: "980px" }}>
        <div style={{ ...T.meta }}>LIVE SCREENS</div>
        <h1 style={{ ...pageTitle, color: C.ink, margin: "6px 0 6px" }}>School screens</h1>
        <p style={{ ...T.read, color: C.muted, margin: "0 0 24px", maxWidth: "64ch" }}>
          The TV in each school&rsquo;s hallway. Pick a school on the left to change its flyers, photos,
          dedication and shout-outs. Its switch says whether the screen is up in the building; teachers and
          ambassadors can add to it from their own side.
        </p>

        {stale ? (
          <div
            role="status"
            style={{
              display: "flex", gap: "10px", alignItems: "flex-start",
              background: "#FFF4E5", border: "1px solid #F3C98B", borderRadius: R.hero,
              padding: "14px 16px", marginBottom: "18px", maxWidth: "72ch",
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ color: "#B35C00", fontSize: "22px" }}>
              sync_problem
            </span>
            <div style={{ ...T.read, color: C.ink, margin: 0 }}>
              <strong>
                {syncedAt
                  ? `The app's figures are ${daysOld} days old.`
                  : "The app's figures have never been read."}
              </strong>{" "}
              Acts and hours on every screen are counting up to these, so they are behind by that
              much. The nightly sync needs <code>CRON_SECRET</code> set in Vercel — without it the
              job answers 503 and stops, quietly.
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "26px" }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ background: C.white, borderRadius: R.hero, padding: "18px 20px", boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)" }}>
              <div style={{ fontFamily: F.ui, fontSize: "30px", fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{t.n}</div>
              <div style={{ ...T.meta, marginTop: "4px" }}>{t.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <p style={{ ...T.small, color: C.muted }}>
          Sample screen with the design&rsquo;s data:{" "}
          <a href="/school-screen/demo?demo=1" target="_blank" rel="noreferrer" style={{ color: C.blue }}>/school-screen/demo?demo=1</a>
        </p>
      </div>
    </ScreensConsole>
  );
}
