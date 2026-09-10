import { NextRequest, NextResponse } from "next/server";

/**
 * The login gate.
 *
 * The educator landing page at `/` is the only public route. Everything else
 * — the site, the portal, the console — requires an account.
 *
 * The gate switches itself on as soon as signing in is actually possible,
 * which is a database plus a signing secret. Before that it stays open, so a
 * site with no working login can never lock everybody out. Set
 * GATE_DISABLED=true to force it open (useful for a staging deploy).
 *
 * This runs on the edge where Prisma cannot, so it only checks for the
 * presence of a session cookie. Real authorization — roles, subscription,
 * staff status, school scoping — is enforced server-side in the pages
 * themselves via `auth()`. A forged cookie gets past this and then hits a
 * real check on the other side.
 */

const canSignIn = Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);
const gateOn = canSignIn && process.env.GATE_DISABLED !== "true";

/** Reachable without an account. */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/no-access",
]);

// Reachable by anyone signed in, including someone who still has to change
// an administrator-issued password.
const PUBLIC_PREFIXES = ["/api/auth", "/brand", "/_next", "/account"];

const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/opengraph-image",
]);

// Auth.js v5 cookie names. The __Secure- prefix is used over HTTPS.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_FILES.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Files served from /public — logos, images, fonts.
  return /\.(png|jpe?g|svg|webp|avif|ico|gif|mp4|webm|woff2?|ttf|txt|xml|pdf)$/i.test(pathname);
}

function signedIn(req: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => Boolean(req.cookies.get(name)?.value));
}

export function proxy(req: NextRequest) {
  if (!gateOn) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const hasSession = signedIn(req);

  // Someone already signed in has no use for the landing page.
  if (hasSession && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPublic(pathname)) return NextResponse.next();
  if (hasSession) return NextResponse.next();

  // An API caller wants an answer, not a marketing page. Redirecting one to
  // the landing page hands it a 200 and a lump of HTML, which reads as
  // success — say no plainly instead.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  // Send them to the landing page, remembering where they were headed.
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = pathname === "/home" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
