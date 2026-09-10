"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithGoogle, signInWithPassword } from "@/app/actions/auth";

const INK = "#10233F";
const BLUE = "#2D46AF";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", minHeight: "46px",
  fontSize: "15px", color: INK, backgroundColor: "#F8FAFE",
  border: "1px solid rgba(16,35,63,.18)", borderRadius: "10px",
  outline: "none", fontFamily: "var(--font-outfit)",
};

/**
 * The real sign-in form.
 *
 * What stood here waited 900ms and said "Authentication is not yet
 * configured. Check back soon." — while sign-in was in fact working, on the
 * landing page. Anyone following the header's "Sign in" link was told the
 * site was not ready.
 */
export function LoginForm({
  googleEnabled, passwordEnabled, next,
}: {
  googleEnabled: boolean;
  passwordEnabled: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState(signInWithPassword, {});

  return (
    <>
      {googleEnabled && (
        <>
          <form action={signInWithGoogle}>
            {next && <input type="hidden" name="next" value={next} />}
            <button
              type="submit"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "13px 20px", minHeight: "48px", borderRadius: "12px", border: "1px solid rgba(16,35,63,.18)", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "14.5px", color: INK, marginBottom: "20px", fontFamily: "var(--font-outfit)" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05" />
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(16,35,63,.1)" }} />
            <span style={{ fontSize: "13px", color: "rgba(16,35,63,.4)", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(16,35,63,.1)" }} />
          </div>
        </>
      )}

      {passwordEnabled ? (
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <label htmlFor="email" style={{ display: "block", fontWeight: 600, fontSize: "13.5px", color: INK, marginBottom: "6px" }}>
              Email
            </label>
            <input id="email" name="email" type="email" placeholder="you@school.edu" autoComplete="email" required style={inputStyle} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="password" style={{ fontWeight: 600, fontSize: "13.5px", color: INK }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: "13px", color: BLUE, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required style={inputStyle} />
          </div>

          {state?.error && (
            <p style={{ fontSize: "13.5px", color: "#B91C1C", backgroundColor: "#FEF2F2", borderRadius: "10px", padding: "10px 14px", margin: 0 }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: "4px", width: "100%", fontFamily: "var(--font-outfit)",
              backgroundColor: pending ? "rgba(45,70,175,.6)" : BLUE, color: "#fff",
              fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px",
              minHeight: "48px", border: "none", cursor: pending ? "default" : "pointer",
            }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, margin: 0 }}>
          Sign-in is not switched on yet. Write to{" "}
          <a href="mailto:education@justonechesed.org" style={{ color: BLUE, fontWeight: 600 }}>
            education@justonechesed.org
          </a>{" "}
          and the JOC team will set your school up.
        </p>
      )}
    </>
  );
}
