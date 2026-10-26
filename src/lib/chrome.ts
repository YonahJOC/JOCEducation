/**
 * Which pages bring their own header and footer.
 *
 * The site's chrome — Programs, Pricing, Shop, Staff Room, a sign-in — is
 * right for somebody reading about Just One Chesed and wrong for everybody
 * who is already inside something: a console, a school's panel, a form
 * scanned off a wall, a screen on an iPad.
 *
 * It lives here rather than inside the component so that a test can read
 * it. The rule it protects is simple and easy to break by accident: a
 * route tree that draws PortalShell must be on this list, or it gets two
 * wordmarks stacked on top of each other and the public footer underneath.
 */

/** Exact paths. */
export const OWN_CHROME = [
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
] as const;

/** Route trees, for the same reasons. */
export const OWN_CHROME_PREFIXES = [
  "/admin",
  "/school",
  /**
   * The ambassador's side, which is the school's shell from the other seat.
   *
   * It used to wear a small header of its own and sat inside the site's,
   * which was survivable. Once it became PortalShell it was two wordmarks
   * stacked on each other and the public footer — Pricing, Shop, Donate —
   * under a fifteen-year-old's approval queue.
   */
  "/ambassador",
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
] as const;

/** Whether this path draws its own header and footer. */
export function ownChrome(pathname: string): boolean {
  if ((OWN_CHROME as readonly string[]).includes(pathname)) return true;
  return OWN_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
