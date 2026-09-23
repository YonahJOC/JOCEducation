import { NextRequest, NextResponse } from "next/server";

/**
 * The login gate.
 *
 * The educator landing page at `/` is the only public route. Everything else
 * — the site, the portal, the console — requires an account.
 *
 * The gate needs a database and a signing secret to be worth anything, since
 * without them nobody can sign in. In development it stands aside in that
 * state so a fresh clone can be read; in production it does the opposite —
 * see below. GATE_DISABLED=true opens it deliberately.
 *
 * This runs on the edge where Prisma cannot, so it only checks for the
 * presence of a session cookie. Real authorization — roles, subscription,
 * staff status, school scoping — is enforced server-side in the pages
 * themselves via `auth()`. A forged cookie gets past this and then hits a
 * real check on the other side.
 */

const canSignIn = Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);

/**
 * Two different reasons the gate might be off, and only one of them is a
 * decision.
 *
 *   GATE_DISABLED=true    somebody at JOC chose to open the site. Honoured.
 *   sign-in is broken     nobody chose anything. Standing aside here would
 *                         publish every school's record to whoever has the
 *                         address, and with no sign-in there would be nobody
 *                         able to get in and notice.
 *
 * The second used to open the gate too. In production it now shuts it: the
 * landing page still serves, everything else says no, and src/lib/boot.ts
 * says in the logs why.
 */
const inProduction = process.env.NODE_ENV === "production";
const gateOn = canSignIn
  ? process.env.GATE_DISABLED !== "true"
  : inProduction;

/** Reachable without an account. */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/privacy",
  "/terms",
  "/no-access",
]);

// Reachable by anyone signed in, including someone who still has to change
// an administrator-issued password.
const PUBLIC_PREFIXES = [
  "/api/auth",
  // Stripe posts here with no session of its own; the signature is what
  // authorises it, checked in the route.
  "/api/stripe",
  // A form link is meant to be sendable to a parent or a school office.
  // Whether a particular form needs an account is the form's own setting,
  // enforced when it is submitted — not something the gate decides.
  "/forms",
  "/brand", "/_next",
  // Somebody an administrator issued a password to has to be able to change
  // it. Only that page — /account itself sits behind the gate like the rest.
  "/account/password",
];

const PUBLIC_FILES = new Set([
  "/api/version",
  // Authorised by CRON_SECRET in the route, not by a session. Vercel Cron
  // carries no cookie, so the gate would answer these before the route ever
  // ran — and the only sign of it would be a nightly 401 nobody reads.
  "/api/app-sync",
  "/api/lights",
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
