"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { putFile } from "@/lib/files";
import { canApprove, isScreenStaff, screenActor, type ScreenActor } from "@/lib/school-screen/access";
import { dayEnd, dayStart, emailAllowed, normalizeDomains } from "@/lib/school-screen/rules";

/**
 * Everything that changes a school's screen.
 *
 * Every action works out who is asking from the session and what part they
 * play in that school's screen (src/lib/school-screen/access.ts), never from
 * anything the form says. What an ambassador adds goes in PENDING; what a
 * teacher or JOC adds goes straight up, because they are the ones who would
 * have approved it.
 */

type R = { ok: true; id?: string } | { ok: false; error: string };

const SCREEN_IMAGE_LIMIT = 3 * 1024 * 1024;
const SCREEN_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function done() {
  revalidatePath("/admin/school-screens", "layout");
  revalidatePath("/school/screen");
  revalidatePath("/ambassador/screen");
}

function clean(v: FormDataEntryValue | null | undefined, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function ymd(v: FormDataEntryValue | null | undefined): string | null {
  const s = clean(v, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/** Who is asking about this school, or a refusal to hand straight back. */
async function actorFor(schoolId: string | null): Promise<ScreenActor | { error: string }> {
  if (!isDatabaseConfigured()) return { error: "The database is not connected." };
  if (schoolId === null) {
    // Something for every school's screen is JOC's to put up.
    const session = await safeAuth();
    if (!isScreenStaff(session?.user)) return { error: "Only JOC can put something on every school's screen." };
    return { userId: session?.user?.id ?? null, email: session?.user?.email ?? null, role: "staff" };
  }
  const a = await screenActor(schoolId);
  return a ?? { error: "You can't change this school's screen." };
}

async function saveImage(file: FormDataEntryValue | null, userId: string | null): Promise<{ id: string } | { error: string } | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!SCREEN_IMAGE_TYPES.has(file.type)) return { error: "Use a JPG, PNG or WebP picture." };
  if (file.size > SCREEN_IMAGE_LIMIT) return { error: "That picture is over 3 MB. Try a smaller one." };
  const saved = await putFile({
    name: file.name || "screen-image",
    mimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
    uploadedById: userId,
  });
  return saved.ok ? { id: saved.id } : { error: saved.error };
}

/* --------------------------------------------------------------- flyers -- */

/**
 * Add a flyer, or change one.
 *
 * An ambassador may change only their own, and only while it is waiting:
 * once a teacher has approved it, changing it would put words on the wall
 * nobody approved. A teacher or JOC changing an approved flyer keeps it up.
 */
export async function saveFlyer(form: FormData): Promise<R> {
  const id = clean(form.get("id"), 40) || null;
  const schoolId = clean(form.get("schoolId"), 40) || null;
  const a = await actorFor(schoolId);
  if ("error" in a) return { ok: false, error: a.error };

  const template = clean(form.get("template"), 10);
  if (template !== "EVENT" && template !== "PROGRAM" && template !== "BANNER") {
    return { ok: false, error: "Pick a kind of flyer." };
  }
  const title = clean(form.get("title"), 80);
  if (!title) return { ok: false, error: "Give it a name." };

  const from = ymd(form.get("showFrom"));
  const until = ymd(form.get("showUntil"));
  if (!from || !until) return { ok: false, error: "Say when it goes up and when it comes down." };
  if (until < from) return { ok: false, error: "It comes down before it goes up." };
  const date = ymd(form.get("startsAt"));

  const qrUrl = clean(form.get("qrUrl"), 500);
  if (qrUrl && !/^https:\/\//i.test(qrUrl)) return { ok: false, error: "The QR link has to start with https://" };

  if (id) {
    const existing = await prisma.screenFlyer.findUnique({
      where: { id }, select: { schoolId: true, createdById: true, status: true },
    }).catch(() => null);
    if (!existing || existing.schoolId !== schoolId) return { ok: false, error: "That flyer has gone." };
    if (a.role === "ambassador" && (existing.createdById !== a.userId || existing.status !== "PENDING")) {
      return { ok: false, error: "Only a teacher can change a flyer once it has been approved." };
    }
  }

  const image = await saveImage(form.get("image"), a.userId);
  if (image && "error" in image) return { ok: false, error: image.error };

  const approves = canApprove(a.role);
  const data = {
    template,
    title,
    line: clean(form.get("line"), 120) || null,
    startsAt: date ? dayStart(date) : null,
    time: clean(form.get("time"), 40) || null,
    place: clean(form.get("place"), 60) || null,
    ambassadors: clean(form.get("ambassadors"), 60) || null,
    icon: clean(form.get("icon"), 40).replace(/[^a-z0-9_]/g, "") || null,
    qrUrl: qrUrl || null,
    qrLabel: clean(form.get("qrLabel"), 30) || null,
    showFrom: dayStart(from),
    showUntil: dayEnd(until),
    sort: Number.parseInt(clean(form.get("sort"), 4), 10) || 0,
    ...(image ? { imageId: image.id } : {}),
    ...(form.get("removeImage") === "1" && !image ? { imageId: null } : {}),
  } as const;

  try {
    if (id) {
      await prisma.screenFlyer.update({
        where: { id },
        data: {
          ...data,
          ...(approves ? { status: "APPROVED", decidedById: a.userId, decidedAt: new Date() } : {}),
        },
      });
      done();
      return { ok: true, id };
    }
    const made = await prisma.screenFlyer.create({
      data: {
        ...data,
        schoolId,
        createdById: a.userId,
        status: approves ? "APPROVED" : "PENDING",
        ...(approves ? { decidedById: a.userId, decidedAt: new Date() } : {}),
      },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function deleteFlyer(id: string): Promise<R> {
  const f = await prisma.screenFlyer.findUnique({
    where: { id }, select: { schoolId: true, createdById: true, status: true },
  }).catch(() => null);
  if (!f) return { ok: false, error: "That flyer has gone." };
  const a = await actorFor(f.schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (a.role === "ambassador" && (f.createdById !== a.userId || f.status === "APPROVED")) {
    return { ok: false, error: "Ask a teacher to take that one down." };
  }
  await prisma.screenFlyer.delete({ where: { id } }).catch(() => null);
  done();
  return { ok: true };
}

export async function decideFlyer(id: string, approve: boolean): Promise<R> {
  const f = await prisma.screenFlyer.findUnique({ where: { id }, select: { schoolId: true } }).catch(() => null);
  if (!f) return { ok: false, error: "That flyer has gone." };
  const a = await actorFor(f.schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (!canApprove(a.role)) return { ok: false, error: "A teacher approves flyers." };
  await prisma.screenFlyer.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED", decidedById: a.userId, decidedAt: new Date() },
  }).catch(() => null);
  done();
  return { ok: true };
}

/* --------------------------------------------------------------- photos -- */

/**
 * Upload a photo of students doing chesed.
 *
 * The uploader says every student in it has media consent on file. Without
 * that tick it does not save: a face on a hallway TV is not something to
 * sort out afterwards.
 */
export async function uploadScreenPhoto(form: FormData): Promise<R> {
  const schoolId = clean(form.get("schoolId"), 40);
  if (!schoolId) return { ok: false, error: "Which school?" };
  const a = await actorFor(schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (form.get("consent") !== "1") {
    return { ok: false, error: "Tick the box to say every student in it has media consent." };
  }
  const image = await saveImage(form.get("image"), a.userId);
  if (!image) return { ok: false, error: "Choose a photo first." };
  if ("error" in image) return { ok: false, error: image.error };

  const approves = canApprove(a.role);
  try {
    const made = await prisma.screenPhoto.create({
      data: {
        schoolId,
        imageId: image.id,
        caption: clean(form.get("caption"), 90) || null,
        consent: true,
        uploadedById: a.userId,
        status: approves ? "APPROVED" : "PENDING",
        ...(approves ? { decidedById: a.userId, decidedAt: new Date() } : {}),
      },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function decidePhoto(id: string, approve: boolean): Promise<R> {
  const p = await prisma.screenPhoto.findUnique({ where: { id }, select: { schoolId: true } }).catch(() => null);
  if (!p) return { ok: false, error: "That photo has gone." };
  const a = await actorFor(p.schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (!canApprove(a.role)) return { ok: false, error: "A teacher approves photos." };
  await prisma.screenPhoto.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED", decidedById: a.userId, decidedAt: new Date() },
  }).catch(() => null);
  done();
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<R> {
  const p = await prisma.screenPhoto.findUnique({
    where: { id }, select: { schoolId: true, uploadedById: true, status: true, imageId: true },
  }).catch(() => null);
  if (!p) return { ok: false, error: "That photo has gone." };
  const a = await actorFor(p.schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (a.role === "ambassador" && (p.uploadedById !== a.userId || p.status === "APPROVED")) {
    return { ok: false, error: "Ask a teacher to take that one down." };
  }
  // The stored file goes with it; the photo row cascades from the file.
  await prisma.storedFile.delete({ where: { id: p.imageId } }).catch(() => null);
  done();
  return { ok: true };
}

/* ----------------------------------------------------------- dedication -- */

export async function setDedication(form: FormData): Promise<R> {
  const schoolId = clean(form.get("schoolId"), 40) || null;
  const a = await actorFor(schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (!canApprove(a.role)) return { ok: false, error: "A teacher sets the dedication." };

  const date = ymd(form.get("date"));
  const hebrewName = clean(form.get("hebrewName"), 80);
  if (!date) return { ok: false, error: "Pick the day." };
  if (!hebrewName) return { ok: false, error: "Write the name it is dedicated to." };
  const day = new Date(`${date}T00:00:00.000Z`);

  try {
    // One per school per day: setting it again replaces it.
    await prisma.screenDedication.deleteMany({ where: { schoolId, date: day } });
    const made = await prisma.screenDedication.create({
      data: { schoolId, date: day, hebrewName, text: clean(form.get("text"), 120) || null, setById: a.userId },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function deleteDedication(id: string): Promise<R> {
  const d = await prisma.screenDedication.findUnique({ where: { id }, select: { schoolId: true } }).catch(() => null);
  if (!d) return { ok: false, error: "That has gone." };
  const a = await actorFor(d.schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (!canApprove(a.role)) return { ok: false, error: "A teacher sets the dedication." };
  await prisma.screenDedication.delete({ where: { id } }).catch(() => null);
  done();
  return { ok: true };
}

/* ------------------------------------------------------------- settings -- */

export async function saveScreenSettings(form: FormData): Promise<R> {
  const schoolId = clean(form.get("schoolId"), 40);
  const a = await actorFor(schoolId || null);
  if ("error" in a) return { ok: false, error: a.error };
  if (!canApprove(a.role)) return { ok: false, error: "A teacher looks after the screen's settings." };

  const logo = clean(form.get("logoUrl"), 500);
  if (logo && !/^https:\/\//i.test(logo)) return { ok: false, error: "The logo link has to start with https://" };
  const goal = Number.parseInt(clean(form.get("gradeGoal"), 6), 10);

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      screenShortName: clean(form.get("shortName"), 24) || null,
      screenLogoUrl: logo || null,
      screenGradeGoal: Number.isFinite(goal) && goal > 0 ? goal : null,
      screenEmailDomains: normalizeDomains(clean(form.get("emailDomains"), 300)),
    },
  }).catch(() => null);
  done();
  return { ok: true };
}

/**
 * Mark a school's screen up, or take it down.
 *
 * Up sets the address the school's own "Your live screen" link opens and the
 * date it went up, and puts the school in every other screen's ticker. Down
 * clears both. The TV itself keeps working at its address either way — this
 * is JOC's record of which hallways have one, not a switch on the set.
 */
export async function setScreenUp(schoolId: string, up: boolean): Promise<R> {
  const session = await safeAuth();
  if (!isScreenStaff(session?.user)) return { ok: false, error: "JOC sets a screen up." };
  const school = await prisma.school.findUnique({
    where: { id: schoolId }, select: { slug: true, liveScreenAt: true },
  }).catch(() => null);
  if (!school) return { ok: false, error: "No such school." };

  let liveScreenUrl: string | null = null;
  if (up) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (!host) return { ok: false, error: "Couldn't work out the site's address." };
    liveScreenUrl = `${proto}://${host}/school-screen/${school.slug}`;
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: up
      ? { liveScreenUrl, liveScreenAt: school.liveScreenAt ?? new Date() }
      : { liveScreenUrl: null, liveScreenAt: null },
  }).catch(() => null);
  done();
  revalidatePath("/admin/lobby");
  revalidatePath("/admin/schools", "layout");
  return { ok: true };
}

/* ----------------------------------------------------------- shout-outs -- */

/**
 * A student's shout-out, from the QR code on the screen.
 *
 * Signed in, with the school's own email address when the school has said
 * what that is. Whether their name may be shown is asked here, on the form,
 * by the person whose name it is. It goes in PENDING; a teacher decides.
 */
export async function submitShoutOut(form: FormData): Promise<R> {
  if (!isDatabaseConfigured()) return { ok: false, error: "The database is not connected." };
  const session = await safeAuth();
  const me = session?.user;
  if (!me?.id || !me.email) return { ok: false, error: "Sign in with your school email first." };

  const slug = clean(form.get("slug"), 80);
  const school = await prisma.school.findUnique({
    where: { slug }, select: { id: true, screenEmailDomains: true },
  }).catch(() => null);
  if (!school) return { ok: false, error: "That school isn't on JOC." };
  if (!emailAllowed(me.email, school.screenEmailDomains)) {
    return { ok: false, error: `Sign in with your school email (@${school.screenEmailDomains[0]}).` };
  }

  const text = clean(form.get("text"), 220);
  const firstName = clean(form.get("firstName"), 30);
  const lastInitial = clean(form.get("lastInitial"), 2).replace(/[^\p{L}]/gu, "").slice(0, 1);
  const grade = clean(form.get("grade"), 20);
  if (text.length < 10) return { ok: false, error: "Say a little more: who, and what they did." };
  if (!grade) return { ok: false, error: "Which grade are you in?" };

  // Five waiting at once is plenty for one person.
  const waiting = await prisma.shoutOut.count({ where: { authorId: me.id, status: "PENDING" } }).catch(() => 0);
  if (waiting >= 5) return { ok: false, error: "You have five waiting already. A teacher will get to them soon." };

  try {
    const made = await prisma.shoutOut.create({
      data: {
        schoolId: school.id, text, firstName, lastInitial, grade,
        showName: form.get("showName") === "1" && Boolean(firstName),
        authorId: me.id, authorEmail: me.email,
      },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't send. Try again in a minute." };
  }
}

export async function decideShoutOut(id: string, approve: boolean): Promise<R> {
  const s = await prisma.shoutOut.findUnique({ where: { id }, select: { schoolId: true } }).catch(() => null);
  if (!s) return { ok: false, error: "That shout-out has gone." };
  const a = await actorFor(s.schoolId);
  if ("error" in a) return { ok: false, error: a.error };
  if (!canApprove(a.role)) return { ok: false, error: "A teacher approves shout-outs." };
  await prisma.shoutOut.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED", decidedById: a.userId, decidedAt: new Date() },
  }).catch(() => null);
  done();
  return { ok: true };
}
