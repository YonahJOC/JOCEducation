"use client";

import { usePathname } from "next/navigation";

/** Routes that supply their own header and footer. */
const OWN_CHROME = [
  "/",
  "/privacy",
  "/terms",
  "/no-access",
  // The sign-in pages are full-height cards of their own; the site header and
  // footer around them just get in the way.
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify",
  // One form, opened from a link, filled in on a phone in a car park. A site
  // header offering a demo and a shop is noise around the only thing on the
  // page.
  "/log",
  "/buzz",
];

/** Route trees that supply their own, for the same reasons. */
const OWN_CHROME_PREFIXES = [
  "/admin",
  "/school",
  /**
   * Scanned off a wall, held up in a hallway or a lobby, one thing to do.
   *
   * The site header is the worst thing that could be around it: a stranger
   * who came to say thank you is handed Programs, Pricing, Shop, Staff Room
   * and a sign-in, most of which are not theirs and none of which is what
   * they scanned the code for.
   */
  "/shout-out",
  // The page behind the QR code on the lobby wall. Same reason.
  "/scan",
  // The iPad at the table in the centre: a full-screen app, not a page of
  // the site with a counter on it.
  "/counter",
];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (OWN_CHROME.includes(pathname)) return null;
  if (OWN_CHROME_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}
