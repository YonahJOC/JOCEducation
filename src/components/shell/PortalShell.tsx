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
  side, who, role, items, action, signOut, bleed, children,
}: {
  side: "joc" | "school";
  /** The name in the rail: the school, or the signed-in person. */
  who: string;
  /** Their role, or the school's name, under the wordmark. */
  role: string;
  items: NavItem[];
  /** The way out, bottom of the rail. */
  action?: React.ReactNode;
  /** Sign out, as an icon inside the JOC user card. */
  signOut?: React.ReactNode;
  /** Full-width, above the content column. */
  bleed?: React.ReactNode;
  children: React.ReactNode;
}) {
  const s = SIDE[side];
  const hairline = C.hairline;

  return (
    <div className="joc-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: C.paper }}>
      <aside
        className="joc-shell-rail"
        style={{
          width: side === "joc" ? "216px" : "236px",
          flexShrink: 0, backgroundColor: s.rail, color: s.railText,
          display: "flex", flexDirection: "column",
          padding: side === "joc" ? "24px 12px 16px" : "22px 0",
        }}
      >
        <div
          className="joc-shell-brand"
          style={
            side === "joc"
              ? { padding: "0 8px 18px", marginBottom: "4px" }
              : { padding: "0 20px 18px", borderBottom: `1px solid ${hairline}`, marginBottom: "16px" }
          }
        >
          <Link href={side === "joc" ? "/admin" : "/school"} style={{ display: "block", textDecoration: "none" }}>
            <Image
              src={s.wordmark}
              alt="JustOneChesed"
              width={165}
              height={20}
              priority
              style={{
                height: side === "joc" ? "22px" : "19px",
                width: "auto", maxWidth: "100%", display: "block",
              }}
            />
            {side === "joc" ? null : (
              <p style={{ ...label, color: s.accent, margin: "8px 0 0" }}>{role}</p>
            )}
          </Link>
        </div>

        <div className="joc-shell-nav" style={{ padding: "0 14px" }}>
          <ShellNav items={items} side={side} />
        </div>

        {/* Who you are, at the foot of the rail.
            
            On the JOC side it is a white card: the name, the role beside it
            rather than orphaned under the wordmark, and sign-out as an icon
            at the end. "Back to the site" stays its own link underneath,
            because leaving the console and leaving your account are not the
            same action and should not look alike. */}
        <div
          className="joc-shell-who"
          style={
            side === "joc"
              ? { marginTop: "auto", padding: "12px 0 0" }
              : { marginTop: "auto", padding: "16px 20px 0", borderTop: `1px solid ${hairline}` }
          }
        >
          <div
            style={
              side === "joc"
                ? {
                    display: "flex", alignItems: "center", gap: "10px",
                    background: C.white, borderRadius: "16px", padding: "10px 12px",
                  }
                : { display: "flex", alignItems: "center", gap: "10px", margin: "0 0 12px" }
            }
          >
            <span style={{
              width: side === "joc" ? "40px" : "36px",
              height: side === "joc" ? "40px" : "36px",
              flex: `0 0 ${side === "joc" ? "40px" : "36px"}`,
              borderRadius: "50%",
              background: side === "joc" ? C.orange : C.blueTint,
              color: side === "joc" ? C.ink : C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F.ui, fontWeight: 700, fontSize: side === "joc" ? "16px" : "14px",
            }}>
              {(who ?? "?").trim().charAt(0).toUpperCase()}
            </span>

            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontFamily: F.ui, fontSize: side === "joc" ? "16px" : "13.5px",
                fontWeight: 600, lineHeight: 1.25, margin: 0, color: C.ink,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {who}
              </p>
              {side === "joc" ? (
                <p style={{
                  fontFamily: F.ui, fontSize: "14px", lineHeight: 1.3,
                  margin: "1px 0 0", color: C.muted,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {role}
                </p>
              ) : null}
            </div>

            {side === "joc" ? signOut : null}
          </div>

          <div style={{ marginTop: side === "joc" ? "6px" : 0 }}>{action}</div>
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
