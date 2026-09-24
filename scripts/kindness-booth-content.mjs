/**
 * The Kindness Booth, as JOC actually describes it.
 *
 * Every word below is from justonechesed.org/education/kindness-booths-for-schools,
 * which is the page a school reads before it decides. The portal's copy had
 * been written from the program's name: it said the booth goes to a community
 * event and that students hand things to passersby, when it is a table inside
 * the school where students and faculty choose an act of kindness to do. The
 * kit it listed was six digital-sounding things; the real one is eight
 * physical items, and the school brings three of its own.
 *
 * Run it again whenever the marketing page changes. It writes nothing else.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "kindness-booth";

const PAGE = {
  tagline: "Unite your school through acts of kindness.",

  description:
    "A table your school sets up where students and faculty are invited to " +
    "choose from a variety of simple acts of kindness — whichever one speaks " +
    "to them most. JOC provides the booth, the materials and the training; " +
    "your students run it.",

  activitiesTitle: "What people can do at the booth",

  activitiesNote:
    "Periodically a new and unique act of kindness is added, often connected " +
    "to an upcoming yom tov or to the theme of that month.",

  // The kit, in the order the marketing page lists it, with the three
  // non-physical parts after it — they are part of what a school is buying.
  whatsIncluded: [
    "“Spread Kindness” table cover",
    "“Spread Kindness” pop-up banner",
    "Framed acts of kindness cards",
    "Tehillim cards",
    "Kindness note pads",
    "Kindness cards",
    "2 baskets",
    "5 volunteer T-shirts",
    "Volunteers manual",
    "Training video",
    "Ongoing support",
  ],

  schoolProvides: ["A folding table", "A speaker", "Candies"],

  cta: "Register for the Kindness Booth",

  // The booth's own film, not the channel playlist the record was pointing at.
  videoUrl: "https://www.youtube.com/watch?v=fdx9S9YLKls",
};

const ACTIVITIES = [
  {
    title: "Write a note",
    description:
      "A kind note to a fellow student, to a teacher, or to a soldier.",
  },
  {
    title: "Take a candy",
    description:
      "One for yourself, and another to give to someone in school to sweeten their day.",
  },
  {
    title: "Recite a Tehillim",
    description:
      "On behalf of someone — chayalim, a person who is ill — or for all of Am Yisrael.",
  },
  {
    title: "Help someone",
    description:
      "Find an opportunity today to help a fellow student, a teacher, or someone at home.",
  },
];

const program = await prisma.programPage.findUnique({
  where: { slug: SLUG },
  select: { id: true, name: true },
});

if (!program) {
  console.error(`No program with slug "${SLUG}". Nothing written.`);
  process.exit(1);
}

await prisma.programPage.update({ where: { id: program.id }, data: PAGE });

// Replace rather than append, so running this twice does not double the list.
await prisma.programActivity.deleteMany({ where: { programId: program.id } });
await prisma.programActivity.createMany({
  data: ACTIVITIES.map((a, i) => ({ ...a, programId: program.id, order: i })),
});

console.log(`${program.name}: ${ACTIVITIES.length} acts, ${PAGE.whatsIncluded.length} in the kit, ${PAGE.schoolProvides.length} from the school`);

await prisma.$disconnect();
