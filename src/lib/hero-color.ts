/**
 * Reading text on a colour somebody else chose.
 *
 * The hero band's colour is typed into the console per program, so it is navy
 * on one page and whatever the next person picks on the next. White text is
 * right on a deep colour and unreadable on a pale one, and nobody editing a
 * program is going to run a contrast check. So the page works it out.
 */

import { C } from "@/lib/joc-tokens";


/** #abc and #aabbcc, the two forms anybody actually types. */
function parseHex(hex: string): [number, number, number] | null {
  const s = hex.trim().replace(/^#/, "");
  const full =
    s.length === 3 ? s.split("").map((c) => c + c).join("") :
    s.length === 6 ? s :
    null;
  if (!full || !/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const x = parseHex(a);
  const y = parseHex(b);
  if (!x || !y) return 1;
  const la = luminance(x);
  const lb = luminance(y);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * What to set the hero's text to.
 *
 * White when white clears 4.5:1 on that background, ink otherwise. An
 * unreadable colour returns ink rather than white: a colour we cannot parse
 * is a colour the browser will not paint either, so the band falls back to
 * the paper ground — where ink is the readable choice and white is invisible.
 */
export function heroFg(heroColor: string | null | undefined): string {
  if (!heroColor) return C.ink;
  if (!parseHex(heroColor)) return C.ink;
  return contrast(C.white, heroColor) >= 4.5 ? C.white : C.ink;
}

/**
 * The hero colour carried down the page — the section-label dash, the stage
 * rail, the top border of the At a glance card. Pulled toward ink so it still
 * reads as a line on paper when the hero itself is pale.
 */
export function deepFrom(heroColor: string | null | undefined): string {
  if (!heroColor || !parseHex(heroColor)) return C.ink;
  return `color-mix(in oklch, ${heroColor} 62%, ${C.ink})`;
}
