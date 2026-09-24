import Link from "next/link";
import { BrandLockup } from "@/components/ui/Brand";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { C } from "@/lib/joc-tokens";

export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: C.paper }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "36px" }}>
          <BrandLockup height={20} />
        </Link>

        <div style={{ backgroundColor: C.white, borderRadius: "24px", border: `1px solid ${C.hairline}`, padding: "36px" }}>
          <ForgotPasswordForm />

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: C.muted }}>
            <Link href="/login" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
