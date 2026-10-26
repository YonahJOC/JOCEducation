"use client";

import { usePathname } from "next/navigation";
import { ownChrome } from "@/lib/chrome";

/**
 * The site's header and footer, except where a page brings its own.
 *
 * Which pages those are is in src/lib/chrome.ts, so that a test can read
 * the list — the rule is easy to break by accident and invisible until
 * somebody opens the page.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (ownChrome(pathname)) return null;
  return <>{children}</>;
}
