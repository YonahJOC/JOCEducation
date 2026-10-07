import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { UsersGuard } from "@/components/admin/Guard";
import { isSuperAdminEmail, can, type Capability } from "@/lib/access";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { BuzzAccessList } from "./BuzzAccessList";
import { C, F, datum, pageTitle } from "@/lib/joc-tokens";

/**
 * Who can see the Buzz — one screen, one list, named people.
 *
 * Separate from admin types because the question is "who", not "what job".
 * Ticking a capability on the programming team grants it to whoever happens
 * to hold that type next month; this list is somebody's decision, written
 * down where it can be read back.
 *
 * Three ways somebody ends up on it, and the page says which:
 *   added here     the list below, switched on by name
 *   admin type     their type carries the Buzz capability
 *   super admin    holds everything, always
 */

export const metadata = { title: "Who can see the Buzz — JOC Console" };
export const dynamic = "force-dynamic";

export default async function BuzzAccessPage() {
  return <UsersGuard>{await Inner()}</UsersGuard>;
}

async function Inner() {
  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={pageTitle}>Who can see the Buzz</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, margin: 0 }}>
          No database, so there is nothing to show.
        </p>
      </div>
    );
  }

  // Everybody who is not tied to a single school. A school account cannot see
  // the Buzz whatever is set, so offering it here would be a lie.
  const people = await prisma.user.findMany({
    where: { schoolId: null, active: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true, name: true, email: true, buzzAccess: true,
      role: true, adminRole: { select: { name: true, capabilities: true } },
    },
  }).catch(() => []);

  const rows = people.map((u) => {
    const viaType = can(
      { email: u.email, role: u.role, capabilities: u.adminRole?.capabilities as Capability[] | undefined },
      "buzz",
    ) && !isSuperAdminEmail(u.email);

    return {
      id: u.id,
      name: u.name ?? null,
      email: u.email ?? "",
      added: u.buzzAccess,
      viaType: viaType ? (u.adminRole?.name ?? "their admin type") : null,
      superAdmin: isSuperAdminEmail(u.email),
    };
  });

  const withAccess = rows.filter((r) => r.added || r.viaType || r.superAdmin);

  // Given it before they ever signed in. Spent the first time they open it.
  const invites = (await prisma.buzzInvite.findMany({
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true },
  }).catch(() => [])).map((i) => ({ email: i.email, name: i.name }));

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>Who can see the Buzz</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {withAccess.length} {withAccess.length === 1 ? "PERSON" : "PEOPLE"}
            {invites.length > 0 && ` · ${invites.length} WAITING TO SIGN IN`}
            {" · "}
            <Link href="/buzz" style={{ color: C.blue, textDecoration: "none" }}>OPEN THE BUZZ</Link>
          </p>
        </div>
        <SectionLinks section="schools" />
      </div>

      <p style={{
        fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
        margin: "0 0 20px", maxWidth: "62ch",
      }}>
        Anybody at JOC can <strong style={{ color: C.ink }}>add</strong> a school update. This is
        who can <strong style={{ color: C.ink }}>read</strong> them all. Changes take effect
        straight away.
      </p>

      <BuzzAccessList rows={rows} invites={invites} />
    </div>
  );
}
