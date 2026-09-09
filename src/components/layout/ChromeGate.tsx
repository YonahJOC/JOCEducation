"use client";

import { usePathname } from "next/navigation";

/**
 * Routes that supply their own chrome: the educator landing page at `/`
 * carries its own header and footer, and the admin console has a sidebar.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
