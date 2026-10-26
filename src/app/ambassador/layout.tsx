import Link from "next/link";
import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { C, F } from "@/lib/joc-tokens";
import { IconFont } from "@/components/ui/IconFont";
import { PortalShell } from "@/components/shell/PortalShell";
import { ambassadorNav } from "@/lib/nav";
import { myAmbassadorship } from "@/lib/ambassadors";
import { updatesForAmbassador, waitingForAmbassador } from "@/lib/school-screen/editor-data";

/**
 * The ambassador's corner of the portal.
 *
 * The same shell the school side uses, not a header of its own. It had its
 * own small dark bar and a 760px column, so a student and their teacher
 * were looking at two different pieces of software to do two halves of one
 * job — and anything built for one of them had to be built twice.
 *
 * What stays deliberately small is the rail, not the furniture: one
 * program, one school, and nothing about a plan, money, another school or
 * the console. See ambassadorNav.
 *
 * Signing in is all this layout asks for. Whether somebody is actually an
 * ambassador is asked on each page, because /ambassador/join has to be
 * reachable by somebody who is not one yet.
 */

export const metadata = { title: "Ambassador", robots: { index: false, follow: false } };

export default async function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  if (!openForReview && !session?.user) redirect("/");

  const me = session?.user;
  const amb = await myAmbassadorship().catch(() => null);

  // Somebody who has not joined yet gets the page and no rail: /join is
  // the one thing they can do, and a rail of four locked items beside it
  // would be four ways of telling them they are not welcome.
  if (!amb) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.paper }}>
        <IconFont />
        <main style={{ maxWidth: "760px", margin: "0 auto", padding: "26px 20px 60px" }}>
          {children}
        </main>
      </div>
    );
  }

  const [waiting, updates] = await Promise.all([
    waitingForAmbassador(amb.schoolId, me?.id ?? null).catch(() => 0),
    updatesForAmbassador(amb.schoolId, me?.id ?? null).catch(() => 0),
  ]);

  return (
    <>
      <IconFont />
      <PortalShell
        side="school"
        who={amb.schoolName}
        role={`Ambassador · ${amb.programName}`}
        items={ambassadorNav({ waiting, updates })}
        action={
          <Link
            href={`/school-screen/${amb.schoolSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "44px",
              fontFamily: F.ui,
              fontSize: "14.5px",
              fontWeight: 600,
              color: C.muted,
              textDecoration: "none",
            }}
          >
            Open the TV
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "18px" }}>
              open_in_new
            </span>
          </Link>
        }
        home="/ambassador"
      >
        {children}
      </PortalShell>
    </>
  );
}
