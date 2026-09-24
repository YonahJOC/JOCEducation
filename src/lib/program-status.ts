/**
 * The one mono line under a program's name on a card (2a).
 *
 * Every card used to carry the same sentence — "1 IN · 38 NOT YET · NEXT WED,
 * NOV 4" — so a grid of eight said one thing eight times and the differences
 * between the programs were invisible. In 2a no two lines are alike: the app
 * says how many schools are matched to it, a trip says when it flies, a
 * one-time event says how many are booked. Each kind is asked the question
 * that is actually about it.
 *
 * It goes orange when the figure is the problem — "1 OF 37 SCHOOLS MATCHED TO
 * THE APP" is not a neutral fact.
 */

export type ProgramFigures = {
  tag: string;
  slug: string;
  /** Schools recorded as in this program. */
  inCount: number;
  /** Every school on the system, for the ones that measure reach. */
  schoolCount: number;
  /** Upcoming runs on the calendar. */
  booked: number;
  nextRun: Date | null;
  /** Schools matched to the JOC App. Only the app asks. */
  onTheApp: number;
};

export type ProgramStatus = { text: string; warn: boolean };

const DATE = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();

export function programStatus(f: ProgramFigures): ProgramStatus {
  const next = f.nextRun ? `NEXT ${DATE(f.nextRun)}` : null;

  // The app's question is how much of the school list it has actually
  // reached, which nothing else on the page answers.
  if (f.slug === "joc-app") {
    return {
      text: `${f.onTheApp} OF ${f.schoolCount} SCHOOLS MATCHED TO THE APP`,
      warn: f.onTheApp < f.schoolCount,
    };
  }

  switch (f.tag) {
    case "Trip":
      return f.nextRun
        ? { text: `${f.inCount} GROUP · FLIES ${DATE(f.nextRun)}`, warn: false }
        : { text: `${f.inCount} GROUP · NO DATE SET`, warn: true };

    case "One-time":
      return f.booked > 0
        ? { text: `${f.booked} BOOKED · ${next}`, warn: false }
        : { text: "NOTHING BOOKED", warn: true };

    case "Event":
      return f.booked > 0
        ? { text: `${f.inCount} IN · ${f.booked} BOOKED · ${next}`, warn: false }
        : { text: `${f.inCount} IN · NOTHING BOOKED`, warn: true };

    case "Ongoing":
      return next
        ? { text: `${f.inCount} IN · ${next}`, warn: false }
        : { text: `${f.inCount} IN · NOTHING ON THE CALENDAR`, warn: true };

    // Platform, and anything a tag is added for later.
    default:
      return f.inCount > 0
        ? { text: `${f.inCount} OF ${f.schoolCount} SCHOOLS`, warn: false }
        : { text: `NO SCHOOL IS ON IT YET`, warn: true };
  }
}
