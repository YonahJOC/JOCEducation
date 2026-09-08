import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users — Admin" };

export default function AdminUsersPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "8px" }}>Users</h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)", marginBottom: "32px" }}>View accounts, roles, and subscription status</p>

      <div style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔌</div>
        <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#10233F", marginBottom: "10px" }}>Database not connected</h2>
        <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", lineHeight: 1.6, maxWidth: "44ch" }}>
          Add <code style={{ backgroundColor: "#F4F7FD", borderRadius: "6px", padding: "2px 6px", fontSize: "13px" }}>DATABASE_URL</code> and <code style={{ backgroundColor: "#F4F7FD", borderRadius: "6px", padding: "2px 6px", fontSize: "13px" }}>DIRECT_URL</code> to <code style={{ backgroundColor: "#F4F7FD", borderRadius: "6px", padding: "2px 6px", fontSize: "13px" }}>.env.local</code>, then run <code style={{ backgroundColor: "#F4F7FD", borderRadius: "6px", padding: "2px 6px", fontSize: "13px" }}>npm run db:migrate</code> to see user accounts here.
        </p>
      </div>
    </div>
  );
}
