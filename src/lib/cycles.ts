// Chesed Cycles — 5787 (2026–27). Eight consecutive cycles, school opening → Shavuos.
// Dates are Sunday–Shabbos weeks mapped from the Hebrew anchors below.
// TODO: verify every start/end date against a 5787 luach before launch;
//       confirm whether cycles pause for yom tov weeks or run straight through.

export type CycleState = "past" | "current" | "upcoming";

export type Cycle = {
  num: number;
  theme: string;
  gloss: string;
  question: string;
  hebrew: string;   // month label(s) shown on chips and cards
  anchor: string;   // calendar hook(s) the cycle is pinned to
  range: string;    // human-readable secular range
  startDate: string; // ISO
  endDate: string;   // ISO
  weeks: number;
  color: string;
  slug: string;
  israel?: boolean;
  desc: string;
  focus: string[];
  weekPlan: { title: string; body: string }[];
  stats?: { value: string; label: string; people: string; peopleLabel: string };
};

export function getCycleState(cycle: Cycle): CycleState {
  const now = new Date();
  const start = new Date(cycle.startDate);
  const end = new Date(cycle.endDate);
  end.setHours(23, 59, 59, 999);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "current";
}

export function getCurrentWeek(cycle: Cycle): number {
  const state = getCycleState(cycle);
  if (state === "past") return cycle.weeks;
  if (state === "upcoming") return 0;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(cycle.startDate).getTime();
  return Math.min(Math.max(1, Math.ceil(elapsed / msPerWeek)), cycle.weeks);
}

export function getCycleBySlug(slug: string): Cycle | undefined {
  return CYCLES.find((c) => c.slug === slug);
}

export function getCurrentCycle(): Cycle {
  return CYCLES.find((c) => getCycleState(c) === "current") ?? CYCLES[0];
}

