import Link from "next/link";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isScreenStaff } from "@/lib/school-screen/access";
import { shortName } from "@/lib/school-screen/rules";
import { ScreensTabs } from "@/components/admin/ScreensTabs";
import { C, F, R, T, pageTitle } from "@/lib/joc-tokens";

/**
 * Every school's hallway TV, from JOC's side.
 *
 * One row a school: whether its screen is up, what is waiting for a
 * decision, and the way into it. Waiting comes first in the sort, because a
 * school whose teacher has not opened the queue is a screen going stale.
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

  const schools = isDatabaseConfigured()
    ? await prisma.school.findMany({
        where: { isTest: false },
        orderBy: { name: "asc" },
        select: {
          id: true, slug: true, name: true, liveScreenUrl: true, screenShortName: true, screenEmailDomains: true,
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

  const rows = schools
    .map((s) => ({ ...s, waiting: s._count.shoutOuts + s._count.screenPhotos + s._count.screenFlyers }))
    .sort((a, b) => Number(Boolean(b.liveScreenUrl)) - Number(Boolean(a.liveScreenUrl)) || b.waiting - a.waiting || a.name.localeCompare(b.name));
  const up = rows.filter((r) => r.liveScreenUrl).length;

  return (
    <>
    <ScreensTabs active="schools" />
    <div style={{ padding: "24px 28px 60px", maxWidth: "1100px" }}>
      <div style={{ ...T.meta }}>LIVE SCREENS</div>
      <h1 style={{ ...pageTitle, color: C.ink, margin: "6px 0 6px" }}>School screens</h1>
      <p style={{ ...T.read, color: C.muted, margin: "0 0 22px", maxWidth: "70ch" }}>
        The TV in each school&rsquo;s hallway. {up} of {rows.length} are up. Open a school to change its flyers,
        photos, dedication and shout-outs; teachers and ambassadors can do the same from their own side.
      </p>

      <div style={{ background: C.white, borderRadius: R.hero, boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)", overflow: "hidden" }}>
        {rows.map((s, i) => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
            padding: "14px 22px", borderTop: i ? `1px solid ${C.rule}` : "none",
          }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ ...T.name, color: C.ink }}>{s.name}</div>
              <div style={{ ...T.meta, marginTop: "3px" }}>
                {s.liveScreenUrl ? "SCREEN UP" : "NO SCREEN YET"} · ON SCREEN AS {shortName(s.name, s.screenShortName).toUpperCase()}
                {s.screenEmailDomains.length ? ` · @${s.screenEmailDomains[0]}` : " · NO EMAIL DOMAIN"}
              </div>
            </div>
            {s.waiting ? (
              <span style={{
                borderRadius: "999px", padding: "5px 12px", background: C.orangeTint, color: C.orangeText,
                fontFamily: F.data, fontSize: "12px", fontWeight: 600,
              }}>{s.waiting} WAITING</span>
            ) : null}
            <a href={`/school-screen/${s.slug}`} target="_blank" rel="noreferrer" style={linkQuiet}>Open screen ↗</a>
            <Link href={`/admin/school-screens/${s.slug}`} style={linkBlue}>Manage</Link>
          </div>
        ))}
        {rows.length === 0 ? <p style={{ padding: "22px", margin: 0, ...T.small, color: C.muted }}>No schools yet.</p> : null}
      </div>

      <p style={{ ...T.small, color: C.muted, marginTop: "18px" }}>
        Sample screen with the design&rsquo;s data: <a href="/school-screen/demo?demo=1" target="_blank" rel="noreferrer" style={{ color: C.blue }}>/school-screen/demo?demo=1</a>
      </p>
    </div>
    </>
  );
}

const linkBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 14px",
  borderRadius: R.button, textDecoration: "none", fontFamily: F.ui, fontWeight: 600, fontSize: "14.5px",
};
const linkQuiet: React.CSSProperties = { ...linkBase, background: C.blueTint, color: C.blue };
const linkBlue: React.CSSProperties = { ...linkBase, background: C.blue, color: C.white };
