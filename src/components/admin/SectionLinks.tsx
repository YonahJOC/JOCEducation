import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { can, type Capability } from "@/lib/access";
import { C, R, F } from "@/lib/joc-tokens";

/**
 * The rest of a section, as links across the top of its main page.
 *
 * Cutting the sidebar from twenty links to seven was right — it had become a
 * list of what the software can do rather than of what a person came to do.
 * But the thirteen pages it dropped still exist, and three of them ended up
 * with no way in at all: pricing, the status board, and admin types, which is
 * the keys to everything.
 *
 * So each of the seven is a hub, and the pages that belong under it are
 * listed on it. Only ones the reader can actually open: a link to a page that
 * refuses you reads as broken rather than as not yours.
 */

type SectionKey = "schools" | "material" | "money" | "access" | "programs";

const SECTIONS: Record<SectionKey, { href: string; label: string; need: Capability }[]> = {
  schools: [
    { href: "/admin/schools/status", label: "Status board", need: "schools" },
    { href: "/admin/demos", label: "Demo requests", need: "demos" },
  ],
  material: [
    { href: "/admin/resources", label: "Resources", need: "resources" },
    { href: "/admin/files", label: "Files", need: "resources" },
    { href: "/admin/coverage", label: "Cycle coverage", need: "lessons" },
    { href: "/admin/cycles", label: "Chesed Cycles", need: "cycles" },
    { href: "/admin/board", label: "Teachers' Board", need: "board" },
    { href: "/admin/rooms", label: "Discussion rooms", need: "rooms" },
    { href: "/admin/site", label: "Words on the site", need: "site" },
  ],
  money: [
    { href: "/admin/pricing", label: "Pricing", need: "pricing" },
    { href: "/admin/products", label: "Shop products", need: "shop" },
  ],
  access: [
    { href: "/admin/roles", label: "Admin types", need: "users" },
  ],
  programs: [
    { href: "/admin/programs", label: "The public write-ups", need: "programs" },
    { href: "/admin/forms", label: "Forms", need: "forms" },
    // The rail drops Calendar for somebody who holds every capability, so
    // this is their way in. The programming team keeps it in the rail.
    { href: "/admin/programming", label: "Calendar", need: "programming" },
  ],
};

export async function SectionLinks({ section }: { section: SectionKey }) {
  const session = await safeAuth();
  const items = SECTIONS[section].filter((i) => openForReview || can(session?.user, i.need));

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Also in this section"
      style={{ display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "center" }}
    >
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          style={{
            display: "inline-flex", alignItems: "center",
            fontFamily: F.ui, fontSize: "15px", fontWeight: 600,
            color: C.blue, textDecoration: "underline", minHeight: "44px",
          }}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
