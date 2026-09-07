import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";

const EDUCATION = [
  { label: "Chesed Programs",  href: "/programs" },
  { label: "Lesson Plans",     href: "/lesson-plans" },
  { label: "Resource Library", href: "/resources" },
  { label: "Teachers' Board",  href: "/board" },
  { label: "School Shop",      href: "/shop" },
  { label: "Pricing",          href: "/pricing" },
];

const PROGRAMS = [
  { label: "Kindness Booth",  href: "/portal#kindness-booth" },
  { label: "JOC App",         href: "/portal#joc-app" },
  { label: "Bake for Chesed", href: "/portal#bake" },
  { label: "Just One Tutor",  href: "/portal#tutor" },
  { label: "Chesed Match",    href: "https://chesedmatch.org" },
];

const JOC = [
  { label: "About JustOneChesed", href: "https://justonechesed.org" },
  { label: "Chesed Match",        href: "https://chesedmatch.org" },
  { label: "Volunteer",           href: "https://justonechesed.org/volunteer" },
  { label: "Donate",              href: "https://justonechesed.org/donate" },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#0B1A31", padding: "54px 26px 34px" }}>
      <div
        className="mx-auto grid gap-10"
        style={{
          maxWidth: "1280px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <div className="leading-none">
              <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.025em", color: "#fff" }}>
                JustOneChesed
              </div>
              <div style={{ fontWeight: 700, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginTop: "2px" }}>
                EDUCATION
              </div>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,.55)", lineHeight: 1.6 }}>
            Educating Towards Chesed —<br />Just One Student at a Time.
          </p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,.35)" }}>
            Just One Chesed, Inc. is a registered 501(c)(3) nonprofit organization.
          </p>
        </div>

        {/* Education links */}
        <FooterCol title="Education" links={EDUCATION} />

        {/* Programs links */}
        <FooterCol title="Programs" links={PROGRAMS} />

        {/* JOC links */}
        <FooterCol title="JustOneChesed" links={JOC} />
      </div>

      {/* Bottom rule */}
      <div
        className="mx-auto mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3"
        style={{
          maxWidth: "1280px",
          borderColor: "rgba(255,255,255,.12)",
        }}
      >
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,.35)" }}>
          © {new Date().getFullYear()} Just One Chesed, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00" }}>
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              style={{ fontSize: "14px", color: "rgba(255,255,255,.75)", textDecoration: "none" }}
              className="hover:opacity-80 transition-opacity"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
