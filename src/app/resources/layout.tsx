import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resource Library",
  description: "460+ free chesed education resources for Jewish schools — worksheets, source sheets, videos, and activity guides sorted by grade and topic.",
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
