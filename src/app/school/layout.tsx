import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import Image from "next/image";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "Your school", robots: { index: false, follow: false } };

/**
 * Two audiences in here. A school admin runs the account — the plan, the
 * seats, who has a login. An app admin is a teacher looking after what their
 * students are doing, and has no business seeing what the school pays.
 */
const NAV = [
  { label: "Your programs", href: "/school/programs", app: true },
  { label: "Chesed activity", href: "/school/activity", app: true },
  { label: "Cycle progress", href: "/school/cycles", app: true },
  { label: "Your ambassadors", href: "/school/ambassadors", app: true },
  { label: "Your teachers", href: "/school/teachers" },
  { label: "Plan & seats", href: "/school/plan" },
];

/**
 * The school administrator's area.
 *
 * Light educator portal, never the dark JOC console — this is part of the
 * school's own experience, not a key to the staff room. Everything inside is
 * scoped to their own school, and the sidebar says so by name.
 */
export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();

  const runsAccount = openForReview || canRunOwnSchool(session?.user);

  if (!openForReview && !canRunSchoolApp(session?.user)) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
        <div style={{ maxWidth: "430px", textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: "23px", letterSpacing: "-0.03em", color: C.ink, marginBottom: "10px" }}>
            For school administrators
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4A5A74", marginBottom: "22px" }}>
            This area is for the person who runs a school&rsquo;s JOC account. If that should be you, ask
            Just One Chesed to set it up.
          </p>
          <Link
            href="/home"
            style={{ display: "inline-block", backgroundColor: C.blue, color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none" }}
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
        select: { name: true, city: true, subscription: { select: { plan: true } } },
      });
      if (s) {
        schoolName = s.name;
        planLabel = s.subscription?.plan?.replace(/_/g, " ").toLowerCase() ?? null;
      }
    } catch {
      // Name is decoration; the page still works without it.
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fff" }}>
      <aside
        className="joc-school-sidebar"
        style={{
          width: "252px", flexShrink: 0, backgroundColor: C.paper,
          borderRight: `1px solid ${C.hairline}`, padding: "22px 0",
          display: "flex", flexDirection: "column",
        }}
      >
        <div className="joc-school-brand" style={{ padding: "0 20px 18px" }}>
          <Link href="/home" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/brand/joc-wordmark.png" alt="JustOneChesed" width={130} height={16} priority style={{ height: "16px", width: "auto" }} />
            <span aria-hidden="true" style={{ width: "1px", height: "16px", backgroundColor: C.hairline }} />
            <span style={{ fontWeight: 700, fontSize: "9.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: C.orangeText }}>
              Education
            </span>
          </Link>
        </div>

        {/* The school this person runs, named. */}
        <div
          className="joc-school-card"
          style={{
            margin: "0 14px 16px", padding: "14px", backgroundColor: "#fff",
            border: `1px solid ${C.hairline}`, borderRadius: "14px",
          }}
        >
          <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 5px" }}>
            You administer
          </p>
          <p style={{ fontWeight: 700, fontSize: "15px", color: C.ink, margin: 0, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
            {schoolName}
          </p>
          {planLabel && (
            <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "3px 0 0", textTransform: "capitalize" }}>
              {planLabel}
            </p>
          )}
        </div>

        <nav className="joc-school-nav" style={{ display: "flex", flexDirection: "column" }}>
          {NAV.filter((i) => runsAccount || i.app).map((i) => (
            <Link
              key={i.href}
              href={i.href}
              style={{ padding: "10px 20px", fontSize: "14px", color: C.ink, textDecoration: "none", minHeight: "44px", display: "flex", alignItems: "center" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px 20px 0", borderTop: `1px solid ${C.hairline}` }}>
          {session?.user?.email && (
            <p style={{ fontSize: "12px", color: "#4A5A74", margin: "0 0 10px", wordBreak: "break-all" }}>
              {session.user.email}
            </p>
          )}
          <Link href="/home" style={{ fontSize: "12.5px", color: C.blue, textDecoration: "none", fontWeight: 600, display: "block", marginBottom: "8px" }}>
            ← Back to the site
          </Link>
          {session?.user?.email && (
            <form action={signOutAction}>
              <button
                type="submit"
                style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", color: "#4A5A74", background: "none", border: "none", padding: 0, cursor: "pointer", minHeight: "36px", textAlign: "left" }}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </aside>

      <div className="joc-school-main" style={{ flex: 1, minWidth: 0, padding: "30px", backgroundColor: "#fff" }}>
        {children}
      </div>
    </div>
  );
}
