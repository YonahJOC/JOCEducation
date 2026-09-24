import type { Metadata } from "next";
import { Outfit, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header, type HeaderAccount } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { safeAuth } from "@/auth";
import { canRunOwnSchool, ROLE_LABELS, type Role } from "@/lib/access";
import { canOpenConsole } from "@/lib/program-admin";
import { schoolAccess } from "@/lib/school-access";
// Refuses to serve a production build that cannot authenticate anybody.
import "@/lib/boot";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * Three fonts, one job each.
 *
 *   Outfit      names, headings, buttons, the interface itself
 *   Newsreader  anything a person reads: a program's description, the reason
 *               on a row, what a student wrote
 *   Plex Mono   labels, dates, counts, codes, step numbers — the things that
 *               are read as data rather than as prose
 *
 * Newsreader carries its roman as well as its italic now, and both weights,
 * because it is doing real reading work rather than decorating a pull quote.
 */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://education.justonechesed.org"
  ),
  title: {
    default: "JOC Education — Educating Towards Chesed",
    template: "%s — JOC Education",
  },
  description:
    "Lesson plans, chesed programs, and classroom resources for Jewish schools. Educating Towards Chesed — Just One Student at a Time.",
  keywords: ["Jewish education", "chesed curriculum", "lesson plans", "Jewish schools", "JOC", "middos", "character education"],
  authors: [{ name: "JustOneChesed" }],
  openGraph: {
    type: "website",
    siteName: "JOC Education",
    title: "JOC Education — Educating Towards Chesed",
    description:
      "Lesson plans, chesed programs, and classroom resources for Jewish schools. Educating Towards Chesed — Just One Student at a Time.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "JOC Education — Educating Towards Chesed",
    description:
      "Lesson plans, chesed programs, and classroom resources for Jewish schools.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolved here so the header can show who is signed in, where they can go,
  // and a way out. The header itself is a client component and never sees the
  // session object.
  const session = await safeAuth();
  const u = session?.user;

  // Two ways into the console, and the button has to know about both. The
  // capability route covers the education and programming teams; running a
  // program covers a coordinator, who holds no capability at all. Opening the
  // door without lighting the way to it is the same as leaving it shut —
  // which is exactly what happened.
  const consoleAccess = await canOpenConsole(u);

  // A school that runs programs and has not been given the site gets a header
  // of its programs. JOC's own people, and schools on the full site, keep the
  // whole thing.
  const access = consoleAccess ? null : await schoolAccess(u?.schoolId ?? null);
  const account: HeaderAccount = u?.email
    ? {
        email: u.email,
        name: u.name ?? null,
        roleLabel: ROLE_LABELS[(u.role ?? "TEACHER") as Role] ?? "Member",
        console: consoleAccess,
        school: canRunOwnSchool(u),
        programs: access?.state === "PROGRAMS" ? access.programs : null,
      }
    : null;

  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} ${plexMono.variable}`}>
      <body>
        <ChromeGate><Header account={account} /></ChromeGate>
        <main className="flex-1">{children}</main>
        <ChromeGate><Footer /></ChromeGate>
      </body>
    </html>
  );
}
