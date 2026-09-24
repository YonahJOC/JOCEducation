import { PrismaClient } from "@prisma/client";

/**
 * Record the app organisation for each school we are sure about.
 *
 * The eleven whose names match exactly were written by app-orgs.mjs. These
 * are the rest: fourteen that differ only by a suffix the app leaves off, and
 * five that the app holds under the acronym everybody uses for them.
 *
 * Deliberately not here, because a wrong id puts another school's figures on
 * somebody's page:
 *
 *   YULA High School — the app has "YULA Boys" and may well have a Girls
 *   organisation too, in which case this is two schools, not one.
 *   Azrieli Hertziliah — "Azrieli Herzliah High School in Montreal" and
 *   "Herzliah High School" are both in the app and may be the same school.
 *   HANC High School — "HANC" and "HANC Middle School".
 *   Hillel Yeshiva High School — "Hillel Yeshiva Ocean NJ" and "Hillel Torah".
 *   Ilan High School — "Ilan High School for Girls" and one other.
 *
 * Maimonide School Montreal has nothing close in the app at all.
 *
 * It verifies each id against the app before writing it, so a typo here
 * cannot quietly attach a school to the wrong organisation.
 */

const prisma = new PrismaClient();
const BASE = "https://api.justonechesed.org";

/** Portal school name -> the app organisation id and the name we expect there. */
const LINKS = [
  // Same name, the app just leaves the suffix off.
  ["Barkai Yeshivah School", "200", "Barkai"],
  ["Bialik High School", "134", "Bialik"],
  ["Bruriah High School", "17", "Bruriah"],
  ["DRS Yeshiva High School", "39", "DRS Yeshiva"],
  ["Fuchs Mizrachi High School", "13", "Fuchs Mizrachi"],
  ["JEC High School", "100", "JEC"],
  ["Katz Yeshiva High School", "77", "Katz"],
  ["Kohelet Yeshiva High School", "11", "Kohelet Yeshiva"],
  ["Ma'ayanot Yeshiva High School", "5", "Ma'ayanot"],
  ["Magen David Yeshiva High School", "45", "Magen David Yeshiva"],
  ["Mazel Day School", "106", "Mazel Day High School"],
  ["Ohr Hatorah Yeshiva High School", "79", "Ohr Hatorah"],
  ["Shulamith High School", "97", "Shulamith"],
  ["Yeshivat Har Torah", "102", "Har Torah"],

  // The app holds these under the acronym everybody uses.
  ["Ida Crown Jewish Academy", "6", "ICJA"],
  ["Brauser Maimonides Academy", "10", "BMA"],
  ["Yeshiva of Central Queens", "57", "YCQ"],
  ["Bi-Cultural Hebrew Academy", "192", "BCHA"],
  ["Northwest Yeshiva High School", "108", "NYHS Seattle"],
];

async function nameOf(id) {
  try {
    const res = await fetch(`${BASE}/organisations/${id}/getPublicInfo`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d?.organizationName ?? null;
  } catch {
    return null;
  }
}

let written = 0;
const skipped = [];

for (const [schoolName, id, expect] of LINKS) {
  const school = await prisma.school.findFirst({
    where: { name: schoolName },
    select: { id: true, name: true, appSchoolId: true },
  });

  if (!school) {
    skipped.push(`${schoolName} — no such school in the portal`);
    continue;
  }

  const actual = await nameOf(id);
  if (actual == null) {
    skipped.push(`${schoolName} — the app did not answer for id ${id}`);
    continue;
  }
  if (actual.trim() !== expect.trim()) {
    skipped.push(`${schoolName} — id ${id} is "${actual}", expected "${expect}"`);
    continue;
  }

  await prisma.school.update({
    where: { id: school.id },
    data: { appSchoolId: id },
  });
  console.log(`  ${id.padStart(4)}  ${school.name}  ->  "${actual}"`);
  written++;
}

console.log(`\n${written} linked.`);
if (skipped.length > 0) {
  console.log(`\nNot written (${skipped.length}):`);
  skipped.forEach((s) => console.log(`  ${s}`));
}

const total = await prisma.school.count();
const linked = await prisma.school.count({ where: { appSchoolId: { not: null } } });
console.log(`\n${linked} of ${total} schools now have an app organisation.`);

await prisma.$disconnect();
