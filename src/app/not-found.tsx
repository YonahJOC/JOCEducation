import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";

export default function NotFound() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
      <div style={{ maxWidth: "520px", textAlign: "center" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "40px" }}>
          <LogoMark size={44} />
          <div style={{ textAlign: "left", lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.025em", color: "#10233F" }}>JustOneChesed</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#C96C00", marginTop: "3px" }}>EDUCATION</div>
          </div>
        </Link>

        <div style={{ fontWeight: 800, fontSize: "96px", lineHeight: 1, letterSpacing: "-0.05em", color: "#F4F7FD", marginBottom: "24px" }}>
          404
        </div>

        <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 5vw, 36px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "14px" }}>
          This page doesn't exist.
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(16,35,63,.62)", lineHeight: 1.6, marginBottom: "36px" }}>
          The link may be broken, or the page may have moved. Try heading back home.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{ backgroundColor: "#1E47B8", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none" }}
          >
            Back to home
          </Link>
          <Link
            href="/lesson-plans"
            style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none" }}
          >
            Browse lesson plans
          </Link>
        </div>
      </div>
    </div>
  );
}
