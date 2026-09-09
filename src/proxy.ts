import { NextRequest, NextResponse } from "next/server";

/**
 * Hard gate — every route except the educator landing page requires an account.
 *
 * DISABLED BY DEFAULT. Authentication is not wired up yet (see tech plan
 * Phase 2), so switching this on today would lock out everybody, including
 * the JOC team. Once NextAuth is live:
 *   1. replace the TODO below with a real session check, and
 *   2. set GATE_ENABLED=true in the Vercel environment variables.
 */

const PUBLIC_PATHS = new Set([
  "/",                 // educator landing page — the only public route
  "/login",
  "/signup",
  "/forgot-password",
  "/privacy",
  "/terms",
]);

const PUBLIC_PREFIXES = ["/api/auth", "/brand", "/_next"];

const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/opengraph-image",
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_FILES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export function proxy(req: NextRequest) {
  if (process.env.GATE_ENABLED !== "true") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // TODO Phase 2: const session = await auth(); if (session) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
