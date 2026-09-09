import { NextRequest, NextResponse } from "next/server";

/**
 * Hard gate — the educator landing page at `/` is the only public route.
 *
 * This runs on the edge, where Prisma cannot, so it only checks for the
 * presence of a session cookie and redirects when there isn't one. Real
 * authorization (roles, subscription, staff status) is enforced server-side
 * in the page and layout components via `auth()`.
 *
 * DISABLED BY DEFAULT. Set GATE_ENABLED=true in Vercel once Google sign-in is
 * live — turning it on before then locks everybody out, JOC team included.
 */

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/privacy",
  "/terms",
  "/no-access",
]);

const PUBLIC_PREFIXES = ["/api/auth", "/brand", "/_next"];

const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/opengraph-image",
]);

// Auth.js v5 cookie names (the __Secure- prefix is used over HTTPS).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_FILES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => Boolean(req.cookies.get(name)?.value));
}

export function proxy(req: NextRequest) {
  if (process.env.GATE_ENABLED !== "true") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  if (hasSessionCookie(req)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
