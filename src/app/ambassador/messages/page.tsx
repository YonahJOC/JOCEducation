import Link from "next/link";
import { myAmbassadorship, myEndedAmbassadorship } from "@/lib/ambassadors";
import { messagesFor } from "@/lib/ambassador-messages";
import { MessageThread } from "@/components/ambassador/MessageThread";
import { PageHeader } from "@/components/ui/PageHeader";
import { C, F, R, T, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * Where a student can ask.
 *
 * Everything else on this side runs one way: they send work up, a teacher
 * says yes or no, and the screen page tells them what happened. Somebody
 * who does not understand why their flyer was set aside had nowhere to say
 * so, which is a strange thing to build for a fifteen-year-old and then
 * call a console.
 *
 * Their own supervising teacher, and nobody else. A private channel
 * between adults at JOC and somebody's child is a safeguarding decision
 * rather than a feature — the column that would carry it exists and
 * nothing writes it. See src/lib/ambassador-messages.ts.
 */

export const metadata = { title: "Message center" };
export const dynamic = "force-dynamic";

export default async function AmbassadorMessagesPage() {
  const mine = await myAmbassadorship();
  const ended = mine ? null : await myEndedAmbassadorship();
  const scope = mine ?? null;

  if (!scope) {
    return (
      <div style={{ maxWidth: CONTENT_MAX }}>
        <PageHeader title="Message center" sub="For a school's ambassadors." />
        <p style={{ ...T.read, color: C.muted, margin: 0 }}>
          {ended
            ? "Your time running it has finished, so there is nobody to write to here."
            : "If a teacher has given you a code, "}
          {!ended ? (
            <Link href="/ambassador/join" style={{ color: C.blue }}>join with it here</Link>
          ) : null}
          {!ended ? "." : ""}
        </p>
      </div>
    );
  }

  const messages = await messagesFor(scope.id).catch(() => []);
  const teacherName = scope.supervisor.name?.trim() || "Your teacher";

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <PageHeader
        title="Message center"
        sub={`Ask ${teacherName} anything about the screen.`}
      />

      <div style={{ display: "grid", gap: "18px", maxWidth: "760px" }}>
        <MessageThread
          ambassadorId={scope.id}
          messages={messages}
          teacherName={teacherName}
        />

        {/*
          Said plainly, because the alternative is a student waiting for an
          answer from somebody who was never going to write.
        */}
        <section style={{
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row, padding: "16px 18px",
        }}>
          <p style={{ fontFamily: F.ui, fontSize: "15.5px", fontWeight: 700, color: C.ink, margin: 0 }}>
            Just One Chesed does not write to students.
          </p>
          <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "4px 0 0", lineHeight: 1.5, maxWidth: "58ch" }}>
            Anything you need from JOC goes through {teacherName}, who can reach them directly.
            Nothing you write here leaves your school.
          </p>
        </section>
      </div>
    </div>
  );
}
