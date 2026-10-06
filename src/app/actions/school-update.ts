"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { isStaffEmail } from "@/lib/access";
import { NEW_CONTACT } from "@/lib/school-update";

/**
 * Somebody from JOC writing down what happened with a school.
 *
 * Anybody with a justonechesed.org address, and nothing else to grant. The
 * alternative was a capability per person, which means somebody has to
 * remember to switch it on the week a new person starts — and the thing that
 * actually loses these records is friction, not permissions. Every entry
 * carries the name of whoever wrote it.
 *
 * Three shapes, because they are three different facts:
 *
 *   MEETING        we sat down with somebody and this is what was said
 *   EVENT_PLANNED  a date is in the diary and nobody has been yet
 *   VISIT          we ran it, and this is how it went
 *
 * The third used to be the only one, which meant a booked event had to be
 * written as though it had already happened.
 *
 * It writes a SchoolActivity, which is the row the school's history, the
 * board's Last update column and the school's own Today already read. One
 * record, four screens, no new plumbing.
 *
 * Nothing is sent to anybody.
 */

export type LogResult =
  | { ok: true; schoolName: string; newSchool: boolean; booked: boolean }
  | { ok: false; error: string };

/** A slug that will not collide with one of the thirty-nine. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function logSchoolUpdate(
  _prev: LogResult | null,
  form: FormData,
): Promise<LogResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const session = await safeAuth();
  const me = session?.user;

  if (!openForReview && !isStaffEmail(me?.email)) {
    return { ok: false, error: "Sign in with your justonechesed.org address first." };
  }

  const kind = form.get("kind") === "EVENT" ? "EVENT" : "MEETING";
  const booked = kind === "EVENT" && form.get("stage") === "BOOKED";

  const schoolId = String(form.get("schoolId") ?? "").trim();
  const newSchoolName = String(form.get("newSchoolName") ?? "").trim();
  const programId = Number(form.get("programId") ?? 0) || null;
  const what = String(form.get("what") ?? "").trim();
  const when = String(form.get("when") ?? "").trim();
  const time = String(form.get("time") ?? "").trim();
  // "Someone new" is an option in the list rather than a button beside it,
  // so the value that comes back for it is not an id.
  const picked = String(form.get("contactId") ?? "").trim();
  const contactId = picked === NEW_CONTACT ? "" : picked;
  const contactName = String(form.get("contactName") ?? "").trim();
  const contactReach = String(form.get("contactReach") ?? "").trim();
  const studentsRaw = String(form.get("students") ?? "").trim();

  if (!schoolId && !newSchoolName) return { ok: false, error: "Pick a school." };

  const dated = when && !Number.isNaN(Date.parse(when));
  if (booked) {
    if (!dated) return { ok: false, error: "Pick a date." };
  } else if (!what) {
    return {
      ok: false,
      error: kind === "MEETING" ? "Conversation notes are empty." : "Post event notes are empty.",
    };
  }

  // The clock on the wall at the school, kept as it was typed.
  //
  // Vercel runs in UTC and the person is in New York or Montreal, so parsing
  // "2:30 PM" as the server's local time would file a 2:30 event at 9:30. The
  // components are pinned to UTC instead and read back the same way, which is
  // what everybody means by "the assembly is at two".
  const atTime = /^\d{2}:\d{2}$/.test(time);
  const occurredAt = dated
    ? new Date(atTime ? `${when}T${time}:00.000Z` : when)
    : new Date();
  // Only an event that has happened has a number of students in front of it.
  const students = !booked && studentsRaw && /^\d+$/.test(studentsRaw) ? Number(studentsRaw) : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let id = schoolId;
      let name = "";
      let madeSchool = false;

      if (id) {
        const s = await tx.school.findUnique({ where: { id }, select: { name: true } });
        if (!s) throw new Error("gone");
        name = s.name;
      } else {
        // A school nobody has recorded yet. Made as a prospect and flagged,
        // rather than refused — a visit nobody can log is a visit nobody
        // writes down, which is worse than a row somebody has to check.
        let slug = slugify(newSchoolName);
        if (await tx.school.findUnique({ where: { slug }, select: { id: true } })) {
          slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
        }
        const made = await tx.school.create({
          data: { name: newSchoolName.slice(0, 120), slug, status: "PROSPECT" },
          select: { id: true, name: true },
        });
        id = made.id;
        name = made.name;
        madeSchool = true;
      }

      // The person they dealt with. Either one we already hold, or one they
      // named, which goes on the school's contacts so the next person has it.
      let person: string | null = null;
      if (contactId) {
        const c = await tx.schoolContact.findUnique({
          where: { id: contactId }, select: { name: true },
        });
        person = c?.name ?? null;
      } else if (contactName) {
        const existing = await tx.schoolContact.count({ where: { schoolId: id } });
        await tx.schoolContact.create({
          data: {
            schoolId: id,
            name: contactName.slice(0, 120),
            email: contactReach.includes("@") ? contactReach.slice(0, 160) : null,
            phone: contactReach.includes("@") ? null : contactReach.slice(0, 40) || null,
            // The first person anybody names is the one to ring.
            isPrimary: existing === 0,
          },
        });
        person = contactName;
      }

      const who = me?.name ?? me?.email ?? "Somebody at JOC";
      const program = programId
        ? await tx.programPage.findUnique({ where: { id: programId }, select: { name: true } })
        : null;

      const type = kind === "MEETING" ? "MEETING" : booked ? "EVENT_PLANNED" : "VISIT";

      const summary =
        kind === "MEETING"
          ? program ? `${program.name} meeting at ${name}` : `Meeting at ${name}`
          : booked
            ? program ? `${program.name} booked at ${name}` : `Event booked at ${name}`
            : program ? `${program.name} at ${name}` : `Visit to ${name}`;

      const detail = [
        what || null,
        person ? `With ${person}.` : null,
        // Always labelled as an estimate. Nobody counted them.
        students != null ? `About ${students} students, ${who.split(/\s+/)[0]}'s estimate.` : null,
      ].filter(Boolean).join("\n\n");

      await tx.schoolActivity.create({
        data: {
          schoolId: id,
          type,
          summary,
          detail: detail || null,
          occurredAt,
          authorId: me?.id ?? undefined,
          programId: programId ?? undefined,
        },
      });

      if (madeSchool) {
        await tx.schoolActivity.create({
          data: {
            schoolId: id,
            type: "NOTE",
            summary: `Added from a school update by ${who} — needs checking`,
            detail: "Nobody has confirmed this school's details. Check before it is used.",
            occurredAt,
            authorId: me?.id ?? undefined,
          },
        });
      }

      return { name, madeSchool };
    });

    revalidatePath("/admin/interactions");
    revalidatePath("/admin/schools/board");
    return { ok: true, schoolName: result.name, newSchool: result.madeSchool, booked };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}