export const CYCLES: Cycle[] = [
  {
    num: 1, slug: "cheshbon-hanefesh",
    theme: "Cheshbon Hanefesh", gloss: "An honest accounting of ourselves",
    question: "Who am I when nobody is keeping score?",
    hebrew: "Elul – Tishrei", anchor: "School opening → Yom Kippur",
    range: "Aug 30 – Sep 26",
    startDate: "2026-08-30", endDate: "2026-09-26", weeks: 4,
    color: "#2D46AF",
    desc: "The year begins facing inward. Before a student gives anything away, Cycle 1 asks them to take an honest account of how they actually treat the people closest to them — at home, in the classroom, at recess — and to carry that accounting through the Yamim Noraim. Everything the year builds outward starts here.",
    focus: [
      "Daily cheshbon hanefesh journal in every classroom",
      "One repaired relationship per student before Yom Kippur",
      "Elul middah shiur series: the honest look inward",
    ],
    weekPlan: [
      { title: "Name the middah", body: "Opening shiur on what an honest accounting actually is — and why it comes before any chesed." },
      { title: "Start the journal", body: "Every student begins a daily cheshbon: one interaction, honestly recorded, no audience." },
      { title: "Find the hard one", body: "Each student identifies one relationship they have handled badly, and approaches that person before Rosh Hashanah. Teachers coach the conversation, not the outcome." },
      { title: "Close the account", body: "Through the Aseres Yemei Teshuvah: class siyum reading back what changed, and one kabbalah carried past Yom Kippur." },
    ],
  },
  {
    num: 2, slug: "hachnasat-orchim",
    theme: "Hachnasat Orchim", gloss: "Opening the door to others",
    question: "Who is standing at the edge of the room?",
    hebrew: "Tishrei – Cheshvan", anchor: "Sukkos → early Cheshvan",
    range: "Sep 27 – Oct 24",
    startDate: "2026-09-27", endDate: "2026-10-24", weeks: 4,
    color: "#FA912D",
    desc: "The first step outward. Having looked honestly at themselves, students open a door — at the sukkah table, at recess, and at the lunch table where the same child sits alone every day. The cycle runs past Simchas Torah into Cheshvan so that welcoming outlasts yom tov.",
    focus: [
      "Sukkah hosting map across partner communities",
      "No-one-eats-alone lunch rotation in every grade",
      "Ushpizin unit: the guest you did not expect",
    ],
    weekPlan: [
      { title: "Who is at the edge?", body: "Sukkos week. Students map their own class — who eats alone, who is never invited, who went quiet — while families host through the sukkah list." },
      { title: "Ushpizin week", body: "Daily learning on the guest you did not expect, paired with a real invitation." },
      { title: "No one eats alone", body: "Lunch rotation goes live in every grade and runs for the rest of the year." },
      { title: "Hold the door open", body: "Debrief in Cheshvan: what made it awkward, and what makes welcoming last past yom tov." },
    ],
  },
  {
    num: 3, slug: "shmirat-halashon",
    theme: "Shmirat Halashon", gloss: "Guarding how we speak",
    question: "What does our classroom sound like when no one is watching?",
    hebrew: "Cheshvan – Kislev", anchor: "Cheshvan → Kislev",
    range: "Oct 25 – Nov 28",
    startDate: "2026-10-25", endDate: "2026-11-28", weeks: 5,
    color: "#9B4DCA",
    desc: "Cheshbon hanefesh applied to the mouth. Cheshvan has no yom tov to hide behind, which makes it the month to listen to the room. Cycle 3 reframes speech as kindness or harm — the joke at someone's expense, the defense nobody offered, the word that made a child want to come back tomorrow.",
    focus: [
      "Shmirat halashon chavrusa pairs, ten minutes daily",
      "Class kabbalos posted and tracked for the full cycle",
      "Upstander training: what to say when a classmate is mocked",
    ],
    weekPlan: [
      { title: "Hear the room", body: "Students record — privately — what their classroom actually sounds like for a week." },
      { title: "Pair up", body: "Shmirat halashon chavrusas begin: ten minutes daily, same partner all cycle." },
      { title: "Write the kabbalah", body: "Each class agrees one specific, checkable commitment and posts it on the wall." },
      { title: "Be the upstander", body: "Training on what to actually say when a classmate is mocked — scripts, not slogans." },
      { title: "Speak up for someone", body: "Every student defends one person out loud this week. Reported, not graded." },
    ],
  },
  {
    num: 4, slug: "hakarat-hatov",
    theme: "Hakarat Hatov", gloss: "Recognizing who carried us",
    question: "Who has held us up without ever being thanked?",
    hebrew: "Kislev – Tevet", anchor: "Chanukah → Tevet",
    range: "Nov 29 – Jan 9",
    startDate: "2026-11-29", endDate: "2027-01-09", weeks: 6,
    color: "#2C7AC9",
    desc: "Chanukah is eight nights of saying thank you — l'hodos u'l'hallel. Cycle 4 takes that outward: to parents, rebbeim, bus drivers, custodians, and the people whose help nobody hears about. It runs through the quiet of Tevet so gratitude becomes a habit, not a holiday.",
    focus: [
      "Thank-you delivery route to every school staff member",
      "Eight nights, eight thank-yous: a Chanukah hakarat hatov challenge for every family",
      "Hakarat hatov letters home, one per student per week",
    ],
    weekPlan: [
      { title: "Make the list", body: "Students name everyone who carried them this year — including people they have never thanked." },
      { title: "Eight nights, eight thank-yous", body: "Chanukah week. Each night, one person thanked in person or in writing. Families log it together." },
      { title: "Say it to staff", body: "Thank-you route through the building: custodians, office, bus drivers, kitchen." },
      { title: "Say it at home", body: "One written hakarat hatov letter home per student, delivered by hand." },
      { title: "Say it out loud", body: "Class assembly where students read what they wrote. Gratitude spoken, not felt." },
      { title: "Carry it into Tevet", body: "Around Asara B'Tevet: siyum on what changed when thanks became routine, and one standing habit per class." },
    ],
  },
  {
    num: 5, slug: "kavod",
    theme: "Kavod", gloss: "Honoring the dignity in every person",
    question: "Who have we stopped treating as worthy of our respect?",
    hebrew: "Shevat", anchor: "Shevat / Tu B'Shevat",
    range: "Jan 10 – Feb 13",
    startDate: "2027-01-10", endDate: "2027-02-13", weeks: 5,
    color: "#1B7F4B",
    desc: "A tree is judged by its fruit, and a person by how they treat the people they don't have to be kind to. Cycle 5 is kavod habriyos in practice: honoring parents, teachers, the staff who keep the building running, and the classmate who is easiest to overlook — anchored by Tu B'Shevat and kavod for the world we were handed.",
    focus: [
      "Kavod chart: honoring the adults in the building nobody thanks",
      "Tu B'Shevat planting and care project tied to kavod for creation",
      "Peer-respect kabbalah: one class-wide commitment, tracked all cycle",
    ],
    weekPlan: [
      { title: "What is kavod?", body: "Opening shiur: kavod as seeing the tzelem Elokim in someone — including someone you dislike." },
      { title: "Kavod at home", body: "Kibbud av va'em made concrete: one daily act of honor toward a parent, chosen by the student." },
      { title: "Kavod in the building", body: "Students learn the names and stories of every staff member, and greet each by name for the rest of the year." },
      { title: "Tu B'Shevat: kavod for what grows", body: "Planting and care project; learning on the tree that is judged by its fruit." },
      { title: "Kavod for each other", body: "Class-wide peer-respect kabbalah, posted and reviewed. Siyum on who we started seeing differently." },
    ],
  },
  {
    num: 6, slug: "marbim-bsimcha",
    theme: "Marbim B'simcha", gloss: "Bringing joy to others",
    question: "Whose simcha depends on us?",
    hebrew: "Adar", anchor: "Adar / Purim",
    range: "Feb 14 – Mar 27",
    startDate: "2027-02-14", endDate: "2027-03-27", weeks: 6,
    color: "#FA912D",
    desc: "Mishenichnas Adar marbim b'simcha — and this year there are two Adars to do it in. Cycle 6 treats joy as a chesed: the mishloach manos that reaches the student nobody remembers, the matanos l'evyonim that arrive without a name, the visit that makes someone's Purim. Every student sends, and every student receives.",
    focus: [
      "Mishloach manos matching so no student is missed",
      "Matanos l'evyonim drive run by grades",
      "Simcha visits to seniors and hospital patients through Adar",
    ],
    weekPlan: [
      { title: "Joy as a mitzvah", body: "Opening unit on simcha as something we owe others, not something we wait to feel." },
      { title: "Who is off the list?", body: "Anonymous survey: who in this grade would receive nothing if we did nothing?" },
      { title: "Match everyone", body: "Mishloach manos pairings assigned so every student both sends and receives." },
      { title: "Matanos l'evyonim", body: "Grade-run collection; students learn why the Rambam says this comes before the seudah." },
      { title: "Purim itself", body: "Deliveries go out, including simcha packages to families having a hard year, and visits to seniors." },
      { title: "Keep the simcha going", body: "Debrief: which of these pairings and visits should outlive Purim?" },
    ],
  },
  {
    num: 7, slug: "ahavat-yisrael",
    theme: "Ahavat Yisrael", gloss: "Loving every Jew as our own",
    question: "Who is still missing from our table?",
    hebrew: "Nisan", anchor: "Nisan / Pesach → Yom HaShoah",
    range: "Mar 28 – May 8",
    startDate: "2027-03-28", endDate: "2027-05-08", weeks: 6,
    color: "#2D46AF", israel: true,
    desc: "Kol dichfin yeisei v'yeichol — whoever is hungry, come and eat. Cycle 7 runs from maos chittim and seder placement for anyone alone, through Pesach itself, to Yom HaShoah at the month's end, remembering those who were denied every freedom we now take as given. One people, one table.",
    focus: [
      "Maos chittim distribution run by grades",
      "Seder placement for anyone alone",
      "Yom HaShoah: survivor testimony and student candle project",
    ],
    weekPlan: [
      { title: "One people, one table", body: "Opening unit on ahavat Yisrael as an obligation to Jews we will never meet, not just the ones we like." },
      { title: "Maos chittim", body: "Grade-run collection so no family in the community enters Pesach short." },
      { title: "Kol dichfin, for real", body: "Seder placement: every person identified as alone is matched to a table." },
      { title: "Clean and carry", body: "Pre-Pesach crews sent to homes that cannot manage the work alone." },
      { title: "Pesach", body: "Yom tov week. Students carry one question to their own seder: who at this table did I bring, and who is not here?" },
      { title: "Yom HaShoah", body: "Survivor testimony, and a student candle project naming those who were denied all of it." },
    ],
  },
  {
    num: 8, slug: "achrayut",
    theme: "Achrayut", gloss: "Responsibility for a people, not just a person",
    question: "What do we owe people we will never meet?",
    hebrew: "Iyar – Sivan", anchor: "Yom HaZikaron · Yom Ha'atzmaut · Yom Yerushalayim → Shavuos",
    range: "May 9 – Jun 12",
    startDate: "2027-05-09", endDate: "2027-06-12", weeks: 5,
    color: "#10233F", israel: true,
    desc: "The year closes at its widest. Iyar carries Yom HaZikaron, Yom Ha'atzmaut and Yom Yerushalayim back to back, and Cycle 8 widens the circle from the classroom to a whole people — including those who gave everything so it would exist — before handing every chesed to the grade behind at Shavuos.",
    focus: [
      "Yom HaZikaron letters to bereaved families in Israel",
      "Twinned classroom partnership with an Israeli school, running all cycle",
      "Grade captain handoffs and year-end siyum before Shavuos",
    ],
    weekPlan: [
      { title: "Widen the circle", body: "From classroom to klal: what areivus means when the person is a stranger. Yom HaZikaron letters to bereaved families are written, translated and sent — not filed. Yom Ha'atzmaut chesed day with the twinned classroom." },
      { title: "Build the cohort", body: "Next year's chesed leaders selected and trained by this year's." },
      { title: "Lag BaOmer", body: "Cross-grade achdus program — the middah practiced on the people hardest to include." },
      { title: "Yom Yerushalayim", body: "Learning and a community chesed project tying the month together." },
      { title: "Shavuos: hand it over", body: "Grade captains formally pass their programs to the grade behind them. The whole year read back; Elul planning for 5788 begins." },
    ],
  },
];
