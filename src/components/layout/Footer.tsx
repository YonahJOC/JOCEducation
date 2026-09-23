import Link from "next/link";
import Image from "next/image";
import { getPublishedPrograms } from "@/lib/content";

const EDUCATION = [
  { label: "Chesed Programs",  href: "/programs" },
  { label: "Lesson Plans",     href: "/lesson-plans" },
  { label: "Resource Library", href: "/resources" },
  { label: "Teachers' Board",  href: "/board" },
  { label: "School Shop",      href: "/shop" },
  { label: "Pricing",          href: "/pricing" },
  { label: "About us",         href: "/about" },
];

/**
 * The programs column, read from the console rather than typed here.
 *
 * It was a hand-written list of five, and by the time anyone noticed it was
 * missing three — a program added in the console appeared on /programs and
 * nowhere else. A footer that has to be edited in code every time the team
 * adds a program is a footer that is wrong most of the time.
 */
/**
 * At most six, so one long column does not unbalance the footer.
 *
 * There is no hardcoded list behind this any more. A third copy of the
 * programs — after the database and the static fallback — meant the footer
 * could name a program the site no longer ran, and quietly link to a 404.
 * An empty list is an honest footer.
 */
async function programLinks() {
  try {
    const rows = await getPublishedPrograms();
    return rows.slice(0, 6).map((p) => ({ label: p.name, href: `/programs/${p.slug}` }));
  } catch {
    return [];
  }
}

const JOC = [
  { label: "About JustOneChesed", href: "https://justonechesed.org" },
  { label: "Contact us",          href: "/contact" },
  { label: "Chesed Match",        href: "https://chesedmatch.org" },
  { label: "Volunteer",           href: "https://justonechesed.org/volunteer" },
  { label: "Donate",              href: "https://justonechesed.org/donate" },
];

export async function Footer() {
  const PROGRAMS = await programLinks();
  return (
    <footer style={{ backgroundColor: "#10233F", padding: "54px 26px 34px" }}>
      <div
        className="mx-auto grid gap-10"
        style={{
          maxWidth: "1280px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          {/* Dark ground, so the white wordmark rather than the blue mark. */}
          <div>
            <Image
              src="/brand/joc-wordmark-white.png"
              alt="JustOneChesed"
              width={170}
              height={21}
              style={{ height: "20px", width: "auto", display: "block" }}
            />
            <div style={{ fontWeight: 700, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#FA912D", marginTop: "7px" }}>
              EDUCATION
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
      <h3 style={{ fontWeight: 700, fontSize: "12px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00" }}>
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
