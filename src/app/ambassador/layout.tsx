import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { label, C } from "@/lib/joc-tokens";

/**
 * The ambassador's corner of the portal.
 *
 * Deliberately small. An ambassador is a student who runs one program at one
 * school: there is their program, the thing they came to write, and nothing
 * else. No school plan, no other programs, no other schools, no console.
 *
 * Signing in is all this layout asks for. Whether they are actually an
 * ambassador is asked on each page, because /ambassador/join has to be
 * reachable by somebody who is not one yet.
 */

export const metadata = { title: "Ambassador", robots: { index: false, follow: false } };

export default async function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  if (!openForReview) {
    const session = await safeAuth();
    if (!session?.user) redirect("/");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.paper }}>
      <header style={{ backgroundColor: C.ink, padding: "16px 20px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/ambassador" style={{ textDecoration: "none", display: "block" }}>
            <Image
              src="/brand/joc-wordmark-white.png"
              alt="JustOneChesed"
              width={150}
              height={18}
              priority
              style={{ height: "17px", width: "auto", display: "block" }}
            />
          </Link>
          <span style={{
            fontFamily: "var(--font-outfit)", ...label, color: C.orange,
          }}>
            Ambassador
          </span>
          <span style={{ flex: 1 }} />
          <Link
            href="/home"
            style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 600, color: "#C6CFF0", textDecoration: "none", minHeight: "44px", display: "flex", alignItems: "center" }}
          >
            Back to the site
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "26px 20px 60px" }}>{children}</main>
    </div>
  );
}
