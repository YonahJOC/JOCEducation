import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chesed Programs",
  description: "JOC's school chesed programs — from the Kindness Booth to the JOC Center Trip. Plug-and-play chesed initiatives your school can run this semester.",
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
