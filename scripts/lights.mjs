import { PrismaClient } from "@prisma/client";

/**
 * Run the traffic-light rules by hand.
 *
 *   node --env-file=.env scripts/lights.mjs
 *
 * The same thing the nightly cron does. Useful the first time, when no school
 * has a light at all and every console would otherwise say so.
 */

// src/lib/program-lights.ts is TypeScript and this file is not, so the rules
// are repeated here rather than imported. They are the same rules in the same
// order; if one changes, change both.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const DAY = 86_400_000;
const RECENT = 30;
const CONTACT = ["CALL", "EMAIL", "MEETING", "VISIT"];
const WORD = { CALL: "called", EMAIL: "emailed", MEETING: "met", VISIT: "visited" };
const day = (d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const now = new Date();

const lapsed = await prisma.schoolProgramLight.updateMany({
  where: { source: "MANUAL", until: { not: null, lte: now } },
  data: { source: "RULE", until: null },
});

const programs = await prisma.programPage.findMany({
  select: { id: true, name: true, formId: true, leads: { select: { name: true, email: true } } },
});
const schools = await prisma.school.findMany({ select: { id: true } });

// Who is in what — from ProgramEnrollment, the one table that answers it.
// Being merely introduced to a program is not being in it.
const IN = ["MEETING_BOOKED","REGISTERED","MATERIALS_SENT","TRAINED","LAUNCHED","RUNNING","PAUSED"];
const enrolled = await prisma.programEnrollment.findMany({
  where: { stage: { in: IN } },
  select: { schoolId: true, programId: true },
});
const inProgram = new Set(enrolled.map((e) => `${e.schoolId}:${e.programId}`));

const contacts = await prisma.schoolActivity.findMany({
  where: { type: { in: CONTACT }, occurredAt: { gte: new Date(now.getTime() - RECENT * DAY) } },
  orderBy: { occurredAt: "desc" },
  select: { schoolId: true, type: true, occurredAt: true, author: { select: { name: true, email: true } } },
});
const lastContact = new Map();
for (const c of contacts) {
  if (!lastContact.has(c.schoolId)) {
    lastContact.set(c.schoolId, { type: c.type, by: c.author ? c.author.name ?? c.author.email : null, at: c.occurredAt });
  }
}

const manual = await prisma.schoolProgramLight.findMany({ where: { source: "MANUAL" }, select: { schoolId: true, programId: true } });
const untouchable = new Set(manual.map((m) => `${m.schoolId}:${m.programId}`));

let written = 0;
for (const school of schools) {
  const others = programs.filter((p) => inProgram.has(`${school.id}:${p.id}`));

  for (const p of programs) {
    if (untouchable.has(`${school.id}:${p.id}`)) continue;
    const rest = others.filter((o) => o.id !== p.id);
    const first = rest[0];
    const contact = lastContact.get(school.id) ?? null;

    let light = "GREEN";
    let reason = "Not in any JOC program, and nobody here has been in touch in the last month.";

    if (first) {
      const lead = first.leads[0] ? first.leads[0].name ?? first.leads[0].email : null;
      light = "AMBER";
      reason =
        `Already in ${first.name}` +
        (lead ? `, run by ${lead}` : ", which has no lead down for it") +
        (rest.length > 1 ? ` (and ${rest.length - 1} other JOC program${rest.length - 1 === 1 ? "" : "s"})` : "") +
        ". Talk to them before you introduce another program.";
    } else if (contact) {
      const days = Math.floor((now.getTime() - new Date(contact.at).getTime()) / DAY);
      if (days <= RECENT) {
        light = "AMBER";
        reason =
          `${contact.by ?? "Somebody at JOC"} ${WORD[contact.type] ?? "spoke to"} them on ${day(contact.at)}` +
          `, ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}. Check where that got to first.`;
      }
    }

    await prisma.schoolProgramLight.upsert({
      where: { schoolId_programId: { schoolId: school.id, programId: p.id } },
      create: { schoolId: school.id, programId: p.id, light, reason, source: "RULE", setAt: now },
      update: { light, reason, source: "RULE", setAt: now, until: null },
    });
    written++;
  }
}

const counts = await prisma.schoolProgramLight.groupBy({ by: ["light"], _count: { light: true } });
console.log(`${schools.length} schools × ${programs.length} programs`);
console.log(`wrote ${written}, expired ${lapsed.count}`);
for (const c of counts) console.log(`  ${c.light}: ${c._count.light}`);

await prisma.$disconnect();
