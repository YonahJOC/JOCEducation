import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { LobbyAdmin } from "@/components/lobby/LobbyAdmin";
import { C, F, R, pageTitle } from "@/lib/joc-tokens";

/**
 * The lobby screen's admin panel.
 *
 * It brings its own layout and its own stylesheet from the standalone
 * project, so this page is only the door: check the permission, then hand
 * over the whole width.
 */

export const metadata = { title: "The lobby screen — JOC Console" };
export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const session = await safeAuth();
  const me = session?.user;

  if (!openForReview && !can(me, "lobby")) {
    return (
      <div style={{ padding: "40px 26px", maxWidth: "520px" }}>
        <h1 style={{ ...pageTitle, color: C.ink, marginBottom: "10px" }}>
          The lobby screen isn&rsquo;t yours
        </h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, marginBottom: "22px" }}>
          Changing what the TV in the lobby shows needs the{" "}
          <strong style={{ color: C.ink }}>lobby screen</strong> permission. A super admin can give
          it to you in People &amp; access.
        </p>
        <Link
          href="/admin"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.ui, backgroundColor: C.blue, color: C.white, fontWeight: 700,
            fontSize: "16px", borderRadius: R.button, padding: "13px 24px",
            minHeight: "47px", textDecoration: "none",
          }}
        >
          Back to my desk
        </Link>
      </div>
    );
  }

  return <LobbyAdmin />;
}
