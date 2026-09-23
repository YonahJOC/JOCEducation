import Link from "next/link";
import Image from "next/image";
import { safeAuth, isAuthConfigured, openForReview } from "@/auth";
import { leadsAnyProgram, canOpenConsole } from "@/lib/program-admin";
import {
  can, canManageAccounts, canManageCalendar, canManageContent,
  canManageUsers, ROLE_LABELS, type Role,
} from "@/lib/access";
import { usingSampleData } from "@/lib/admin-data";
import { signOutAction } from "@/app/actions/auth";
import { SideNav, type NavItem } from "@/components/admin/SideNav";

export const metadata = { title: "JOC Console", robots: { index: false, follow: false } };

/** School accounts, billing and the sales pipeline. */
const ACCOUNTS_NAV: NavItem[] = [
  { label: "Overview", href: "/admin", hint: "Where every school stands" },
  { label: "School status", href: "/admin/schools/status", hint: "Paid, lists, screens, visits — all of it on one screen" },
  { label: "Schools", href: "/admin/schools", hint: "Plans, seats, contacts, history" },
  { label: "Demo requests", href: "/admin/demos", hint: "Bookings and contact-form messages" },
  { label: "Orders", href: "/admin/orders", hint: "What schools have ordered from the shop" },
  { label: "Pricing", href: "/admin/pricing", hint: "Plan prices and program prices" },
];

/** Accounts, roles and passwords — super admins only, separate on purpose. */
const PEOPLE_NAV: NavItem[] = [
  { label: "People", href: "/admin/users", hint: "Accounts, roles and passwords" },
  { label: "Admin types", href: "/admin/roles", hint: "What each kind of admin can do" },
];

/** The calendar — what runs when. Programming and education both need it. */
const CALENDAR_NAV: NavItem[] = [
  { label: "Calendar", href: "/admin/programming", hint: "What is running, and where" },
  { label: "Chesed Cycles", href: "/admin/cycles", hint: "The eight themes and their dates" },
];

/** Shown to anyone who can open the console at all. */
const START_NAV: NavItem[] = [
  { label: "Start here", href: "/admin/guide", hint: "What each section does" },
];

/** Educational material — the JOC Education Team's work. */
const CONTENT_NAV: NavItem[] = [
  { label: "Site content", href: "/admin/site", hint: "The words on the public pages" },
  { label: "Cycle coverage", href: "/admin/coverage", hint: "Which cycles have material" },
  { label: "Programs", href: "/admin/programs", hint: "What JOC runs for schools" },
  { label: "Lesson plans", href: "/admin/lessons", hint: "Write and publish lessons" },
  { label: "Resources", href: "/admin/resources", hint: "Worksheets, videos, source sheets" },
  { label: "Files", href: "/admin/files", hint: "Everything uploaded" },
  { label: "Teachers' Board", href: "/admin/board", hint: "Approve what teachers post" },
  { label: "Discussion rooms", href: "/admin/rooms", hint: "Topic rooms in the staff room" },
  { label: "Products", href: "/admin/products", hint: "The shop catalogue" },
  { label: "Forms", href: "/admin/forms", hint: "Registrations, sign-ups and feedback" },
];

/**
 * The program consoles. A coordinator sees the one they run; anybody who may
 * see programs gets the same page with all of them on it — the same screen,
 * not a second one built to describe it.
 */
const MINE_NAV = [
  { label: "Program consoles", href: "/admin/my-programs", hint: "Sign-ups, forms and dates, per program" },
];

/**
 * The admin meeting. Its own section rather than a line under Accounts,
 * because it is the one place a coordinator's question gets answered — and
 * an agenda nobody can find is an agenda nobody works through.
 */
