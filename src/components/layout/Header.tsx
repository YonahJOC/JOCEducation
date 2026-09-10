"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LogoMark } from "@/components/ui/LogoMark";
import { signOutAction } from "@/app/actions/auth";

const NAV = [
  { label: "Programs",        href: "/programs" },
  { label: "Chesed Cycles",  href: "/cycles" },
  { label: "Lesson Plans",    href: "/lesson-plans" },
  { label: "Resources",       href: "/resources" },
  { label: "Teachers' Board", href: "/board" },
  { label: "Pricing",         href: "/pricing" },
  { label: "Shop",            href: "/shop" },
  { label: "About",           href: "/about" },
];

/** Only for people who are signed in — it redirects everyone else. */
const HOME_ITEM = { label: "Your home", href: "/home" };


/**
 * Who is signed in, as far as the header needs to know. Resolved on the
 * server in the root layout — the header itself never touches the session.
 */
export type HeaderAccount = {
  email: string;
  name: string | null;
  roleLabel: string;
  /** Can open the JOC Console — educational team and above. */
  console: boolean;
  /** Runs a school and can open their own school panel. */
  school: boolean;
} | null;

export function Header({ account = null }: { account?: HeaderAccount }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = account ? [...NAV, HOME_ITEM] : NAV;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "rgba(251,249,244,.94)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "rgba(16,35,63,.1)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between gap-4 px-[26px] py-[13px]"
          style={{ maxWidth: "1280px" }}
        >
          {/* Brand */}
          <Link href={account ? "/home" : "/"} className="flex items-center gap-3" style={{ textDecoration: "none" }}>
            <LogoMark size={40} />
            <div className="leading-none">
              <div style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "16.5px", letterSpacing: "-0.025em", color: "#10233F" }}>
                JustOneChesed
              </div>
              <div style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginTop: "2px" }}>
                EDUCATION
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-[18px]">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: pathname === item.href ? "#2D46AF" : "#10233F",
                  textDecoration: "none",
                  borderBottom: pathname === item.href ? "2px solid #2D46AF" : "2px solid transparent",
                  paddingBottom: "2px",
                  transition: "color .15s",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {account ? (
              <>
                {account.console && (
                  <Link
                    href="/admin"
                    className="hidden lg:inline-flex"
                    style={{
                      fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px",
                      color: "#fff", backgroundColor: "#0B1A31", borderRadius: "9999px",
                      padding: "10px 18px", textDecoration: "none", whiteSpace: "nowrap",
                    }}
                  >
                    Console
                  </Link>
                )}
                {account.school && (
                  <Link
                    href="/school"
                    className="hidden lg:inline-flex"
                    style={{
                      fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px",
                      color: "#10233F", backgroundColor: "#F4F7FD", borderRadius: "9999px",
                      padding: "10px 18px", textDecoration: "none", whiteSpace: "nowrap",
                    }}
                  >
                    My school
                  </Link>
                )}
                <AccountMenu account={account} />
              </>
            ) : (
              <>
                {/* Desktop CTA */}
                <Link
                  href="/pricing"
                  className="hidden lg:inline-flex"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#10233F",
                    backgroundColor: "#FA912D",
                    borderRadius: "9999px",
                    padding: "11px 22px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Bring JOC to your school
                </Link>

                {/* Login link */}
                <Link
                  href="/login"
                  className="hidden lg:inline-flex"
                  style={{ fontFamily: "var(--font-outfit)", fontWeight: 500, fontSize: "14px", color: "#10233F", textDecoration: "none", opacity: 0.65 }}
                >
                  Sign in
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button
              className="lg:hidden flex flex-col justify-center items-center gap-[5px]"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              style={{ width: "40px", height: "40px", border: "none", background: "none", cursor: "pointer", padding: "8px" }}
            >
              <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "#10233F", borderRadius: "2px" }} />
              <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "#10233F", borderRadius: "2px" }} />
              <span style={{ display: "block", width: "14px", height: "2px", backgroundColor: "#10233F", borderRadius: "2px" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(16,35,63,.35)" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: "min(320px, 88vw)",
              backgroundColor: "#FBF9F4",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 32px rgba(16,35,63,.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(16,35,63,.1)" }}>
              <Link href={account ? "/home" : "/"} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                <LogoMark size={34} />
                <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "#10233F" }}>JOC Education</div>
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ border: "none", background: "none", cursor: "pointer", fontSize: "22px", color: "#10233F", lineHeight: 1, padding: "4px" }}>
                ×
              </button>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "15px 24px",
                    fontWeight: pathname === item.href ? 700 : 500,
                    fontSize: "16px",
                    color: pathname === item.href ? "#2D46AF" : "#10233F",
                    textDecoration: "none",
                    borderLeft: pathname === item.href ? "3px solid #2D46AF" : "3px solid transparent",
                    backgroundColor: pathname === item.href ? "rgba(45,70,175,.06)" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              ))}

              {account && (account.console || account.school) && (
                <>
                  <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", margin: "14px 24px 4px" }}>
                    {account.roleLabel}
                  </p>
                  {account.console && (
                    <Link href="/admin" style={{ display: "block", padding: "15px 24px", fontWeight: 700, fontSize: "16px", color: "#2D46AF", textDecoration: "none" }}>
                      JOC Console
                    </Link>
                  )}
                  {account.school && (
                    <Link href="/school" style={{ display: "block", padding: "15px 24px", fontWeight: 700, fontSize: "16px", color: "#2D46AF", textDecoration: "none" }}>
                      My school
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Drawer footer */}
            <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(16,35,63,.1)", display: "flex", flexDirection: "column", gap: "12px" }}>
              {account ? (
                <>
                  <Link
                    href="/account"
                    style={{ display: "block", textAlign: "center", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 24px", textDecoration: "none" }}
                  >
                    Your account
                  </Link>
                  <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", textAlign: "center", margin: 0, wordBreak: "break-all" }}>{account.email}</p>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      style={{ width: "100%", fontFamily: "var(--font-outfit)", color: "#10233F", fontWeight: 500, fontSize: "14px", background: "none", border: "none", cursor: "pointer", opacity: 0.65, minHeight: "44px" }}
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/pricing"
                    style={{ display: "block", textAlign: "center", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 24px", textDecoration: "none" }}
                  >
                    Bring JOC to your school
                  </Link>
                  <Link
                    href="/login"
                    style={{ display: "block", textAlign: "center", color: "#10233F", fontWeight: 500, fontSize: "14px", textDecoration: "none", opacity: 0.65 }}
                  >
                    Sign in to your account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** The signed-in initial, with the few things an account can do behind it. */
function AccountMenu({ account }: { account: NonNullable<HeaderAccount> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function away(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const initial = (account.name ?? account.email).trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={box} className="hidden lg:block" style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Your account"
        aria-expanded={open}
        style={{
          width: "38px", height: "38px", borderRadius: "9999px", border: "1px solid rgba(16,35,63,.15)",
          backgroundColor: "#2D46AF", color: "#fff", fontFamily: "var(--font-outfit)",
          fontWeight: 700, fontSize: "15px", cursor: "pointer",
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "46px", width: "250px",
            backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.12)", borderRadius: "14px",
            boxShadow: "0 14px 38px rgba(16,35,63,.16)", padding: "14px", zIndex: 50,
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#10233F", margin: 0 }}>
            {account.name ?? account.email}
          </p>
          <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0", wordBreak: "break-all" }}>
            {account.email}
          </p>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "#C96C00", margin: "6px 0 0" }}>
            {account.roleLabel}
          </p>

          <div style={{ borderTop: "1px solid rgba(16,35,63,.1)", margin: "12px 0", paddingTop: "4px" }}>
            <MenuLink href="/home">Your home</MenuLink>
            {account.console && <MenuLink href="/admin">JOC Console</MenuLink>}
            {account.school && <MenuLink href="/school">My school</MenuLink>}
            <MenuLink href="/account">Account settings</MenuLink>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              style={{
                width: "100%", textAlign: "left", fontFamily: "var(--font-outfit)", fontSize: "14px",
                fontWeight: 600, color: "#B8321E", background: "none", border: "none",
                cursor: "pointer", padding: "8px 6px",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ display: "block", padding: "8px 6px", fontSize: "14px", color: "#10233F", textDecoration: "none" }}
    >
      {children}
    </Link>
  );
}
