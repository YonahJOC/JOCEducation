"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { C, F, R, label } from "@/lib/joc-tokens";

/**
 * The rail's links.
 *
 * A client component purely so the page you are on is marked. Without that
 * it is seven identical links and nothing says which one you clicked.
 *
 * No group headings any more. Seven items do not need to be filed.
 *
 * On the JOC side each section carries its own colour — a tinted tile behind
 * its icon, which lights up when you are in it. That is what a light rail
 * buys you that a navy one cannot: the sections stop being seven identical
 * words and start being places, recognisable before they are read.
 */

/** Icon colour, and the tile it sits on when the section is open. */
const SECTION: Record<string, { ink: string; tint: string }> = {
  "My desk": { ink: C.blue, tint: C.blueTint },
  "The Office": { ink: C.orangeText, tint: C.orangeTint },
  Schools: { ink: C.greenText, tint: C.greenTint },
  Programs: { ink: C.redText, tint: C.redTint },
  "Admin meeting": { ink: C.blue, tint: C.blueTint },
  "Teaching material": { ink: C.orangeText, tint: C.orangeTint },
  Money: { ink: C.greenText, tint: C.greenTint },
};

/** Anything else the nav returns — a coordinator's programs — reads as one. */
const OTHER = { ink: C.redText, tint: C.redTint };

export function ShellNav({ items, side }: { items: NavItem[]; side: "joc" | "school" }) {
  const pathname = usePathname();
  const joc = side === "joc";

  return (
    <nav aria-label="Sections" style={{ display: "flex", flexDirection: "column" }}>
      {items.map((i) => {
        // The desk item must not light up for every page beneath it.
        const root = i.href === "/admin" || i.href === "/school";
        const active = root
          ? pathname === i.href
          : pathname === i.href || pathname.startsWith(`${i.href}/`);

        const tone = SECTION[i.label] ?? OTHER;

        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            title={i.hint}
            className={joc ? "joc-rail-item" : undefined}
            style={
              joc
                ? {
                    display: "flex", alignItems: "center", gap: "10px",
                    minHeight: "46px", padding: "0 8px", margin: "0 0 2px",
                    borderRadius: "12px", textDecoration: "none",
                    background: active ? C.white : "transparent",
                    color: C.ink,
                    fontFamily: F.ui, fontSize: "15px",
                    fontWeight: active ? 700 : 500,
                    transition: "background-color .12s",
                  }
                : {
                    display: "flex", alignItems: "center", gap: "9px",
                    padding: "10px 20px", minHeight: "44px",
                    fontFamily: F.ui, fontSize: "15px", fontWeight: active ? 700 : 400,
                    color: active ? C.ink : C.muted,
                    textDecoration: "none",
                    backgroundColor: active ? C.white : "transparent",
                    borderLeft: `3px solid ${active ? C.orange : "transparent"}`,
                    borderTopRightRadius: R.form,
                    borderBottomRightRadius: R.form,
                    marginRight: "10px",
                    transition: "background-color .12s",
                  }
            }
          >
            {joc && i.icon ? (
              <span
                aria-hidden="true"
                className="material-symbols-rounded"
                style={{
                  flex: "0 0 32px", width: "32px", height: "32px",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? tone.tint : C.white,
                  color: tone.ink,
                  fontSize: "21px",
                  // Filled when you are in it, outlined when you are not.
                  fontVariationSettings: `"FILL" ${active ? 1 : 0}, "wght" 600, "GRAD" 0, "opsz" 24`,
                }}
              >
                {i.icon}
              </span>
            ) : null}

            {i.dot && (
              <span
                aria-hidden="true"
                style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: i.dot, flexShrink: 0 }}
              />
            )}

            <span style={{ flex: 1, minWidth: 0, whiteSpace: joc ? "nowrap" : undefined }}>
              {i.label}
            </span>

            {i.need != null && i.need > 0 && (
              <span style={{
                ...label, fontWeight: 600, fontSize: "11px", letterSpacing: 0,
                color: i.tone === "blue" ? C.white : joc ? C.ink : C.white,
                backgroundColor: i.tone === "blue" ? C.blue : joc ? C.orange : C.orangeText,
                borderRadius: "20px", padding: "4px 7px", flexShrink: 0,
              }}>
                {i.need}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
