"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches, as a value a component can branch on.
 *
 * The portal is drawn in inline styles, so a layout that genuinely differs
 * between a phone and a desk — a list of rows against one card at a time —
 * cannot be a media query in a stylesheet. It has to be a decision in
 * JavaScript.
 *
 * It is a store rather than state set from an effect so that the first
 * client render already knows the answer. With an effect the page paints
 * the narrow layout, runs the effect, and paints again — a visible flash of
 * the phone layout on every desk, which is where most of this is used.
 *
 * The server has no window and renders the narrow layout, which is the
 * right half of the mismatch to be wrong about: a phone keeps what it was
 * given, and a desk corrects on hydration.
 */
export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
