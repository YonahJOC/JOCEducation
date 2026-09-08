import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable}`}>
      <body>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
