import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { currentSchoolId } from "@/lib/school-scope";
import { schoolAccess } from "@/lib/school-access";
import { askFor } from "@/app/actions/inquiry";
import { C, R, F, label, rowCard, primaryButton, secondaryButton, textButton } from "@/lib/joc-tokens";

/**
 * Something this school has not got yet (4c).
 *
 * Every gated page in the portal shows this one component, and it is not a
 * locked door. These are schools JOC already works with — the whole point of
 * the rollout is that they run a program and the rest is a conversation
 * waiting to happen. So: no padlock, no blur, no grey-out, no price, and
 * never the word upgrade. A heading that says plainly what is not theirs, a
 * sentence naming what they do run, and one button that tells JOC they are
 * interested.
 *
 * Pressing it writes an Inquiry and sends nothing. The reply happens on the
 * phone, and the button says so afterwards rather than promising an email
 * that is never coming.
 */

export async function NotYoursYet({
  kind, thing, label: eyebrow = "Part of JOC Education", sentence,
}: {
  /** What is being asked for: "lessons", "resources", a program's slug. */
  kind: string;
  /** The thing, in the words the heading uses: "The lesson library". */
  thing: string;
  /** The mono line above: "PART OF JOC EDUCATION" or "A JOC PROGRAM". */
  label?: string;
  /** One line about what it is, in their words rather than ours. */
  sentence: string;
}) {
  const schoolId = await currentSchoolId();
  const access = await schoolAccess(schoolId);

  const [school, asked] = isDatabaseConfigured() && schoolId
    ? await Promise.all([
        prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
        prisma.inquiry.findFirst({
          where: { schoolId, kind, status: "OPEN" },
          select: { createdAt: true },
        }),
      ])
    : [null, null];

  const first = access.programs[0] ?? null;
  const ask = askFor.bind(null, kind, null);

  const when = asked?.createdAt.toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "48px 24px 72px" }}>
      <div style={{ ...rowCard, borderRadius: R.hero, padding: "30px" }}>
        <p style={{ ...label, color: asked ? C.greenText : C.blue, margin: "0 0 10px" }}>
          {asked ? `You asked on ${when}` : eyebrow}
        </p>

        <h1 style={{
          fontFamily: F.ui, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em",
          color: C.ink, lineHeight: 1.2, margin: "0 0 12px",
        }}>
          {asked ? "We’ve got your message" : `${thing} isn’t part of what you run with us yet`}
        </h1>

        <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
          {asked ? (
            <>
              Somebody at JOC will be in touch about it. Nothing has changed for{" "}
              {school?.name ?? "your school"} in the meantime
              {first ? <>, and {first.name} carries on as it was</> : null}.
            </>
          ) : (
            <>
              {sentence}{" "}
              {first ? (
                <>
                  {school?.name ?? "Your school"} runs {first.name} with us
                  {access.programs.length > 1 ? ` and ${access.programs.length - 1} more` : ""}.
                </>
              ) : (
                <>{school?.name ?? "Your school"} is not running anything with us yet.</>
              )}
            </>
          )}
        </p>

        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", marginTop: "24px" }}>
          {asked ? (
            first && (
              <Link href={`/school/programs/${first.slug}`} style={{ ...secondaryButton, textDecoration: "none" }}>
                Back to {first.name}
              </Link>
            )
          ) : (
            <>
              <form action={ask}>
                <button type="submit" style={{ ...primaryButton, cursor: "pointer" }}>
                  I&rsquo;d like {thing.toLowerCase()}
                </button>
              </form>
              {first && (
                <Link href={`/school/programs/${first.slug}`} style={{ ...textButton, display: "inline-flex", alignItems: "center" }}>
                  Back to {first.name}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
