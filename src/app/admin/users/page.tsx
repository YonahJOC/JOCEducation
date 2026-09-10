import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { PeopleTable, type PersonRow, type SchoolRef } from "@/components/admin/PeopleTable";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { usingSampleData } from "@/lib/admin-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, isAuthConfigured } from "@/auth";
import { canManageRoles, JOC_STAFF_DOMAIN, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/access";

const INK = "#10233F";
const INTERNAL_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export const metadata = { title: "People — JOC Console" };

export default async function UsersPage() {
  return <AccountsGuard>{await Inner()}</AccountsGuard>;
}

async function Inner() {
  const session = await safeAuth();
  const canEditRoles = !isAuthConfigured || canManageRoles(session?.user);

  let users: PersonRow[] = [];
  let schools: SchoolRef[] = [];

  if (isDatabaseConfigured()) {
    const [rows, schoolRows] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ role: "desc" }, { createdAt: "desc" }],
        take: 1000,
        select: {
          id: true, name: true, email: true, role: true, active: true,
          lastSeenAt: true, schoolId: true, passwordHash: true,
          school: { select: { name: true } },
        },
      }),
      prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    users = rows.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role, active: u.active,
      lastSeenAt: u.lastSeenAt, schoolId: u.schoolId,
      schoolName: u.school?.name ?? null,
      hasPassword: Boolean(u.passwordHash),
    }));
    schools = schoolRows;
  }

  const internal = users.filter((u) => INTERNAL_ROLES.includes(u.role));
  const schoolUsers = users.filter((u) => !INTERNAL_ROLES.includes(u.role));
  const unassigned = schoolUsers.filter((u) => !u.schoolId).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: 0 }}>
          People
        </h1>
        {canEditRoles && <CreateUserForm schools={schools} disabled={usingSampleData} />}
      </div>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 8px" }}>
        {internal.length} at Just One Chesed, {schoolUsers.length} at schools
        {unassigned > 0 && (
          <span style={{ color: "#C96C00" }}> · {unassigned} with no school</span>
        )}
        .
      </p>

      <div style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "16px 18px", marginBottom: "20px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.5)", margin: "0 0 10px" }}>
          What the roles mean
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px 20px" }}>
          {(["STAFF", "ADMIN", "SUPER_ADMIN", "SCHOOL_ADMIN"] as Role[]).map((r) => (
            <div key={r}>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: INK, margin: "0 0 2px" }}>{ROLE_LABELS[r]}</p>
              <p style={{ fontSize: "12.5px", lineHeight: 1.5, color: "rgba(16,35,63,.62)", margin: 0 }}>
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: "rgba(16,35,63,.55)", margin: "12px 0 0", paddingTop: "10px", borderTop: "1px solid rgba(16,35,63,.08)" }}>
          A <strong style={{ color: INK }}>@{JOC_STAFF_DOMAIN}</strong> address becomes JOC staff
          automatically. Everything above staff is granted here, by hand.
        </p>
      </div>

      {!canEditRoles && (
        <p style={{ fontSize: "13.5px", color: "#9A5405", backgroundColor: "#FDEEDA", borderRadius: "12px", padding: "11px 14px", margin: "0 0 16px" }}>
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
