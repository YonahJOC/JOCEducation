import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";

const NAV = [
  { label: "Programs",       href: "/programs" },
  { label: "Lesson Plans",   href: "/lesson-plans" },
  { label: "Resources",      href: "/resources" },
  { label: "Teachers' Board",href: "/board" },
  { label: "Pricing",        href: "/pricing" },
  { label: "Shop",           href: "/shop" },
  { label: "JOC Portal",     href: "/portal" },
];

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(251,249,244,.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(16,35,63,.1)",
      }}
    >
      <div
        className="mx-auto flex flex-wrap items-center justify-between gap-4 px-[26px] py-[13px]"
        style={{ maxWidth: "1280px" }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={40} />
          <div className="leading-none">
            <div
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 700,
                fontSize: "16.5px",
                letterSpacing: "-0.025em",
                color: "#10233F",
              }}
            >
              JustOneChesed
            </div>
            <div
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#C96C00",
                marginTop: "2px",
              }}
            >
              EDUCATION
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-[21px]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 500,
                fontSize: "14.5px",
                color: "#10233F",
                textDecoration: "none",
              }}
              className="hover:opacity-70 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/pricing"
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
          className="transition-opacity hover:opacity-90"
        >
          Bring JOC to your school
        </Link>
      </div>
    </header>
  );
}
