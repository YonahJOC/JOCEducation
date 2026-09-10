import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import "./globals.css";
import { Header, type HeaderAccount } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { safeAuth } from "@/auth";
import { canAccessConsole, canRunOwnSchool, ROLE_LABELS, type Role } from "@/lib/access";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
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
  const account: HeaderAccount = u?.email
    ? {
        email: u.email,
        name: u.name ?? null,
        roleLabel: ROLE_LABELS[(u.role ?? "TEACHER") as Role] ?? "Member",
        console: canAccessConsole(u),
        school: canRunOwnSchool(u),
      }
    : null;

  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable}`}>
      <body>
        <ChromeGate><Header account={account} /></ChromeGate>
        <main className="flex-1">{children}</main>
        <ChromeGate><Footer /></ChromeGate>
      </body>
    </html>
  );
}
