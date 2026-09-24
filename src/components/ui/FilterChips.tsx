"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { C, R, F, datum } from "@/lib/joc-tokens";

/**
 * The chips above a list.
 *
 * This replaced a set of collapsible groups, which turned a coordinator's
 * schools into a stack of folders — three of them saying nothing but "0", and
 * the one list that matters shut behind "Show 36". A filter narrows a list
 * that is already on the screen; a folder hides it.
 *
 * The choice lives in the URL, so it survives a reload, can be linked to, and
 * does not need the component to hold state it would lose on a refresh.
 *
 * A chip with nothing behind it is not rendered — an empty category is not an
 * item — and if that leaves only "All", the bar goes entirely.
 */

export type ChipOption = {
  /** What goes in the URL. Null for "All", which removes the parameter. */
  key: string | null;
  label: string;
  count: number;
  /** A traffic light's colour, shown as a dot before the label. */
  dot?: string;
};

export function FilterChips({
  param, options, total, totalLabel = "All",
}: {
  /** The search parameter this bar owns: "in", "light". */
  param: string;
  options: ChipOption[];
  total: number;
  totalLabel?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get(param);

  const shown = options.filter((o) => o.count > 0);
  if (shown.length === 0) return null;

  const href = (key: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (key) next.set(param, key);
    else next.delete(param);
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  const all: ChipOption = { key: null, label: totalLabel, count: total };

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "0 0 14px" }}>
      {[all, ...shown].map((o) => {
        const on = (o.key ?? null) === (active ?? null);
        return (
          <Link
            key={o.key ?? "all"}
            href={href(o.key)}
            scroll={false}
            aria-current={on ? "true" : undefined}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              minHeight: "44px", padding: "0 15px", borderRadius: R.chip,
              fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
              backgroundColor: on ? C.ink : C.white,
              color: on ? C.white : C.ink,
              border: `1px solid ${on ? C.ink : C.hairline}`,
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            {o.dot && (
              <span
                aria-hidden="true"
                style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: o.dot, flexShrink: 0 }}
              />
            )}
            {o.label}
            <span style={{ ...datum, color: on ? C.white : C.muted, opacity: on ? 0.8 : 1 }}>
              {o.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
