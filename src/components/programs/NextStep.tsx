import Link from "next/link";
import { ROW_SHADOW, C, R, label, F } from "@/lib/joc-tokens";
import { STEPS, STEP_SHORT, STEP_TITLE, STEP_NEXT, type SchoolStep } from "@/lib/program-step";

/**
 * Your next step — the card beside the hero on a program page.
 *
 * The one thing a school reading this page wants to know is what happens
 * next, and until now the page answered with four numbered stages and a
 * Register button that meant the same thing to everybody. It has three
 * states, and which one a person sees depends entirely on what their school
 * has already done.
 */

export function NextStep({
  mine, formSlug, comingSoon, externalHref, programName, accent,
}: {
  /** Null for a visitor, or for a school this program has not reached. */
  mine: SchoolStep | null;
  formSlug: string | null;
  comingSoon: boolean;
  externalHref?: string;
  programName: string;
  /** The program's own colour, for the rail. */
  accent: string;
}) {
  const card: React.CSSProperties = {
    backgroundColor: C.paper,
    borderRadius: R.hero,
    padding: "26px 24px",
    boxShadow: ROW_SHADOW,
  };

  const primary: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: F.ui, fontSize: "16px", fontWeight: 700,
    color: C.white, backgroundColor: C.blue,
    borderRadius: R.button, padding: "14px 22px", minHeight: "48px",
    textDecoration: "none", marginTop: "18px",
  };

  // Announced but not running. Nothing to promise a school yet, and saying
  // otherwise is how you lose one.
  if (comingSoon) {
    return (
      <div style={card}>
        <p style={{ ...label, color: C.orangeText, margin: "0 0 10px" }}>Coming soon</p>
        <p style={{ fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 8px", lineHeight: 1.2 }}>
          Not open yet
        </p>
        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
          {programName} is announced but not running. Registration opens when it is — there is
          nothing to sign up to in the meantime.
        </p>
      </div>
    );
  }

  // Nobody signed in, or a school this program has not reached.
  if (!mine) {
    return (
      <div style={card}>
        <p style={{ ...label, color: C.orangeText, margin: "0 0 10px" }}>
          Start here · Step 01 of 0{STEPS}
        </p>
        <p style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, margin: "0 0 10px", lineHeight: 1.18 }}>
          Book a 20-minute meeting
        </p>
        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
          {STEP_NEXT[1]}
        </p>

        <Link href={externalHref ?? "/contact"} style={primary}>
          Book a meeting
        </Link>

        <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.muted, margin: "14px 0 0" }}>
          Already started?{" "}
          <Link href="/" style={{ color: C.blue, fontWeight: 600 }}>Sign in</Link>{" "}
          and this card shows your school&rsquo;s step.
        </p>
      </div>
    );
  }

  // Signed in, and their school is on this program.
  const step = mine.step;
  const action =
    step === 2 && formSlug
      ? { href: `/forms/${formSlug}`, text: "Fill in the sign-up form" }
      : step >= 4
      ? { href: "/school/programs", text: "Open your programs" }
      : { href: "/contact", text: "Ask us about it" };

  return (
    <div style={card}>
      {/* The rail: how far along, before any words. */}
      <span aria-hidden="true" style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            style={{
              flex: 1, height: "5px", borderRadius: R.chip,
              backgroundColor: i < step ? accent : C.hairline,
            }}
          />
        ))}
      </span>

      <p style={{ ...label, color: C.orangeText, margin: "0 0 10px" }}>
        Step 0{step} of 0{STEPS} · {STEP_SHORT[step]}
      </p>
      <p style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, margin: "0 0 10px", lineHeight: 1.18 }}>
        {STEP_TITLE[step]}
      </p>
      <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
        {STEP_NEXT[step]}
      </p>

      <Link href={action.href} style={primary}>
        {action.text}
      </Link>

      <p style={{ ...label, color: C.muted, margin: "14px 0 0" }}>
        {mine.schoolName}
      </p>
    </div>
  );
}
