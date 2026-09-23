"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { ROW_SHADOW, R, C } from "@/lib/joc-tokens";
import Link from "next/link";
import { signInWithGoogle, signInWithPassword } from "@/app/actions/auth";

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-outfit)",
  fontSize: "15px",
  color: C.ink,
  backgroundColor: "#F8FAFE",
  border: `1px solid ${C.hairline}`,
  borderRadius: "12px",
  padding: "13px 14px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#4A5A74",
  marginBottom: "6px",
};

export function AuthCard({
  defaultTab = "login",
  googleEnabled = false,
  passwordEnabled = false,
  next,
}: {
  defaultTab?: "login" | "signup";
  googleEnabled?: boolean;
  /** Email + password sign-in is live (interim, until Google is configured). */
  passwordEnabled?: boolean;
  /** Where the gate was sending them before it asked them to sign in. */
  next?: string;
}) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [signInState, signInAction, signingIn] = useActionState(signInWithPassword, {});

  // Header "Sign in" focuses the email field via #auth
  useEffect(() => {
    function onHash() {
      if (window.location.hash === "#auth") {
        setTab("login");
        emailRef.current?.focus();
      }
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // There used to be a handleSubmit here that waited 700ms and then said
  // sign-in was not switched on. It has been switched on since the day the
  // database was connected, and this card was still the front door telling
  // people otherwise. Both tabs now do the real thing, or say plainly that
  // they cannot.

  return (
    <div
      id="auth"
      style={{
        backgroundColor: "#fff",
        borderRadius: "24px",
        border: `1px solid ${C.hairline}`,
        boxShadow: ROW_SHADOW,
        padding: "26px",
      }}
    >
      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="Sign in or create an account"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          backgroundColor: "#F4F7FD",
          borderRadius: R.chip,
          padding: "4px",
          marginBottom: "22px",
        }}
      >
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 600,
              fontSize: "14px",
              padding: "10px 12px",
              borderRadius: R.chip,
              border: "none",
              cursor: "pointer",
              minHeight: "44px",
              backgroundColor: tab === t ? "#fff" : "transparent",
              color: tab === t ? C.ink : "#4A5A74",
              boxShadow: tab === t ? ROW_SHADOW : "none",
              transition: "background .15s, color .15s",
            }}
          >
            {t === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {/* Google — a real sign-in once AUTH_GOOGLE_ID/SECRET are set */}
      <form action={googleEnabled ? signInWithGoogle : undefined}>
      <button
        type={googleEnabled ? "submit" : "button"}
        onClick={
          googleEnabled
            ? undefined
            : () =>
                setNotice("Google sign-in isn't switched on yet. Book a demo below to get your school set up.")
        }
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontFamily: "var(--font-outfit)",
          fontWeight: 600,
          fontSize: "14.5px",
          color: C.ink,
          backgroundColor: "#fff",
          border: `1.5px solid ${C.hairline}`,
          borderRadius: R.chip,
          padding: "13px 18px",
          minHeight: "44px",
          cursor: "pointer",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
        </svg>
        Continue with Google
      </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
        <span style={{ flex: 1, height: "1px", backgroundColor: C.hairline }} />
        <span style={{ fontSize: "12px", color: "#4A5A74" }}>or</span>
        <span style={{ flex: 1, height: "1px", backgroundColor: C.hairline }} />
      </div>

      {/* Creating an account is its own page, with the questions a new
          account actually needs — name, school, role. Half of that form
          repeated here would be a second signup form to keep in step with
          the first, and the first would win. */}
      {tab === "signup" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>
            Anyone can make an account. It starts with nothing attached to it — what you can see
            follows your school, once your address is verified.
          </p>
          <Link
            href="/signup"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "15px",
              color: "#fff", backgroundColor: C.blue, borderRadius: R.chip,
              padding: "14px 20px", minHeight: "44px", textDecoration: "none",
            }}
          >
            Create an account
          </Link>
        </div>
      ) : (
      <form
        action={signInAction}
        style={{ display: "flex", flexDirection: "column", gap: "14px" }}
      >
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label htmlFor="email" style={labelStyle}>School email</label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@yourschool.org"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <Link
              href="/forgot-password"
              style={{ fontSize: "13px", color: C.blue, textDecoration: "none", fontWeight: 500 }}
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={signingIn || !passwordEnabled}
          style={{
            width: "100%",
            fontFamily: "var(--font-outfit)",
            fontWeight: 700,
            fontSize: "15px",
            color: "#fff",
            backgroundColor: C.blue,
            border: "none",
            borderRadius: R.chip,
            padding: "14px 20px",
            minHeight: "44px",
            cursor: signingIn || !passwordEnabled ? "default" : "pointer",
            opacity: signingIn || !passwordEnabled ? 0.7 : 1,
            marginTop: "2px",
          }}
        >
          {signingIn ? "One moment…" : "Sign in"}
        </button>

        {/* Said plainly rather than after a fake wait. */}
        {!passwordEnabled && !googleEnabled && (
          <p role="status" style={{ fontSize: "13px", lineHeight: 1.5, color: "#C96C00", backgroundColor: "#FFF0E0", borderRadius: "12px", padding: "11px 14px", margin: 0 }}>
            Signing in is not available right now. Book a walkthrough below and the JOC team will
            sort your school out.
          </p>
        )}

        {signInState?.error && (
          <p
            role="alert"
            style={{
              fontSize: "13px", lineHeight: 1.5, color: "#A3261A",
              backgroundColor: "rgba(184,50,30,.07)", borderRadius: "12px",
              padding: "11px 14px", margin: 0,
            }}
          >
            {signInState.error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            style={{
              fontSize: "13px",
              lineHeight: 1.5,
              color: "#C96C00",
              backgroundColor: "#FFF0E0",
              borderRadius: "12px",
              padding: "11px 14px",
              margin: 0,
            }}
          >
            {notice}
          </p>
        )}
      </form>
      )}

      <p
        style={{
          fontSize: "13px",
          lineHeight: 1.55,
          color: "#4A5A74",
          marginTop: "18px",
          paddingTop: "16px",
          borderTop: `1px solid ${C.hairline}`,
        }}
      >
        Sign in with your <strong>school email address</strong> to be matched to your school. Not a partner
        yet?{" "}
        <a href="#demo" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>
          Book a walkthrough
        </a>
        .
      </p>
    </div>
  );
}
