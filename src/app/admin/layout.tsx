import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";

const NAV = [
  { label: "Dashboard",    href: "/admin" },
  { label: "Lesson Plans", href: "/admin/lessons" },
  { label: "Resources",    href: "/admin/resources" },
  { label: "Board",        href: "/admin/board" },
  { label: "Users",        href: "/admin/users" },
  { label: "Products",     href: "/admin/products" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F7FD" }}>
      {/* Sidebar */}
      <aside style={{ width: "232px", flexShrink: 0, backgroundColor: "#10233F", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: "10px" }}>
          <LogoMark size={32} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#fff", letterSpacing: "-0.02em" }}>JOC Education</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.18em", color: "#FA912D", textTransform: "uppercase" }}>ADMIN</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ display: "block", padding: "10px 14px", borderRadius: "10px", fontWeight: 500, fontSize: "14px", color: "rgba(255,255,255,.75)", textDecoration: "none", marginBottom: "2px" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <Link href="/" style={{ fontSize: "13px", color: "rgba(255,255,255,.4)", textDecoration: "none" }}>
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
