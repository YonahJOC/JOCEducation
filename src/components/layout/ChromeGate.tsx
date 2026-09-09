"use client";

import { usePathname } from "next/navigation";

/** Routes that supply their own header and footer. */
const OWN_CHROME = ["/", "/privacy", "/terms", "/no-access"];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (OWN_CHROME.includes(pathname) || pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
