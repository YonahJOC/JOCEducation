import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "JOC Education products for schools — physical chesed kits, program materials, and supplies to bring JOC programs to your classroom.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
