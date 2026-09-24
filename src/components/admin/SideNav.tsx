"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { label as uiLabel } from "@/lib/joc-tokens";

export type NavItem = { label: string; href: string; hint?: string };

/**
 * The console's navigation.
 *
 * A client component purely so the page you are on is marked. Without that
 * the sidebar is eleven identical links and nothing says which one you
 * clicked.
 */
export function SideNav({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div style={{ marginBottom: "18px" }}>
      <p style={{ ...uiLabel, color: "rgba(255,255,255,.35)", fontWeight: 700, padding: "0 20px", margin: "0 0 6px" }}>
        {label}
      </p>
      <nav style={{ display: "flex", flexDirection: "column" }}>
        {items.map((i) => {
          // /admin must not light up for every page beneath it.
          const active = i.href === "/admin"
            ? pathname === "/admin"
            : pathname === i.href || pathname.startsWith(`${i.href}/`);

          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              title={i.hint}
              style={{
                padding: "9px 20px",
                fontSize: "14px",
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "rgba(255,255,255,.8)",
                textDecoration: "none",
                backgroundColor: active ? "rgba(255,255,255,.09)" : "transparent",
                borderLeft: active ? "3px solid #FA912D" : "3px solid transparent",
              }}
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
