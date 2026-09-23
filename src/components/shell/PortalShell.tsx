import Link from "next/link";
import Image from "next/image";
import { ShellNav } from "./ShellNav";
import { SIDE, type NavItem } from "@/lib/nav";
import { C, R, label, F } from "@/lib/joc-tokens";

/**
 * One shell, both sides of the portal.
 *
 * The console and the school panel had grown separate layouts doing the same
 * three things and had drifted apart in every measurement. They differ only
 * where they should: the JOC side wears ink because it is the staff room, the
 * school side wears panel because it is the school's own.
 *
 * `bleed` is for anything that wants the full width of the main area rather
 * than the 1080 column — a program's colour band, which looked like a floating
 * rectangle when it tried to escape the column with negative margins.
 */

export function PortalShell({
  side, who, role, items, action, bleed, children,
}: {
  side: "joc" | "school";
  /** The name in the rail: the school, or the signed-in person. */
  who: string;
  /** Their role, or the school's name, under the wordmark. */
  role: string;
  items: NavItem[];
  /** The way out, bottom of the rail. */
  action?: React.ReactNode;
  /** Full-width, above the content column. */
  bleed?: React.ReactNode;
  children: React.ReactNode;
}) {
  const s = SIDE[side];
  const hairline = side === "joc" ? "rgba(255,255,255,.12)" : C.hairline;

  return (
    <div className="joc-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: C.paper }}>
      <aside
        className="joc-shell-rail"
        style={{
          width: "236px", flexShrink: 0, backgroundColor: s.rail, color: s.railText,
          display: "flex", flexDirection: "column", padding: "22px 0",
        }}
      >
        <div
          className="joc-shell-brand"
          style={{ padding: "0 20px 18px", borderBottom: `1px solid ${hairline}`, marginBottom: "16px" }}
        >
          <Link href={side === "joc" ? "/admin" : "/school"} style={{ display: "block", textDecoration: "none" }}>
            <Image
              src={s.wordmark}
              alt="JustOneChesed"
              width={165}
              height={20}
              priority
              style={{ height: "19px", width: "auto", display: "block" }}
            />
            <p style={{ ...label, color: s.accent, margin: "8px 0 0" }}>{role}</p>
          </Link>
        </div>

        <div className="joc-shell-nav">
          <ShellNav items={items} side={side} />
        </div>

        <div
          className="joc-shell-who"
          style={{ marginTop: "auto", padding: "16px 20px 0", borderTop: `1px solid ${hairline}` }}
        >
          <p style={{
            fontFamily: F.ui, fontSize: "13px", lineHeight: 1.5, margin: "0 0 10px",
            color: side === "joc" ? "rgba(255,255,255,.7)" : C.muted,
            wordBreak: "break-word",
          }}>
            {who}
          </p>
          {action}
        </div>
      </aside>

      <main className="joc-shell-main" style={{ flex: 1, minWidth: 0 }}>
        {bleed}

        {/* A grid, not a padded box: every child sits in the 1080 column, and
            one that asks for it — className="joc-bleed" — spans the gutters
            too, which is how a program's colour band runs edge to edge. */}
        <div className="joc-shell-body">{children}</div>
      </main>
    </div>
  );
}

/** The way out of either side, styled for the rail it sits in. */
export function ShellExit({ side, href, children }: { side: "joc" | "school"; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
        color: side === "joc" ? C.white : C.ink,
        backgroundColor: side === "joc" ? "rgba(255,255,255,.12)" : C.white,
        border: side === "joc" ? "none" : `1px solid ${C.hairline}`,
        borderRadius: R.button, padding: "11px 14px", minHeight: "44px",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
