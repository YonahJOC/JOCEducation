"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can, isSuperAdminEmail } from "@/lib/access";
import {
  NEW_CLIENT, parseType, parseStatus, parseGroupSize, pinWallClock, summaryLine,
  takesGroupSize, mayChange,
} from "@/lib/experiences";

/**
 * Somebody in Experiences writing down what happened with a client.
 *
 * The department's version of the School Update Form, and deliberately the
 * same shape: one record per thing that happened, carrying the name of
 * whoever wrote it, read back by the feed and by the client's own card. One
 * record, two screens, no plumbing in between.
 *
 * Gated on the experiences capability rather than "any JOC address", unlike
 * the school form. A school update is one line about your own visit; this is
 * a department's client list, with families' phone numbers on it, and seeing
 * it is a decision somebody makes per person at /admin/roles.
 *
 * Two bars, as on the Buzz:
 *
 *   log, comment,   anybody in the department — that is the job
 *   add a client
 *   edit, remove    whoever wrote it, or a super admin. Wider than the Buzz,
 *                   where only a super admin edits: this is three people
 *                   keeping their own notes, and making them ask somebody to
 *                   fix their own typo is how a log stops being kept
 *
 * Nothing is sent to anybody.
 */

export type ExperienceResult = { ok: true } | { ok: false; error: string };

export type LogExperienceResult =
  | { ok: true; clientId: string; clientName: string; newClient: boolean }
  | { ok: false; error: string };

export type SaveClientResult =
  | { ok: true; id: string; name: string; created: boolean }
  | { ok: false; error: string };

type Me = { id?: string | null; email?: string | null; name?: string | null; role?: string | null; capabilities?: string[] | null };

async function member(): Promise<{ user: Me; ok: boolean; superAdmin: boolean }> {
  const session = await safeAuth();
  const user = (session?.user ?? {}) as Me;
  return {
    user,
    ok: openForReview || can(user, "experiences"),
    superAdmin: openForReview || isSuperAdminEmail(user.email),
  };
}

/** Every page that reads these rows. The layout covers a client's own card. */
function touched() {
  revalidatePath("/admin/experiences", "layout");
}

const str = (form: FormData, key: string, max: number) =>
  String(form.get(key) ?? "").trim().slice(0, max);

/** What happened, against a client we hold or one named on the spot. */
export async function logExperience(
  _prev: LogExperienceResult | null,
  form: FormData,
): Promise<LogExperienceResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { user, ok } = await member();
  if (!ok) return { ok: false, error: "You don't have Client relations. Ask a super admin to switch it on." };

  const type = parseType(form.get("type"));
  if (!type) return { ok: false, error: "Pick what kind of interaction it was." };

  // "New client" is an option in the list rather than a button beside it, so
  // the value that comes back for it is not an id.
  const picked = str(form, "clientId", 60);
  const clientId = picked === NEW_CLIENT ? "" : picked;
  const newName = str(form, "newClientName", 120);
  if (!clientId && !newName) return { ok: false, error: "Pick a client, or type a new one." };

  const written = str(form, "summary", 200);
  const detail = str(form, "detail", 8000);
  if (!written && !detail) return { ok: false, error: "Write what happened." };

  const occurredAt = pinWallClock(str(form, "when", 10), str(form, "time", 5), new Date());
  const groupSize = takesGroupSize(type) ? parseGroupSize(form.get("groupSize")) : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let id = clientId;
      let name = "";
      let made = false;

      if (id) {
        const c = await tx.experienceClient.findUnique({ where: { id }, select: { name: true } });
        if (!c) throw new Error("gone");
        name = c.name;
      } else {
        // Somebody typed a name the list already holds — the dropdown is long
        // and typing is quicker. Use the one we have rather than making a
        // second Cohen family with half the history each.
        const same = await tx.experienceClient.findFirst({
          where: { archivedAt: null, name: { equals: newName, mode: "insensitive" } },
          select: { id: true, name: true },
        });
        if (same) {
          id = same.id;
          name = same.name;
        } else {
          const c = await tx.experienceClient.create({
            data: { name: newName, ownerId: user.id ?? null },
            select: { id: true, name: true },
          });
          id = c.id;
          name = c.name;
          made = true;
        }
      }

      await tx.experienceActivity.create({
        data: {
          clientId: id,
          type,
          summary: summaryLine(type, name, written),
          detail: detail || null,
          occurredAt,
          groupSize,
          authorId: user.id ?? null,
        },
      });

      return { id, name, made };
    });

    touched();
    return { ok: true, clientId: result.id, clientName: result.name, newClient: result.made };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/** Add a client, or change one. The same form does both; an id means change. */
