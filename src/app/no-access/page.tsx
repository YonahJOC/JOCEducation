import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { safeAuth } from "@/auth";
import { couldBeSchoolEmail } from "@/lib/access";
import { signOutAction } from "@/app/actions/auth";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE_TEXT = "#C96C00";
const RULE = "rgba(16,35,63,.12)";

export const metadata: Metadata = {
  title: "Your school isn't set up yet — JOC Education",
  robots: { index: false, follow: false },
};

/**
 * Where a signed-in user lands when they belong to no school with an active
 * plan. They authenticated fine — there is just nothing for them to see yet,
 * so this offers a way forward rather than an error.
 */
export default async function NoAccessPage() {
  const session = await safeAuth();
  const email = session?.user?.email ?? null;
  const looksLikeSchool = couldBeSchoolEmail(email);

  return (
    <div style={{ backgroundColor: "#FBF9F4", minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "16px 26px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "11px", textDecoration: "none" }}>
            <Image src="/brand/joc-wordmark.png" alt="JustOneChesed" width={150} height={18} style={{ height: "18px", width: "auto" }} />
            <span aria-hidden="true" style={{ width: "1px", height: "18px", backgroundColor: RULE }} />
            <span style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT }}>
              Education
            </span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "620px", margin: "0 auto", padding: "64px 26px 80px" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: ORANGE_TEXT, margin: "0 0 12px" }}>
          You&rsquo;re signed in
        </p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: INK, margin: "0 0 16px" }}>
          Your school isn&rsquo;t set up yet.
        </h1>

        <p style={{ fontSize: "17px", lineHeight: 1.65, color: "rgba(16,35,63,.75)", margin: "0 0 14px" }}>
          {email ? (
            <>
              You&rsquo;re signed in as <strong style={{ color: INK }}>{email}</strong>, but that account
              isn&rsquo;t attached to a school with an active JOC Education plan — so there&rsquo;s nothing
              behind the sign-in for you yet.
            </>
          ) : (
            <>This account isn&rsquo;t attached to a school with an active JOC Education plan yet.</>
          )}
        </p>

        <p style={{ fontSize: "16px", lineHeight: 1.65, color: "rgba(16,35,63,.7)", margin: "0 0 28px" }}>
          {looksLikeSchool ? (
            <>
              If your school already works with Just One Chesed, ask whoever arranged it to invite this
              address — or tell us and we&rsquo;ll connect it.
            </>
          ) : (
            <>
              To join a school you&rsquo;ll need to sign in with your school email address, or be invited by
              the JOC team. Personal addresses can&rsquo;t be matched to a school automatically.
            </>
          )}
        </p>

        <div
          style={{
            backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "20px",
            padding: "24px", marginBottom: "26px",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "17px", color: INK, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            In the meantime
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.65, color: "rgba(16,35,63,.72)", margin: "0 0 18px" }}>
            The teaching platform is still being built, but Just One Chesed runs ten chesed programs your
            school can start this year — Kindness Booth, Bake for Chesed, Just One Tutor and more.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/#demo"
              style={{
                display: "inline-block", backgroundColor: BLUE, color: "#fff", fontWeight: 700,
                fontSize: "14.5px", borderRadius: "9999px", padding: "13px 22px", textDecoration: "none",
              }}
            >
              Book a walkthrough
            </Link>
            <a
              href="mailto:education@justonechesed.org"
              style={{
                display: "inline-block", border: `1.5px solid ${RULE}`, color: INK, fontWeight: 600,
                fontSize: "14.5px", borderRadius: "9999px", padding: "13px 22px", textDecoration: "none",
              }}
            >
              Email the team
            </a>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 600,
              color: "rgba(16,35,63,.6)", background: "none", border: "none",
              cursor: "pointer", padding: 0,
            }}
          >
            Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
