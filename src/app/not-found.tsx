import Link from "next/link";
import { BrandLockup } from "@/components/ui/Brand";
import { C, R } from "@/lib/joc-tokens";

export default function NotFound() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
      <div style={{ maxWidth: "520px", textAlign: "center" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "40px" }}>
          <BrandLockup height={20} />
        </Link>

        <div style={{ fontWeight: 800, fontSize: "96px", lineHeight: 1, letterSpacing: "-0.05em", color: C.panel, marginBottom: "24px" }}>
          404
        </div>

        <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 5vw, 36px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: C.ink, marginBottom: "14px" }}>
          This page doesn't exist.
        </h1>
        <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, marginBottom: "36px" }}>
          The link may be broken, or the page may have moved. Try heading back home.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{ backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "14px 28px", textDecoration: "none" }}
          >
            Back to home
          </Link>
          <Link
            href="/lesson-plans"
            style={{ backgroundColor: C.panel, color: C.ink, fontWeight: 600, fontSize: "15px", borderRadius: R.chip, padding: "14px 28px", textDecoration: "none" }}
          >
            Browse lesson plans
          </Link>
        </div>
      </div>
    </div>
  );
}
