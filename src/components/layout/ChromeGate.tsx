"use client";

import { usePathname } from "next/navigation";

/**
 * The educator landing page at `/` carries its own header and footer,
 * so the shared site chrome is suppressed there.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
