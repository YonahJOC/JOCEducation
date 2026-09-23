import { UsersGuard } from "@/components/admin/Guard";
import { C } from "@/lib/joc-tokens";
import { PeopleTable, type PersonRow, type SchoolRef, type ProgramRef } from "@/components/admin/PeopleTable";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { usingSampleData } from "@/lib/admin-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { canManageRoles, can, JOC_STAFF_DOMAIN, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/access";
import { PageIntro } from "@/components/admin/PageIntro";
import { ensureAdminRoles, listAdminRoles } from "@/lib/admin-roles";

const INTERNAL_ROLES = ["STAFF", "PROGRAM_STAFF", "ADMIN", "SUPER_ADMIN"];

export const metadata = { title: "People — JOC Console" };

export default async function UsersPage() {
  return <UsersGuard>{await Inner()}</UsersGuard>;
}

async function Inner() {
  const session = await safeAuth();
  const canEditRoles = openForReview || canManageRoles(session?.user);
  // Naming coordinators is its own permission — the programming team holds it
  // and does not hold the one that changes roles.
  const canSetCoordinators = openForReview || can(session?.user, "coordinators");

  let users: PersonRow[] = [];
  let schools: SchoolRef[] = [];
  let programs: ProgramRef[] = [];
  // Offered on the JOC rows below, so somebody can be given console access
  // from the same place their role is set.
  await ensureAdminRoles();
  const adminTypes = (await listAdminRoles()).map((r) => ({ id: r.id, name: r.name }));

  if (isDatabaseConfigured()) {
    const [rows, schoolRows] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ role: "desc" }, { createdAt: "desc" }],
        take: 1000,
        select: {
          id: true, name: true, email: true, role: true, active: true,
          lastSeenAt: true, schoolId: true, passwordHash: true, adminRoleId: true,
          school: { select: { name: true } },
          programsLed: { select: { id: true } },
        },
      }),
      prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    programs = await prisma.programPage.findMany({
      orderBy: { sort: "asc" },
      select: { id: true, name: true },
    });
    users = rows.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role, active: u.active,
      lastSeenAt: u.lastSeenAt, schoolId: u.schoolId,
      schoolName: u.school?.name ?? null,
      hasPassword: Boolean(u.passwordHash),
      adminRoleId: u.adminRoleId,
      programIds: u.programsLed.map((p) => p.id),
    }));
    schools = schoolRows;
  }

  const internal = users.filter((u) => INTERNAL_ROLES.includes(u.role));
  const schoolUsers = users.filter((u) => !INTERNAL_ROLES.includes(u.role));
  const unassigned = schoolUsers.filter((u) => !u.schoolId).length;

  return (
    <div>
      <PageIntro
        title="People"
        what={`Everyone with an account — the JOC team and every teacher at every school. What somebody can see and do is decided entirely by their role, which is set here.`}
        steps={[
          `Most people never need adding. Anyone with a @${JOC_STAFF_DOMAIN} address who signs in with Google gets an account automatically, with free access to the whole site.`,
          "To change what somebody can do, find their row and pick a new role from the dropdown. It takes effect within five minutes without them signing out.",
          "To bring in a teacher from a school, use the school's own page instead — invite them from there and they join that school on their first sign-in.",
          "“Add a person” is for someone who cannot use Google sign-in. It creates a password account and makes them change the password the first time they use it.",
          "To stop somebody getting in, suspend them. Their account and their work stay; only the login closes.",
        ]}
        note="Only a super admin can grant Educational team or Super admin. Give the lowest role that lets the person do their job — it is easy to raise later."
      >
        {canEditRoles && <CreateUserForm schools={schools} disabled={usingSampleData} />}
      </PageIntro>
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 8px" }}>
        {internal.length} at Just One Chesed, {schoolUsers.length} at schools
        {unassigned > 0 && (
          <span style={{ color: "#C96C00" }}> · {unassigned} with no school</span>
        )}
        .
      </p>

      <div style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "16px 18px", marginBottom: "20px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 10px" }}>
          What the roles mean
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px 20px" }}>
          {(["STAFF", "PROGRAM_STAFF", "ADMIN", "SUPER_ADMIN", "SCHOOL_ADMIN"] as Role[]).map((r) => (
            <div key={r}>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: C.ink, margin: "0 0 2px" }}>{ROLE_LABELS[r]}</p>
              <p style={{ fontSize: "12.5px", lineHeight: 1.5, color: "#4A5A74", margin: 0 }}>
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: "#4A5A74", margin: "12px 0 0", paddingTop: "10px", borderTop: "1px solid rgba(16,35,63,.08)" }}>
          A <strong style={{ color: C.ink }}>@{JOC_STAFF_DOMAIN}</strong> address becomes JOC staff
          automatically. Everything above staff is granted here, by hand.
        </p>
      </div>

      {!canEditRoles && (
        <p style={{ fontSize: "13.5px", color: "#C96C00", backgroundColor: "#FFF0E0", borderRadius: "12px", padding: "11px 14px", margin: "0 0 16px" }}>
          You can see this list, but only a super admin can create accounts or change roles.
        </p>
      )}

      <PeopleTable
        title={`Just One Chesed (${internal.length})`}
        people={internal}
        showSchool={false}
        canEditRoles={canEditRoles}
        disabled={usingSampleData}
        schools={schools}
        adminTypes={adminTypes}
        programs={programs}
        canSetCoordinators={canSetCoordinators}
      />
      <div style={{ height: "16px" }} />
      <PeopleTable
        title={`School users (${schoolUsers.length})`}
        people={schoolUsers}
        showSchool
        canEditRoles={canEditRoles}
        disabled={usingSampleData}
        schools={schools}
      />
    </div>
  );
}
