import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin" };

const SECTIONS = [
  { title: "Lesson Plans", href: "/admin/lessons", icon: "📄", description: "Add, edit, or unpublish lesson plans", count: "9" },
  { title: "Resources",    href: "/admin/resources", icon: "📦", description: "Manage resource library entries", count: "460+" },
  { title: "Board Posts",  href: "/admin/board", icon: "💬", description: "Approve and moderate Teachers' Board posts", count: "12" },
  { title: "Users",        href: "/admin/users", icon: "👤", description: "View accounts and subscription status", count: "—" },
  { title: "Products",     href: "/admin/products", icon: "🛒", description: "Manage shop items and Stripe pricing", count: "5" },
];

export default function AdminDashboard() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "32px", letterSpacing: "-0.035em", color: "#10233F", marginBottom: "6px" }}>Admin dashboard</h1>
        <p style={{ fontSize: "15px", color: "rgba(16,35,63,.55)" }}>JOC Education content management</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "24px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "26px" }}>{s.icon}</span>
              <span style={{ fontWeight: 700, fontSize: "22px", color: "#10233F", letterSpacing: "-0.035em" }}>{s.count}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "4px" }}>{s.title}</div>
              <div style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)", lineHeight: 1.5 }}>{s.description}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* System notes */}
      <div style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "24px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "16px" }}>Setup checklist</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            ["Connect Supabase", "Add DATABASE_URL and DIRECT_URL to .env.local, then run: npm run db:migrate"],
            ["Run database seed", "After migrations: npm run db:seed — seeds 9 lesson plans and 5 products"],
            ["Configure Google OAuth", "Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env.local"],
            ["Add NextAuth secret", "Set AUTH_SECRET in .env.local (generate with: openssl rand -base64 32)"],
            ["Configure Stripe", "Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env.local when ready"],
          ].map(([label, detail]) => (
            <li key={label as string} style={{ display: "flex", gap: "12px", padding: "11px 0", borderBottom: "1px solid rgba(16,35,63,.07)" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid rgba(16,35,63,.18)", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "14.5px", color: "#10233F", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", fontFamily: "monospace" }}>{detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
