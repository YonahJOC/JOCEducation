import Link from "next/link";
import Image from "next/image";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE_TEXT = "#C96C00";
const RULE = "rgba(16,35,63,.12)";

/** Shared shell for the privacy and terms pages, which sit outside the login gate. */
export function LegalPage({
  title, updated, children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#FBF9F4", minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "16px 26px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "11px", textDecoration: "none" }}>
            <Image src="/brand/joc-wordmark.png" alt="JustOneChesed" width={150} height={18} style={{ height: "18px", width: "auto" }} />
            <span aria-hidden="true" style={{ width: "1px", height: "18px", backgroundColor: RULE }} />
            <span style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT }}>
              Education
            </span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 26px 80px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 42px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: INK, margin: "0 0 10px" }}>
          {title}
        </h1>
        <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)", margin: "0 0 34px", paddingBottom: "22px", borderBottom: `1px solid ${RULE}` }}>
          Last updated {updated}
        </p>
        <div style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(16,35,63,.82)" }}>{children}</div>

        <p style={{ marginTop: "44px", paddingTop: "22px", borderTop: `1px solid ${RULE}`, fontSize: "14px" }}>
          <Link href="/" style={{ color: BLUE, textDecoration: "none", fontWeight: 600 }}>
            ← Back to JOC Education
          </Link>
        </p>
      </main>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontWeight: 700, fontSize: "19px", letterSpacing: "-0.02em", color: INK, margin: "34px 0 10px" }}>
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 14px" }}>{children}</p>;
}

export function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 14px", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "9px" }}>
      {items.map((t) => (
        <li key={t} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#FA912D", flexShrink: 0, marginTop: "10px" }} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
