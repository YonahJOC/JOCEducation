import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canApprove, type ScreenRole } from "./access";
import { screenImageUrl } from "./data";
import { dayKey } from "./rules";

/**
 * What a screen's editor shows, shaped by who is looking.
 *
 * A teacher or JOC sees the lot: what is waiting, what is up, the
 * shout-outs and who sent them, the settings. An ambassador sees the
 * slideshow and where their own additions have got to — not the shout-out
 * queue, which carries other students' email addresses, and not the
 * settings.
 */

export type { ScreenStatus } from "@/lib/school-screen/rules";
/** @deprecated the states live in one place now — use ScreenStatus. */
export type EditorStatus = import("@/lib/school-screen/rules").ScreenStatus;

export type EditorFlyer = {
  id: string;
  schoolId: string | null;
  template: "EVENT" | "PROGRAM" | "BANNER";
  title: string;
  line: string | null;
  startsAt: string | null;
  time: string | null;
  place: string | null;
  ambassadors: string | null;
  icon: string | null;
  imageUrl: string | null;
  qrUrl: string | null;
  qrLabel: string | null;
  showFrom: string;
  showUntil: string;
  sort: number;
  status: EditorStatus;
  by: string | null;
  mine: boolean;
};

export type EditorPhoto = {
  id: string; imageUrl: string; caption: string | null; status: EditorStatus; by: string | null; mine: boolean;
};

export type EditorShoutOut = {
  id: string; text: string; firstName: string; lastName: string; grade: string;
  showName: boolean; email: string; status: EditorStatus; createdAt: string;
};

export type EditorDedication = { id: string; date: string; hebrewName: string; text: string | null; everySchool: boolean };

export type ScreenEditorData = {
  school: {
    id: string; slug: string; name: string;
    shortName: string | null; logoUrl: string | null; gradeGoal: number | null; emailDomains: string[];
    screenUp: boolean;
  };
  role: ScreenRole;
  canApprove: boolean;
  flyers: EditorFlyer[];
  photos: EditorPhoto[];
  shoutOuts: EditorShoutOut[];
  dedications: EditorDedication[];
};

function who(u: { name: string | null; email: string | null } | null): string | null {
  if (!u) return null;
  return (u.name ?? u.email ?? "").split(/[\s@]/)[0] || null;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export async function screenEditorData(
  schoolId: string, role: ScreenRole, userId: string | null,
): Promise<ScreenEditorData | null> {
  if (!isDatabaseConfigured()) return null;
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true, slug: true, name: true, liveScreenUrl: true,
      screenShortName: true, screenLogoUrl: true, screenGradeGoal: true, screenEmailDomains: true,
    },
  }).catch(() => null);
  if (!school) return null;

  const approver = canApprove(role);
  const now = new Date();
  // Last month onward: enough to see what just came down, not the archive.
  const since = new Date(now.getTime() - 31 * 86400000);
  const today = new Date(`${dayKey(now)}T00:00:00.000Z`);

  const [flyers, photos, shouts, dedications] = await Promise.all([
    prisma.screenFlyer.findMany({
      where: {
        showUntil: { gte: since },
        AND: [
          { OR: [{ schoolId }, { schoolId: null }] },
          ...(approver ? [] : [{ OR: [{ status: "APPROVED" as const }, { createdById: userId ?? "-" }] }]),
        ],
      },
      orderBy: [{ status: "asc" }, { sort: "asc" }, { createdAt: "desc" }],
      take: 80,
      select: {
        id: true, schoolId: true, template: true, title: true, line: true, startsAt: true, time: true,
        place: true, ambassadors: true, icon: true, imageId: true, qrUrl: true, qrLabel: true,
        showFrom: true, showUntil: true, sort: true, status: true, createdById: true,
        createdBy: { select: { name: true, email: true } },
      },
    }).catch(() => []),

    prisma.screenPhoto.findMany({
      where: {
        schoolId,
        ...(approver ? {} : { OR: [{ status: "APPROVED" }, { uploadedById: userId ?? "-" }] }),
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true, imageId: true, caption: true, status: true, uploadedById: true,
        uploadedBy: { select: { name: true, email: true } },
      },
    }).catch(() => []),

    approver
      ? prisma.shoutOut.findMany({
          where: { schoolId, OR: [{ status: "PENDING" }, { createdAt: { gte: since } }] },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 60,
          select: {
            id: true, text: true, firstName: true, lastName: true, grade: true,
            showName: true, authorEmail: true, status: true, createdAt: true,
          },
        }).catch(() => [])
      : Promise.resolve([]),

    approver
      ? prisma.screenDedication.findMany({
          where: { OR: [{ schoolId }, { schoolId: null }], date: { gte: today } },
          orderBy: { date: "asc" },
          take: 30,
          select: { id: true, date: true, hebrewName: true, text: true, schoolId: true },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return {
    school: {
      id: school.id, slug: school.slug, name: school.name,
      shortName: school.screenShortName, logoUrl: school.screenLogoUrl,
      gradeGoal: school.screenGradeGoal, emailDomains: school.screenEmailDomains,
      screenUp: Boolean(school.liveScreenUrl),
    },
    role,
    canApprove: approver,
    flyers: flyers.map((f) => ({
      id: f.id, schoolId: f.schoolId, template: f.template, title: f.title, line: f.line,
      startsAt: f.startsAt ? f.startsAt.toISOString() : null,
      time: f.time, place: f.place, ambassadors: f.ambassadors, icon: f.icon,
      imageUrl: f.imageId ? screenImageUrl(f.imageId) : null,
      qrUrl: f.qrUrl, qrLabel: f.qrLabel,
      showFrom: dayKey(f.showFrom), showUntil: dayKey(f.showUntil),
      sort: f.sort, status: f.status, by: who(f.createdBy), mine: Boolean(userId && f.createdById === userId),
    })),
    photos: photos.map((p) => ({
      id: p.id, imageUrl: screenImageUrl(p.imageId), caption: p.caption, status: p.status,
      by: who(p.uploadedBy), mine: Boolean(userId && p.uploadedById === userId),
    })),
    shoutOuts: shouts.map((s) => ({
      id: s.id, text: s.text, firstName: s.firstName, lastName: s.lastName, grade: s.grade,
      showName: s.showName, email: s.authorEmail, status: s.status, createdAt: s.createdAt.toISOString(),
    })),
    dedications: dedications.map((d) => ({
      id: d.id, date: ymd(d.date), hebrewName: d.hebrewName, text: d.text, everySchool: d.schoolId === null,
    })),
  };
}
