"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { C, R, F, label } from "@/lib/joc-tokens";

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
            style={{
              display: "flex", alignItems: "center", gap: "9px",
              padding: "10px 20px", minHeight: "44px",
              fontFamily: F.ui, fontSize: "15px", fontWeight: active ? 700 : 400,
              color: dark
                ? active ? C.white : "rgba(255,255,255,.8)"
                : active ? C.ink : C.muted,
              textDecoration: "none",
              backgroundColor: active
                ? dark ? "rgba(255,255,255,.1)" : C.white
                : "transparent",
              borderLeft: `3px solid ${active ? C.orange : "transparent"}`,
              borderTopRightRadius: R.form,
              borderBottomRightRadius: R.form,
              marginRight: "10px",
              transition: "background-color .12s",
            }}
          >
            {i.dot && (
              <span
                aria-hidden="true"
                style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: i.dot, flexShrink: 0 }}
              />
            )}
            <span style={{ flex: 1, minWidth: 0 }}>{i.label}</span>
            {i.need != null && i.need > 0 && (
              <span style={{
                ...label,
                color: dark ? C.ink : C.white,
                backgroundColor: dark ? C.orange : C.orangeText,
                borderRadius: "9999px", padding: "2px 7px", flexShrink: 0,
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
