import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { getAllUsers } from "@/lib/admin-data";
import { JOC_STAFF_DOMAIN } from "@/lib/access";

const INK = "#10233F";

export const metadata = { title: "People — JOC Console" };

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "#B8321E", ADMIN: "#2D46AF", STAFF: "#1B7F4B",
  SCHOOL_ADMIN: "#2C7AC9", TEACHER: "#7A8699",
};

const INTERNAL_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

function ago(d: Date | null) {
  if (!d) return "never";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function UsersPage() {
  return (<AccountsGuard>{await Inner()}</AccountsGuard>);
}
async function Inner() {
  const users = await getAllUsers();
  const internal = users.filter((u) => INTERNAL_ROLES.includes(u.role));
  const teachers = users.filter((u) => !INTERNAL_ROLES.includes(u.role));

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        People
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 8px" }}>
        {internal.length} at Just One Chesed, {teachers.length} at schools.
      </p>
      <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)", margin: "0 0 22px", lineHeight: 1.6, maxWidth: "62ch" }}>
        Anyone signing in with a <strong style={{ color: INK }}>@{JOC_STAFF_DOMAIN}</strong> address becomes{" "}
        <strong style={{ color: INK }}>JOC staff</strong> automatically — free access to the whole site, no ability to
        change anyone&rsquo;s account. <strong style={{ color: INK }}>Educational team</strong> and{" "}
        <strong style={{ color: INK }}>Super admin</strong> are granted by hand, by a super admin.
      </p>

      <Section title={`Just One Chesed (${internal.length})`} users={internal} showSchool={false} />
      <div style={{ height: "16px" }} />
      <Section title={`School users (${teachers.length})`} users={teachers} showSchool />
    </div>
  );
}

type Row = {
  id: string; name: string | null; email: string; role: string;
  active: boolean; lastSeenAt: Date | null; schoolName: string | null;
};

function Section({ title, users, showSchool }: { title: string; users: Row[]; showSchool: boolean }) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0, padding: "16px 20px", borderBottom: "1px solid rgba(16,35,63,.08)" }}>
        {title}
      </p>
      {users.length === 0 ? (
        <p style={{ padding: "20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>Nobody yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: showSchool ? "620px" : "480px" }}>
            <thead>
              <tr>
                {["Name", ...(showSchool ? ["School"] : []), "Role", "Last seen"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                    <span style={{ fontWeight: 600, color: INK, display: "block" }}>{u.name ?? "—"}</span>
                    <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", wordBreak: "break-all" }}>{u.email}</span>
                  </td>
                  {showSchool && (
                    <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)" }}>
                      {u.schoolName ?? <span style={{ color: "#C96C00" }}>no school</span>}
                    </td>
                  )}
                  <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "9999px", letterSpacing: "0.04em", color: ROLE_COLOR[u.role] ?? "#7A8699", backgroundColor: `${ROLE_COLOR[u.role] ?? "#7A8699"}1a`, whiteSpace: "nowrap" }}>
                      {u.role.replace("_", " ").toLowerCase()}
                    </span>
                    {!u.active && (
                      <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 700, color: "#B8321E" }}>suspended</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.6)", whiteSpace: "nowrap" }}>
                    {ago(u.lastSeenAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
