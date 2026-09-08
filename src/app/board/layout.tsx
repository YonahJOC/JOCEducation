import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teachers' Board",
  description: "A community space where Jewish school teachers share what actually works — chesed activities, discussion starters, and real classroom experiences.",
};

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
