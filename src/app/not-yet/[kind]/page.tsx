import { notFound } from "next/navigation";
import { NotYoursYet } from "@/components/ui/NotYoursYet";

export const metadata = { title: "Not yet", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The page behind every "Tell me more".
 *
 * One route for all of them, because the answer is the same shape whatever
 * was asked about: here is what it is, here is what you already run, and here
 * is the button that tells us you are interested.
 */
const THINGS: Record<string, { thing: string; label: string; sentence: string }> = {
  lessons: {
    thing: "The lesson library",
    label: "Part of JOC Education",
    sentence:
      "Ready-to-teach chesed lessons for every grade, written around the Chesed Cycle the whole school is on.",
  },
  resources: {
    thing: "The resource library",
    label: "Part of JOC Education",
    sentence: "Source sheets, activities, posters and videos, tagged by grade and by Cycle.",
  },
  cycles: {
    thing: "The Chesed Cycles",
    label: "Part of JOC Education",
    sentence:
      "Eight themes across the year, each with its own guiding question, so the whole school works on one middah at a time.",
  },
  board: {
    thing: "The Teachers' Board",
    label: "Part of JOC Education",
    sentence: "What rebbeim and morahs at other schools actually ran, and how it went.",
  },
  rooms: {
    thing: "The discussion rooms",
    label: "Part of JOC Education",
    sentence: "Where teachers at JOC schools talk to each other about what is working.",
  },
  "joc-app": {
    thing: "The JOC App",
    label: "A JOC program",
    sentence: "Students log the chesed they do, and their teachers approve it.",
  },
  programs: {
    thing: "The other JOC programs",
    label: "A JOC program",
    sentence:
      "Kindness Booth, Bake for Chesed, Just One Tutor and the rest — JOC runs the logistics and your students run the program.",
  },
};

export default async function NotYetPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const t = THINGS[kind];
  if (!t) notFound();

  return <NotYoursYet kind={kind} thing={t.thing} label={t.label} sentence={t.sentence} />;
}
