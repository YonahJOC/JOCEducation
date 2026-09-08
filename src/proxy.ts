import { NextRequest, NextResponse } from "next/server";

// Proxy wires up once the database is connected and auth is configured.
// Until then it passes all traffic through so the UI remains fully navigable.
// To enable protection: import { auth } from "@/auth" and replace the body below.

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
