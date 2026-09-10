import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/ui/LogoMark";
import { safeAuth, isGoogleConfigured, isPasswordConfigured } from "@/auth";
import { LoginForm } from "./LoginForm";

type Search = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;

  // Already signed in — no reason to show this.
  const session = await safeAuth();
  if (session?.user) redirect(next?.startsWith("/") ? next : "/home");

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
          <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Welcome back</h1>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "28px" }}>Sign in to your JOC Education account.</p>

          <LoginForm
            googleEnabled={isGoogleConfigured}
            passwordEnabled={isPasswordConfigured}
            next={next?.startsWith("/") ? next : undefined}
          />

          <p style={{ marginTop: "22px", textAlign: "center", fontSize: "14px", color: "rgba(16,35,63,.6)" }}>
            Don&rsquo;t have an account?{" "}
            <Link href="/signup" style={{ color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
