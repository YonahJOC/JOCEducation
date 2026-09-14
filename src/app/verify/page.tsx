import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { verifyEmail } from "@/app/actions/signup";

export const metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

const INK = "#10233F";
const BLUE = "#2D46AF";

type Search = Promise<{ token?: string; email?: string }>;

/**
 * The link from the confirmation email. Verifying is what actually grants
 * anything — the account itself was created with nothing.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Search }) {
  const { token = "", email = "" } = await searchParams;
  const result = token && email ? await verifyEmail(email, token) : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: "#FBF9F4" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "36px" }}>
          <LogoMark size={40} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em", color: INK }}>JustOneChesed</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginTop: "2px" }}>EDUCATION</div>
          </div>
        </Link>

        <div style={{ backgroundColor: "#fff", borderRadius: "24px", border: "1px solid rgba(16,35,63,.1)", padding: "36px", textAlign: "center" }}>
          {!result ? (
            <>
              <h1 style={{ fontWeight: 800, fontSize: "23px", letterSpacing: "-0.03em", color: INK, margin: "0 0 10px" }}>
                That link is incomplete
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, margin: 0 }}>
                Open the link from your email exactly as it was sent.
              </p>
            </>
          ) : result.ok ? (
            <>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(27,127,75,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "24px" }}>✓</div>
              <h1 style={{ fontWeight: 800, fontSize: "23px", letterSpacing: "-0.03em", color: INK, margin: "0 0 10px" }}>
                Email confirmed
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, margin: "0 0 24px" }}>
                {result.schoolName
                  ? `You are connected to ${result.schoolName}. Everything your school has access to is waiting.`
                  : result.staff
                  ? "Your Just One Chesed account is active. You have access to the site, the materials and the programs."
                  : "Your account is confirmed. If you should be connected to a school and are not, ask Just One Chesed."}
              </p>
              <Link
                href="/login"
                style={{ display: "block", textAlign: "center", backgroundColor: BLUE, color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ fontWeight: 800, fontSize: "23px", letterSpacing: "-0.03em", color: INK, margin: "0 0 10px" }}>
                That link did not work
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, margin: "0 0 22px" }}>
                {result.error}
              </p>
              <a
                href="mailto:education@justonechesed.org"
                style={{ display: "block", textAlign: "center", backgroundColor: BLUE, color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
              >
                Write to JOC
              </a>
            </>
          )}

          <p style={{ marginTop: "24px", fontSize: "14px", color: "rgba(16,35,63,.55)" }}>
            <Link href="/login" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
