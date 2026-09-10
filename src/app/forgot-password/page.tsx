import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: "#FBF9F4" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "36px" }}>
          <LogoMark size={40} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em", color: "#10233F" }}>JustOneChesed</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginTop: "2px" }}>EDUCATION</div>
          </div>
        </Link>

        <div style={{ backgroundColor: "#fff", borderRadius: "24px", border: "1px solid rgba(16,35,63,.1)", padding: "36px" }}>
          <ForgotPasswordForm />

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "rgba(16,35,63,.55)" }}>
            <Link href="/login" style={{ color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
