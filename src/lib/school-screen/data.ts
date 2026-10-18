import QRCode from "qrcode";
import { createHash } from "node:crypto";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getRunningCycle } from "@/lib/cycle-data";
import type { ScreenData, ScreenFlyer } from "./types";
import {
  dayKey, flyerShowing, hoursFromMinutes, pickDedication, shortName, shoutOutFrom, themeParts,
} from "./rules";

/**
 * Everything one school's TV is given, built from the database.
 *
 * The filters here are the screen's privacy rules, and they are the only
 * place those rules live: approved items only, inside their show window,
 * names only with consent, and nothing about another school but its name and
 * hours. The TV and the API never see a row this function did not pass.
 */

export const CHESED_MINUTE_URL = "https://justonechesed.org/chesedminute";

/** Where a flyer's or a photo's picture is served to a TV that cannot sign in. */
export function screenImageUrl(fileId: string): string {
  return `/api/school-screen/image/${fileId}`;
}

/** QR codes drawn here, as SVG, never fetched from a third-party service. */
export async function qrSvg(url: string): Promise<string | null> {
  try {
    return await QRCode.toString(url, {
      type: "svg", margin: 0, errorCorrectionLevel: "M",
      color: { dark: "#214ba5", light: "#00000000" },
    });
  } catch {
    return null;
  }
}

