import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

type Search = Promise<{ token?: string; email?: string }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Search }) {
  const { token = "", email = "" } = await searchParams;
  const usable = Boolean(token && email);

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
          {usable ? (
            <ResetPasswordForm email={email} token={token} />
          ) : (
            <>
              <h1 style={{ fontWeight: 800, fontSize: "23px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "10px" }}>
                That link is incomplete
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, marginBottom: "22px" }}>
                Open the link from your email exactly as it was sent, or ask for a new one.
              </p>
              <Link
                href="/forgot-password"
                style={{ display: "block", textAlign: "center", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
              >
                Ask for a new link
              </Link>
            </>
          )}

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "rgba(16,35,63,.55)" }}>
            <Link href="/login" style={{ color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
