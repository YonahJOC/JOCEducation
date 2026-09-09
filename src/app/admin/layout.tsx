import Link from "next/link";
import Image from "next/image";
import { safeAuth, isAuthConfigured } from "@/auth";
import { canUseAdminConsole } from "@/lib/access";
import { usingSampleData } from "@/lib/admin-data";

export const metadata = { title: "JOC Console", robots: { index: false, follow: false } };

const NAV = [
  { label: "Overview", href: "/admin" },
  { label: "Schools", href: "/admin/schools" },
  { label: "Demo requests", href: "/admin/demos" },
  { label: "People", href: "/admin/users" },
];

const CONTENT_NAV = [
  { label: "Lesson plans", href: "/admin/lessons" },
  { label: "Resources", href: "/admin/resources" },
  { label: "Teachers' Board", href: "/admin/board" },
  { label: "Products", href: "/admin/products" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();

  // Once sign-in is live, only JOC staff get in. Before then the console is
  // reachable so it can be built and reviewed — the banner says so.
  if (isAuthConfigured && !canUseAdminConsole(session?.user)) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <p style={{ fontSize: "34px", marginBottom: "14px" }}>🔒</p>
          <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "10px" }}>
            JOC staff only
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", marginBottom: "22px" }}>
            This console is for the Just One Chesed team. Sign in with your{" "}
            <strong style={{ color: "#10233F" }}>@justonechesed.org</strong> account.
          </p>
          <Link
            href="/"
            style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none" }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const who = session?.user?.email ?? null;
  const role = session?.user?.role ?? null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F7F8FB" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "232px", flexShrink: 0, backgroundColor: "#0B1A31", color: "rgba(255,255,255,.72)",
          display: "flex", flexDirection: "column", padding: "22px 0",
        }}
      >
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,.1)", marginBottom: "16px" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/brand/joc-icon-orange.png" alt="" width={26} height={26} style={{ height: "26px", width: "auto" }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>JOC Console</p>
              <p style={{ fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#FA912D", margin: "2px 0 0", fontWeight: 700 }}>
                Internal
              </p>
            </div>
          </Link>
        </div>

        <SideGroup label="Accounts" items={NAV} />
        <SideGroup label="Content" items={CONTENT_NAV} />

        <div style={{ marginTop: "auto", padding: "16px 20px 0", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          {who && (
            <p style={{ fontSize: "12px", margin: "0 0 3px", color: "rgba(255,255,255,.85)", wordBreak: "break-all" }}>{who}</p>
          )}
          {role && (
            <p style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#FA912D", margin: "0 0 12px", fontWeight: 700 }}>
              {role.replace("_", " ")}
            </p>
          )}
          <Link href="/home" style={{ fontSize: "12.5px", color: "rgba(255,255,255,.6)", textDecoration: "none" }}>
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {usingSampleData && (
          <div style={{ backgroundColor: "#FDEEDA", borderBottom: "1px solid rgba(154,84,5,.2)", padding: "10px 30px" }}>
            <p style={{ fontSize: "13px", color: "#9A5405", margin: 0, lineHeight: 1.5 }}>
              <strong>Sample data.</strong> The database isn&rsquo;t connected yet, so these schools and activity entries are
              illustrative and nothing you change here will save. Add <code style={{ background: "rgba(154,84,5,.12)", padding: "1px 5px", borderRadius: "4px" }}>DATABASE_URL</code> to switch to live data.
            </p>
          </div>
        )}
        <div style={{ padding: "30px" }}>{children}</div>
      </div>
    </div>
  );
}

function SideGroup({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", fontWeight: 700, padding: "0 20px", margin: "0 0 6px" }}>
        {label}
      </p>
      <nav style={{ display: "flex", flexDirection: "column" }}>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            style={{ padding: "9px 20px", fontSize: "14px", color: "rgba(255,255,255,.8)", textDecoration: "none" }}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