export function shoutOutUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/shout-out/${encodeURIComponent(slug)}`;
}

/** The flyer every screen falls back to when a school has nothing of its own up yet. */
async function chesedMinuteFlyer(): Promise<ScreenFlyer> {
  return {
    id: "joc-chesed-minute",
    template: "PROGRAM",
    title: "The Chesed Minute",
    line: "1 video. 60 seconds.",
    startsAt: null, time: null, place: null, ambassadors: null,
    icon: "mic",
    imageUrl: null,
    qrSvg: await qrSvg(CHESED_MINUTE_URL),
    qrLabel: "Scan to upload",
  };
}

export async function buildScreenData(slug: string, origin: string, now = new Date()): Promise<ScreenData | null> {
  if (!isDatabaseConfigured()) return null;

  const school = await prisma.school.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, isTest: true,
      screenShortName: true, screenLogoUrl: true, screenGradeGoal: true,
      appStats: { select: { minutesThisYear: true, actsAllTime: true, syncedAt: true } },
    },
  }).catch(() => null);
  if (!school) return null;

  const today = dayKey(now);
  const todayDate = new Date(`${today}T00:00:00.000Z`);

  const [dedications, flyerRows, photoRows, shoutRows, network, world, cycle] = await Promise.all([
    prisma.screenDedication.findMany({
      where: { date: todayDate, OR: [{ schoolId: school.id }, { schoolId: null }] },
      select: { schoolId: true, date: true, hebrewName: true, text: true },
    }).catch(() => []),

    prisma.screenFlyer.findMany({
      where: {
        status: "APPROVED",
        OR: [{ schoolId: school.id }, { schoolId: null }],
        showFrom: { lte: now }, showUntil: { gte: now },
      },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, template: true, title: true, line: true, startsAt: true, time: true, place: true,
        ambassadors: true, icon: true, imageId: true, qrUrl: true, qrLabel: true,
        status: true, showFrom: true, showUntil: true, updatedAt: true,
      },
    }).catch(() => []),

    prisma.screenPhoto.findMany({
      where: { schoolId: school.id, status: "APPROVED", consent: true },
      orderBy: { decidedAt: "desc" },
      take: 2,
      select: { id: true, imageId: true, caption: true },
    }).catch(() => []),

    prisma.shoutOut.findMany({
      where: { schoolId: school.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, text: true, firstName: true, lastName: true, grade: true, showName: true },
    }).catch(() => []),

    // Every other school with a screen up: its name and its hours, nothing else.
    prisma.school.findMany({
      where: { id: { not: school.id }, isTest: false, liveScreenUrl: { not: null } },
      select: { name: true, screenShortName: true, appStats: { select: { minutesThisYear: true } } },
    }).catch(() => []),

    prisma.appSchoolStats.aggregate({
      _sum: { hoursAllTime: true },
      where: { school: { isTest: false } },
    }).catch(() => null),

    getRunningCycle().catch(() => null),
  ]);

  const flyers: ScreenFlyer[] = [];
  for (const f of flyerRows) {
    if (!flyerShowing(f, now)) continue;
    flyers.push({
      id: f.id,
      template: f.template,
      title: f.title,
      line: f.line,
      startsAt: f.startsAt?.toISOString() ?? null,
      time: f.time, place: f.place, ambassadors: f.ambassadors, icon: f.icon,
      imageUrl: f.imageId ? screenImageUrl(f.imageId) : null,
      qrSvg: f.qrUrl ? await qrSvg(f.qrUrl) : null,
      qrLabel: f.qrLabel,
    });
  }
  const photos = photoRows.map((p) => ({ id: p.id, imageUrl: screenImageUrl(p.imageId), caption: p.caption }));
  if (flyers.length === 0 && photos.length === 0) flyers.push(await chesedMinuteFlyer());

  const dedication = pickDedication(
    dedications.map((d) => ({ ...d, date: d.date.toISOString().slice(0, 10) })),
    school.id, today,
  );

  const theme = cycle ? { ...themeParts(cycle.theme), topic: cycle.question || null } : null;
  const short = shortName(school.name, school.screenShortName);

  const data: Omit<ScreenData, "version"> = {
    school: { name: school.name, short, logoUrl: school.screenLogoUrl || null },
    stats: {
      acts: school.appStats?.actsAllTime ?? null,
      hours: school.appStats ? hoursFromMinutes(school.appStats.minutesThisYear) : null,
    },
    worldHours: world?._sum.hoursAllTime ?? null,
    networkSchools: network.length + 1,
    network: network
      .map((s) => ({ name: s.screenShortName || s.name, hours: hoursFromMinutes(s.appStats?.minutesThisYear) ?? 0 }))
      .filter((s) => s.hours > 0)
      .sort((a, b) => b.hours - a.hours),
    // The app reports no hours by grade yet. Until it does, the card stays down.
    grades: null,
    theme,
    dedication,
    photos,
    flyers,
    shoutOuts: shoutRows.map((s) => ({ id: s.id, text: s.text, from: shoutOutFrom(s) })),
    shoutOutQrSvg: await qrSvg(shoutOutUrl(origin, school.slug)),
  };

  return { ...data, version: versionOf(data) };
}

function versionOf(d: unknown): string {
  return createHash("sha1").update(JSON.stringify(d)).digest("hex").slice(0, 16);
}

/** Sample data for `?demo=1`: the design file's HAFTR, so the screen can be checked against it. */
export async function demoScreenData(origin: string): Promise<ScreenData> {
  const sample = "https://justonechesed.org/wp-content/uploads";
  const flyers: ScreenFlyer[] = [
    {
      id: "demo-ev-1", template: "EVENT", title: "Kindness Booth", line: null,
      startsAt: new Date(Date.now() + 3 * 86400000).toISOString(), time: "12:30 – 1:30 PM", place: "Main lobby",
      ambassadors: "Maya K. · Eli R.", icon: null, imageUrl: `${sample}/2025/01/Kindness-Booth-.jpeg`, qrSvg: null, qrLabel: null,
    },
    await chesedMinuteFlyer(),
    {
      id: "demo-ev-2", template: "EVENT", title: "Bake 4 Chesed", line: null,
      startsAt: new Date(Date.now() + 10 * 86400000).toISOString(), time: "2:00 – 3:30 PM", place: "Cafeteria",
      ambassadors: "Tamar G. · Josh F.", icon: null, imageUrl: `${sample}/2026/05/Hafrashat-Challah-5-scaled.jpg`, qrSvg: null, qrLabel: null,
    },
    {
      id: "demo-pg-1", template: "PROGRAM", title: "Just One Tutor", line: "Share what you know. Help someone learn.",
      startsAt: null, time: null, place: null, ambassadors: null, icon: "school", imageUrl: null,
      qrSvg: await qrSvg("https://justonechesed.org/tutor"), qrLabel: "Scan to sign up",
    },
    {
      id: "demo-bn-1", template: "BANNER", title: "Run for Chesed", line: "Join the team",
      startsAt: null, time: null, place: "Dead Sea Marathon", ambassadors: null, icon: null,
      imageUrl: null, qrSvg: await qrSvg("https://secure.qgiv.com/event/deadseamarathon/"), qrLabel: "Scan to join",
    },
  ];
  const data: Omit<ScreenData, "version"> = {
    school: { name: "HAFTR High School", short: "HAFTR", logoUrl: "https://www.haftr.org/wp-content/uploads/logos1/round-blue-logo-150x150.png" },
    stats: { acts: 3490, hours: 13578 },
    worldHours: 245453,
    networkSchools: 120,
    network: [
      { name: "Maimonides School", hours: 1204 }, { name: "Ramaz", hours: 1530 }, { name: "Maayanot", hours: 968 },
      { name: "Berman Hebrew Academy", hours: 1112 }, { name: "Shalhevet", hours: 845 }, { name: "Margolin Hebrew Academy", hours: 702 },
    ],
    grades: { goal: 250, rows: [
      { label: "9th grade", hours: 231 }, { label: "10th grade", hours: 204 },
      { label: "11th grade", hours: 176 }, { label: "12th grade", hours: 262 },
    ] },
    theme: { en: "Hachnasat Orchim", he: "הכנסת אורחים", topic: "Someone who made you feel welcome" },
    dedication: { hebrewName: "איתמר לביא בן עינב", text: null },
    photos: [
      { id: "demo-ph-1", imageUrl: `${sample}/2025/08/IMG-20250806-WA0013-768x576.jpg`, caption: "Packing chesed packages for families in need in Israel" },
      { id: "demo-ph-2", imageUrl: `${sample}/2025/04/GIVING-BEDS-TO-THOSE-IN-NEED-2.jpeg`, caption: "Building beds for families who need a safe place to sleep" },
    ],
    flyers,
    shoutOuts: [
      { id: "demo-so-1", text: "Rabbi Stern, thank you for saving me a seat on my first day. I felt at home right away.", from: "— Rivka L., 9th grade" },
      { id: "demo-so-2", text: "Our class threw a welcome lunch for the new student from Israel. Now she sits with us every day.", from: "— 10th grade" },
    ],
    shoutOutQrSvg: await qrSvg(shoutOutUrl(origin, "haftr")),
  };
  return { ...data, version: versionOf(data) };
}