export async function saveClient(
  _prev: SaveClientResult | null,
  form: FormData,
): Promise<SaveClientResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { ok } = await member();
  if (!ok) return { ok: false, error: "You don't have Client relations." };

  const id = str(form, "id", 60);
  const name = str(form, "name", 120);
  if (!name) return { ok: false, error: "A client needs a name." };

  const ownerRaw = str(form, "ownerId", 60);
  const data = {
    name,
    kind: str(form, "kind", 60) || null,
    contactName: str(form, "contactName", 120) || null,
    email: str(form, "email", 160) || null,
    phone: str(form, "phone", 40) || null,
    notes: str(form, "notes", 8000) || null,
    status: parseStatus(form.get("status")),
    ownerId: ownerRaw || null,
  };

  try {
    if (data.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: data.ownerId }, select: { schoolId: true },
      });
      if (!owner) return { ok: false, error: "That person is no longer here." };
      if (owner.schoolId) return { ok: false, error: "That account belongs to a school." };
    }

    if (id) {
      // Archived is a tickbox on the edit form. Ticking it again does not
      // move the date it was first archived.
      const archive = form.get("archived") === "on";
      const before = await prisma.experienceClient.findUnique({
        where: { id }, select: { archivedAt: true },
      });
      if (!before) return { ok: false, error: "That client is no longer here." };
      await prisma.experienceClient.update({
        where: { id },
        data: { ...data, archivedAt: archive ? (before.archivedAt ?? new Date()) : null },
      });
      touched();
      return { ok: true, id, name, created: false };
    }

    const made = await prisma.experienceClient.create({ data, select: { id: true } });
    touched();
    return { ok: true, id: made.id, name, created: true };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/** Load the entry and say whether this person may change it. */
async function mine(activityId: string) {
  const { user, ok, superAdmin } = await member();
  if (!ok) return { allowed: false as const, error: "You don't have Client relations." };
  const row = await prisma.experienceActivity.findUnique({
    where: { id: activityId }, select: { authorId: true, type: true, client: { select: { name: true } } },
  }).catch(() => null);
  if (!row) return { allowed: false as const, error: "That entry is no longer here." };
  if (!mayChange(row, { id: user.id ?? null, superAdmin })) {
    return { allowed: false as const, error: "Only whoever wrote it, or a super admin, can change it." };
  }
  return { allowed: true as const, row };
}

/** Change what was written. The type and the client stay what they were. */
export async function editExperience(
  activityId: string,
  input: { summary: string; detail: string; groupSize: string },
): Promise<ExperienceResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const check = await mine(activityId);
  if (!check.allowed) return { ok: false, error: check.error };

  const type = parseType(check.row.type);
  const detail = input.detail.trim().slice(0, 8000);
  const written = input.summary.trim();
  if (!written && !detail) return { ok: false, error: "Write what happened." };

  try {
    await prisma.experienceActivity.update({
      where: { id: activityId },
      data: {
        summary: type ? summaryLine(type, check.row.client.name, written) : written.slice(0, 200),
        detail: detail || null,
        groupSize: type && takesGroupSize(type) ? parseGroupSize(input.groupSize) : null,
      },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}

/** Take it off, or put it back. Never a DELETE: the comments hang off it. */
export async function removeExperience(activityId: string, removed: boolean): Promise<ExperienceResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const check = await mine(activityId);
  if (!check.allowed) return { ok: false, error: check.error };

  try {
    await prisma.experienceActivity.update({
      where: { id: activityId },
      data: { removedAt: removed ? new Date() : null },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}

/** A comment under one entry. Anybody in the department. */
export async function addExperienceNote(activityId: string, body: string): Promise<ExperienceResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { user, ok } = await member();
  if (!ok) return { ok: false, error: "You don't have Client relations." };

  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };

  try {
    await prisma.experienceNote.create({
      data: { activityId, authorId: user.id ?? null, body: text.slice(0, 4000) },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}
