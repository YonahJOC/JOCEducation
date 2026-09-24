import Link from "next/link";
import { BrandLockup } from "@/components/ui/Brand";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { pageTitle, C } from "@/lib/joc-tokens";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

type Search = Promise<{ token?: string; email?: string }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Search }) {
  const { token = "", email = "" } = await searchParams;
  const usable = Boolean(token && email);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: C.paper }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "36px" }}>
          <BrandLockup height={20} />
        </Link>

        <div style={{ backgroundColor: C.white, borderRadius: "24px", border: `1px solid ${C.hairline}`, padding: "36px" }}>
          {usable ? (
            <ResetPasswordForm email={email} token={token} />
          ) : (
            <>
              <h1 style={{ ...pageTitle, color: C.ink, marginBottom: "10px" }}>
                That link is incomplete
              </h1>
              <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, marginBottom: "22px" }}>
                Open the link from your email exactly as it was sent, or ask for a new one.
              </p>
              <Link
                href="/forgot-password"
                style={{ display: "block", textAlign: "center", backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
              >
                Ask for a new link
              </Link>
            </>
          )}

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: C.muted }}>
            <Link href="/login" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
