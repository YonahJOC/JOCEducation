"use client";

import { usePathname } from "next/navigation";

/** Routes that supply their own header and footer. */
const OWN_CHROME = [
  "/",
  "/privacy",
  "/terms",
  "/no-access",
  // The sign-in pages are full-height cards of their own; the site header and
  // footer around them just get in the way.
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (OWN_CHROME.includes(pathname)) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/school")) return null;
  return <>{children}</>;
}
