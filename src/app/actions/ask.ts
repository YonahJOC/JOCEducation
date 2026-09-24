"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { currentSchoolId } from "@/lib/school-scope";
import { TOPICS } from "@/lib/ask-topics";

/**
 * A school asking its coordinator something (5e).
 *
 * It writes one row and sends nothing. That is the whole design: the reply
 * happens on the phone, the way it already does, and this only makes sure
 * the coordinator knows there is something to reply to. No mail leaves the
 * system — the gate in src/lib/email.ts is untouched and no new send path
 * exists here.
 *
 * The row appears on that program's console Today tab until somebody marks
 * it answered, and what they type when they do is the only thing the school
 * ever sees back.
 */

export type AskResult = { ok: true } | { ok: false; error: string };

export async function askCoordinator(
  programId: number | null,
  _prev: AskResult | null,
  form: FormData,
): Promise<AskResult> {
  const schoolId = await currentSchoolId();
  if (!schoolId || !isDatabaseConfigured()) {
    return { ok: false, error: "Your account is not attached to a school yet." };
  }

  const topicRaw = String(form.get("topic") ?? "").trim();
  const topic = (TOPICS as readonly string[]).includes(topicRaw) ? topicRaw : "Something else";
  const body = String(form.get("body") ?? "").trim();

  if (body.length < 3) {
    return { ok: false, error: "Write a line or two and we'll pass it on." };
  }

  try {
    const session = await safeAuth();
    const who = session?.user?.name ?? session?.user?.email ?? "Somebody at the school";

    await prisma.schoolActivity.create({
      data: {
        schoolId,
        programId: programId ?? undefined,
        type: "ASK",
        inbound: true,
        topic,
        // The summary is what the console row reads, so it says who and what
        // rather than repeating the message back.
        summary: `${who} asked about ${topic.toLowerCase()}`,
        detail: body.slice(0, 4000),
      },
    });

    revalidatePath("/school");
    if (programId) revalidatePath(`/school/programs`);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/**
 * A coordinator marking an ask answered, with the words they choose to share.
 *
 * The reply is optional in the database and deliberately not optional here:
 * an ask marked answered with nothing written on it tells the school only
 * that somebody clicked a button, so the school's Today page ignores those
 * and shows only the ones carrying words.
 */
export async function answerAsk(
  activityId: string,
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) {
    return { ok: false, error: "You can't answer that." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const reply = String(form.get("reply") ?? "").trim();

  try {
    await prisma.schoolActivity.updateMany({
      where: { id: activityId, inbound: true, answeredAt: null },
      data: {
        answeredAt: new Date(),
        answeredById: session?.user?.id ?? undefined,
        reply: reply.length > 0 ? reply.slice(0, 4000) : null,
      },
    });
    revalidatePath("/admin/programs");
    revalidatePath("/school");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** The school has read a reply, so it stops appearing on their Today page. */
export async function markReplySeen(activityId: string): Promise<void> {
  const schoolId = await currentSchoolId();
  if (!schoolId || !isDatabaseConfigured()) return;

  try {
    await prisma.schoolActivity.updateMany({
      where: { id: activityId, schoolId, inbound: true },
      data: { seenBySchoolAt: new Date() },
    });
    revalidatePath("/school");
  } catch {
    // Seen-state is a convenience. Failing to record it changes nothing real.
  }
}