const MEETING_NAV: NavItem[] = [
  { label: "Admin meeting", href: "/admin/meetings", hint: "Schools coordinators have sent for a decision" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();

  // Running a program is the second way in. A coordinator holds no capability
  // at all, so the capability check alone locked them out of the one page
  // built for them.
  const leadsProgram = isAuthConfigured
    ? await leadsAnyProgram(session?.user?.id ?? null)
    : false;

  // The console is for the educational team and above. JOC staff have full
  // access to the site itself but nothing to do here.
  if (!openForReview && !(await canOpenConsole(session?.user))) {
    const signedIn = Boolean(session?.user);
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "10px" }}>
            {signedIn ? "You don't have console access" : "Sign in required"}
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4A5A74", marginBottom: "22px" }}>
            {signedIn ? (
              <>
                Your account has full access to the site, materials and programs — but the console is
                for the educational and programming teams. Ask a super admin if you need to work in it.
              </>
            ) : (
              <>Sign in with your <strong style={{ color: "#10233F" }}>@justonechesed.org</strong> account.</>
            )}
          </p>
          <Link
            href={signedIn ? "/home" : "/"}
            style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none" }}
          >
            {signedIn ? "Go to the site" : "Go to sign in"}
          </Link>
        </div>
      </div>
    );
  }

  const who = session?.user?.email ?? null;
  const role = (session?.user?.role ?? null) as Role | null;
  // Before auth is configured the console is open so it can be reviewed;
  // treat that as full access rather than hiding half the navigation.
  const open = openForReview;
  const showAccounts = open || canManageAccounts(session?.user);
  const showPeople = open || canManageUsers(session?.user);
  const showCalendar = open || canManageCalendar(session?.user);
  const showContent = open || canManageContent(session?.user);
  // Coordinators reach it by running something; everybody else by being able
  // to see programs at all. listProgramsForAdmin narrows the list either way.
  const showMine =
    leadsProgram || open || can(session?.user, "programs") || can(session?.user, "forms") || can(session?.user, "coordinators");
  const showMeeting = open || can(session?.user, "run_admin_agenda");

  return (
    <div className="joc-admin-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#FBF9F4" }}>
      {/* Sidebar — becomes a top bar with a scrolling nav on narrow screens */}
      <aside
        className="joc-admin-sidebar"
        style={{
          width: "232px", flexShrink: 0, backgroundColor: "#10233F", color: "rgba(255,255,255,.72)",
          display: "flex", flexDirection: "column", padding: "22px 0",
        }}
      >
        <div className="joc-admin-brand" style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,.1)", marginBottom: "16px" }}>
          {/* The full wordmark, in the version drawn for dark backgrounds.
              What stood here was joc-icon-orange — the inner ring on its own,
              which is a piece of the mark rather than the mark. */}
          <Link href="/admin" style={{ display: "block", textDecoration: "none" }}>
            <Image
              src="/brand/joc-wordmark-white.png"
              alt="JustOneChesed"
              width={165}
              height={20}
              priority
              style={{ height: "19px", width: "auto", display: "block" }}
            />
            <p style={{ fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#FA912D", margin: "7px 0 0", fontWeight: 700 }}>
              Education Console
            </p>
          </Link>
        </div>

        {/* Leaving the console was a line of small grey text at the very
            bottom of the sidebar, below everything. It is the way out, so it
            sits at the top and looks like a button. */}
        <div style={{ padding: "0 14px 16px" }}>
          <Link
            href="/home"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              backgroundColor: "rgba(255,255,255,.1)", color: "#fff",
              fontSize: "13.5px", fontWeight: 600, textDecoration: "none",
              borderRadius: "10px", padding: "11px 14px", minHeight: "44px",
            }}
          >
            ← Back to the site
          </Link>
        </div>

        {/* Only what this person can actually open. A link to a page that
            refuses you is worse than no link — it reads as something broken
            rather than something not yours. */}
        <div className="joc-admin-nav">
          <SideNav label="" items={START_NAV} />
          {showMine && <SideNav label="Yours" items={MINE_NAV} />}
          {showMeeting && <SideNav label="Decisions" items={MEETING_NAV} />}
          {showAccounts && <SideNav label="Accounts" items={ACCOUNTS_NAV} />}
          {showCalendar && <SideNav label="Planning" items={CALENDAR_NAV} />}
          {showContent && <SideNav label="Content" items={CONTENT_NAV} />}
          {showPeople && <SideNav label="Access" items={PEOPLE_NAV} />}
        </div>

        <div className="joc-admin-who" style={{ marginTop: "auto", padding: "16px 20px 0", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          {who && (
            <p style={{ fontSize: "12px", margin: "0 0 3px", color: "rgba(255,255,255,.85)", wordBreak: "break-all" }}>{who}</p>
          )}
          {role && (
            <p style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#FA912D", margin: "0 0 12px", fontWeight: 700 }}>
              {ROLE_LABELS[role] ?? role.replace("_", " ")}
            </p>
          )}
          {who && (
            <form action={signOutAction}>
              <button
                type="submit"
                style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", color: "rgba(255,255,255,.6)", background: "none", border: "none", padding: 0, cursor: "pointer", minHeight: "36px", textAlign: "left" }}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {usingSampleData && (
          <div style={{ backgroundColor: "#FFF0E0", borderBottom: "1px solid rgba(154,84,5,.2)", padding: "10px 30px" }}>
            <p style={{ fontSize: "13px", color: "#C96C00", margin: 0, lineHeight: 1.5 }}>
              <strong>Sample data.</strong> The database isn&rsquo;t connected yet, so these schools and activity entries are
              illustrative and nothing you change here will save. Add <code style={{ background: "rgba(154,84,5,.12)", padding: "1px 5px", borderRadius: "4px" }}>DATABASE_URL</code> to switch to live data.
            </p>
          </div>
        )}
        <div className="joc-admin-body" style={{ padding: "30px" }}>{children}</div>
      </div>
    </div>
  );
}

