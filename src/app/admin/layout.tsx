import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { leadsAnyProgram, canOpenConsole, listProgramsForAdmin } from "@/lib/program-admin";
import { usingSampleData } from "@/lib/admin-data";
import { signOutAction } from "@/app/actions/auth";
import { PortalShell, ShellExit } from "@/components/shell/PortalShell";
import { jocNav, roleLabel } from "@/lib/nav";
import { needCount } from "@/lib/program-today";
import { pageTitle, C, R, F, label } from "@/lib/joc-tokens";

export const metadata = { title: "JOC Console", robots: { index: false, follow: false } };

/**
 * The JOC side of the portal.
 *
 * The sidebar had grown to twenty-odd links across five headings, because
 * every new page added one — a list of what the software can do rather than
 * of what a person came to do. A program coordinator, who can open exactly
 * one of them, had to read all twenty to find it.
 *
 * At most seven items now, built from capabilities, with everything else a
 * tab or a link inside one of them. The shell is shared with the school side;
 * they differ in colour and in nothing else.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();
  const me = session?.user;

  // Running a program is the second way in. A coordinator holds no capability
  // at all, so a capability check alone locked them out of the one page built
  // for them.
  const leadsProgram = openForReview ? true : await leadsAnyProgram(me?.id ?? null);

  if (!openForReview && !(await canOpenConsole(me))) {
    const signedIn = Boolean(me);
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
        <div style={{ maxWidth: "460px", textAlign: "center" }}>
          <h1 style={{ ...pageTitle, color: C.ink, marginBottom: "10px" }}>
            {signedIn ? "The console isn't yours" : "Sign in required"}
          </h1>
          <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, marginBottom: "22px" }}>
            {signedIn ? (
              <>
                Your account has full access to the site, its materials and its programs — the
                console is for the educational and programming teams. Ask a super admin if you need
                to work in it.
              </>
            ) : (
              <>Sign in with your <strong style={{ color: C.ink }}>@justonechesed.org</strong> account.</>
            )}
          </p>
          <Link
            href={signedIn ? "/home" : "/"}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: F.ui, backgroundColor: C.blue, color: C.white, fontWeight: 700,
              fontSize: "16px", borderRadius: R.button, padding: "13px 24px",
              minHeight: "47px", textDecoration: "none",
            }}
          >
            {signedIn ? "Go to the site" : "Go to sign in"}
          </Link>
        </div>
      </div>
    );
  }

  // A coordinator's rail is the programs they run, each with what it needs.
  const mine = leadsProgram ? await listProgramsForAdmin() : [];
  const programs = await Promise.all(
    mine.slice(0, 5).map(async (p) => ({
      name: p.name,
      slug: p.slug,
      heroColor: p.heroColor,
      need: await needCount(p.id, p.slug),
    })),
  );

  return (
    <PortalShell
      side="joc"
      who={me?.email ?? "Nobody signed in"}
      role={openForReview ? "Console" : roleLabel(me, { leadsPrograms: mine.length })}
      items={jocNav(me, { programs })}
      action={
        <div style={{ display: "grid", gap: "8px" }}>
          <ShellExit side="joc" href="/home">Back to the site</ShellExit>
          {me && (
            <form action={signOutAction}>
              <button
                type="submit"
                style={{
                  fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                  width: "100%", color: "rgba(255,255,255,.7)",
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
      {usingSampleData && (
        <div style={{ backgroundColor: C.orangeTint, borderRadius: R.form, padding: "12px 16px", marginBottom: "16px" }}>
          <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, margin: 0, lineHeight: 1.55 }}>
            No database is connected, so every school and entry here is illustrative and nothing you
            change will save.
          </p>
        </div>
      )}
      {children}
    </PortalShell>
  );
}
