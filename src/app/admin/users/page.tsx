import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { PeopleTable, type PersonRow } from "@/components/admin/PeopleTable";
import { getAllUsers, usingSampleData } from "@/lib/admin-data";
import { safeAuth, isAuthConfigured } from "@/auth";
import { canManageRoles, JOC_STAFF_DOMAIN, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/access";

const INK = "#10233F";
const INTERNAL_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export const metadata = { title: "People — JOC Console" };

export default async function UsersPage() {
  return <AccountsGuard>{await Inner()}</AccountsGuard>;
}

async function Inner() {
  const users = (await getAllUsers()) as PersonRow[];
  const session = await safeAuth();
  const canEditRoles = !isAuthConfigured || canManageRoles(session?.user);

  const internal = users.filter((u) => INTERNAL_ROLES.includes(u.role));
  const school = users.filter((u) => !INTERNAL_ROLES.includes(u.role));

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        People
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 18px" }}>
        {internal.length} at Just One Chesed, {school.length} at schools.
      </p>

      {/* What each role means — this is the page where roles get handed out */}
      <div
        style={{
          backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "16px 18px", marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.5)", margin: "0 0 10px" }}>
          What the roles mean
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "10px 20px" }}>
          {(["STAFF", "ADMIN", "SUPER_ADMIN"] as Role[]).map((r) => (
            <div key={r}>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: INK, margin: "0 0 2px" }}>{ROLE_LABELS[r]}</p>
              <p style={{ fontSize: "12.5px", lineHeight: 1.5, color: "rgba(16,35,63,.62)", margin: 0 }}>
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: "rgba(16,35,63,.55)", margin: "12px 0 0", paddingTop: "10px", borderTop: "1px solid rgba(16,35,63,.08)" }}>
          Anyone signing in with a <strong style={{ color: INK }}>@{JOC_STAFF_DOMAIN}</strong> address becomes JOC
          staff automatically. Educational team and super admin are only ever granted here, by hand.
        </p>
      </div>

      {!canEditRoles && (
        <p style={{ fontSize: "13.5px", color: "#9A5405", backgroundColor: "#FDEEDA", borderRadius: "12px", padding: "11px 14px", margin: "0 0 16px" }}>
          You can see this list but only a super admin can change roles or suspend accounts.
        </p>
      )}

      <PeopleTable
        title={`Just One Chesed (${internal.length})`}
        people={internal}
        showSchool={false}
        canEditRoles={canEditRoles}
        disabled={usingSampleData}
      />
      <div style={{ height: "16px" }} />
      <PeopleTable
        title={`School users (${school.length})`}
        people={school}
        showSchool
        canEditRoles={canEditRoles}
        disabled={usingSampleData}
      />
    </div>
  );
}
