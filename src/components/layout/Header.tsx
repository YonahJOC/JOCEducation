"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogoMark } from "@/components/ui/LogoMark";

const NAV = [
  { label: "Programs",        href: "/programs" },
  { label: "Lesson Plans",    href: "/lesson-plans" },
  { label: "Resources",       href: "/resources" },
  { label: "Teachers' Board", href: "/board" },
  { label: "Pricing",         href: "/pricing" },
  { label: "Shop",            href: "/shop" },
  { label: "About",           href: "/about" },
  { label: "JOC Portal",      href: "/portal" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
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
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: pathname === item.href ? "#1E47B8" : "#10233F",
                  textDecoration: "none",
                  borderBottom: pathname === item.href ? "2px solid #1E47B8" : "2px solid transparent",
                  paddingBottom: "2px",
                  transition: "color .15s",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <Link
              href="/pricing"
              className="hidden lg:inline-flex"
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 700,
                fontSize: "14px",
                color: "#10233F",
                backgroundColor: "#F7941D",
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
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                <LogoMark size={34} />
                <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "#10233F" }}>JOC Education</div>
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ border: "none", background: "none", cursor: "pointer", fontSize: "22px", color: "#10233F", lineHeight: 1, padding: "4px" }}>
                ×
              </button>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "15px 24px",
                    fontWeight: pathname === item.href ? 700 : 500,
                    fontSize: "16px",
                    color: pathname === item.href ? "#1E47B8" : "#10233F",
                    textDecoration: "none",
                    borderLeft: pathname === item.href ? "3px solid #1E47B8" : "3px solid transparent",
                    backgroundColor: pathname === item.href ? "rgba(30,71,184,.06)" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Drawer footer */}
            <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(16,35,63,.1)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link
                href="/pricing"
                style={{ display: "block", textAlign: "center", backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 24px", textDecoration: "none" }}
              >
                Bring JOC to your school
              </Link>
              <Link
                href="/login"
                style={{ display: "block", textAlign: "center", color: "#10233F", fontWeight: 500, fontSize: "14px", textDecoration: "none", opacity: 0.65 }}
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
