import Link from "next/link";
import { myAmbassadorship } from "@/lib/ambassadors";
import { JoinForm } from "@/components/ambassador/JoinForm";
import { C, R, ROW_SHADOW } from "@/lib/joc-tokens";

/**
 * Entering the code a teacher handed over.
 *
 * The only ambassador page somebody who is not one yet can open. The code
 * carries the school and the program, so nothing typed here decides what
 * anybody gets.
 */

export const metadata = { title: "Join as an ambassador" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const mine = await myAmbassadorship();

  if (mine) {
    return (
      <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "28px 24px" }}>
        <p style={{ fontFamily: "var(--font-outfit)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 6px" }}>
          You already run {mine.programName}
        </p>
        <p style={{ fontSize: "16px", color: C.muted, margin: "0 0 16px", lineHeight: 1.6 }}>
          At {mine.schoolName}, since {new Date(mine.startsAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}.
        </p>
        <Link
          href="/ambassador"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 700,
            color: C.white, backgroundColor: C.blue, borderRadius: R.button,
            padding: "13px 22px", minHeight: "47px", textDecoration: "none",
          }}
        >
          Go to your program
        </Link>
      </div>
    );
  }

  return <JoinForm />;
}
