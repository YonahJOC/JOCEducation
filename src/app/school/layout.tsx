import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { canRunSchoolApp } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { signOutAction } from "@/app/actions/auth";
import { PortalShell, ShellExit } from "@/components/shell/PortalShell";
import { schoolNav } from "@/lib/nav";
import { C, R, F, label } from "@/lib/joc-tokens";

export const metadata = { title: "Your school", robots: { index: false, follow: false } };

/**
 * The school's own side of the portal.
 *
 * Two audiences in here. Whoever runs the account sees the plan, the seats
 * and who has a login. A teacher who runs the school's JOC App sees what
 * their students are doing and nothing about money.
 *
 * Same shell as the console, in panel rather than ink — this is part of the
 * school's own experience, not a key to the staff room.
 */
export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();

  if (!openForReview && !canRunSchoolApp(session?.user)) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <h1 style={{ fontFamily: F.ui, fontWeight: 700, fontSize: "24px", letterSpacing: "-0.03em", color: C.ink, marginBottom: "10px" }}>
            For school administrators
          </h1>
          <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, marginBottom: "22px" }}>
            This area is for the person who runs a school&rsquo;s JOC account. If that should be
            you, ask Just One Chesed to set it up.
          </p>
          <Link
            href="/home"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: F.ui, backgroundColor: C.blue, color: C.white, fontWeight: 700,
              fontSize: "16px", borderRadius: R.button, padding: "13px 24px",
              minHeight: "47px", textDecoration: "none",
            }}
          >
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  let schoolName = "Your school";
  let planLabel: string | null = null;
  if (isDatabaseConfigured() && session?.user?.schoolId) {
    try {
      const s = await prisma.school.findUnique({
        where: { id: session.user.schoolId },
        select: { name: true, subscription: { select: { plan: true } } },
      });
      if (s) {
        schoolName = s.name;
        planLabel = s.subscription?.plan?.replace(/_/g, " ").toLowerCase() ?? null;
      }
    } catch {
      // The name is decoration; the panel still works without it.
    }
  }

  return (
    <PortalShell
      side="school"
      who={session?.user?.email ?? "Nobody signed in"}
      role={schoolName}
      items={schoolNav(session?.user)}
      action={
        <div style={{ display: "grid", gap: "8px" }}>
          {planLabel && (
            <p style={{ ...label, color: C.muted, margin: 0, textTransform: "uppercase" }}>{planLabel}</p>
          )}
          <ShellExit side="school" href="/home">Back to the site</ShellExit>
          {session?.user && (
            <form action={signOutAction}>
              <button
                type="submit"
                style={{
                  ...label, width: "100%", color: C.muted,
                  background: "none", border: "none", cursor: "pointer",
                  minHeight: "44px", textAlign: "left", padding: 0,
                }}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      }
    >
      {children}
    </PortalShell>
  );
}
