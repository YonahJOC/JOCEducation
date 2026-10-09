"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { C, F, label } from "@/lib/joc-tokens";

/**
 * The rail's links.
 *
 * A client component purely so the page you are on is marked. Without that
 * it is seven identical links and nothing says which one you clicked.
 *
 * No group headings any more. Seven items do not need to be filed.
 */
export function ShellNav({ items, side }: { items: NavItem[]; side: "joc" | "school" }) {
  const pathname = usePathname();
  const dark = side === "joc";

  return (
    <nav aria-label="Sections" style={{ display: "flex", flexDirection: "column" }}>
      {items.map((i) => {
        // The Today item must not light up for every page beneath it.
        const root = i.href === "/admin" || i.href === "/school";
        const active = root
          ? pathname === i.href
          : pathname === i.href || pathname.startsWith(`${i.href}/`);

        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            title={i.hint}
            /* A rounded pill rather than a tab with an orange edge: the rail
               now opens with two items a person switches between all day, and
               a left border on both of them read as a bracket. */
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "0 14px", minHeight: "48px", margin: "0 0 2px",
              fontFamily: F.ui, fontSize: "15px", fontWeight: active ? 700 : 500,
              color: active ? C.ink : dark ? "#DCE2EE" : C.muted,
              textDecoration: "none",
              // Paper, and square on the right, so the active tab joins the
              // page it opens rather than floating on the rail.
              backgroundColor: active ? C.paper : "transparent",
              borderRadius: "12px",
              borderTopRightRadius: active ? 0 : "12px",
              borderBottomRightRadius: active ? 0 : "12px",
              marginRight: active ? "-14px" : 0,
              transition: "background-color .12s",
            }}
          >
            {i.icon ? (
              <span
                aria-hidden="true"
                className="material-symbols-rounded"
                style={{
                  fontSize: "21px", flexShrink: 0,
                  color: active ? C.blue : dark ? "#9DA9C3" : C.muted,
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
            <span style={{ flex: 1, minWidth: 0 }}>{i.label}</span>
            {i.need != null && i.need > 0 && (
              <span style={{
                ...label, fontWeight: 600, fontSize: "11px", letterSpacing: 0,
                color: i.tone === "blue" ? C.white : dark ? C.ink : C.white,
                backgroundColor: i.tone === "blue" ? C.blue : dark ? C.orange : C.orangeText,
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
