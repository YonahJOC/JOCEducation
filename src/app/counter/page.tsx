import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { GroupCounter } from "@/components/counter/GroupCounter";

/**
 * The counter an iPad runs at the table in the centre.
 *
 * Behind the same permission that edits the lobby panel, because it changes
 * what the same wall says. Sign in once on the device and the session holds
 * for months, which is what a counter on a table needs: nobody is typing a
 * password with dough on their hands.
 */

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Group counter",
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#1F6FB8",
  viewportFit: "cover" as const,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default async function CounterPage() {
  const session = await safeAuth();
  const me = session?.user;

  if (!openForReview && !can(me, "lobby")) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#1F6FB8,#25319A)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          fontFamily: "Montserrat, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "32px",
            padding: "36px",
            maxWidth: "460px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#1E3FA0", margin: "0 0 10px" }}>
            {me ? "This counter isn’t yours" : "Sign in on this iPad"}
          </h1>
          <p style={{ fontSize: "17px", lineHeight: 1.6, color: "#4A4F6A", margin: "0 0 22px" }}>
            {me ? (
              <>Changing what the lobby screen shows needs the <strong>lobby screen</strong> permission.</>
            ) : (
              <>Sign in once with a JOC account and this device stays signed in.</>
            )}
          </p>
          <Link
            href={me ? "/home" : "/login?next=%2Fcounter"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "56px",
              padding: "0 28px",
              borderRadius: "28px",
              background: "#FF8A00",
              color: "#fff",
              fontWeight: 900,
              fontSize: "18px",
              textDecoration: "none",
            }}
          >
            {me ? "Back to the site" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap"
      />
      <GroupCounter />
    </>
  );
}
