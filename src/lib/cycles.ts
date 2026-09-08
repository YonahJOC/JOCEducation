// TODO: verify Cycle dates against a luach before launch

export type CycleState = "past" | "current" | "upcoming";

export type Cycle = {
  num: number;
  theme: string;
  gloss: string;
  question: string;
  hebrew: string;
  anchor: string;
  range: string;
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
    hebrew: "Elul", anchor: "Selichos · Rosh Hashanah prep",
    range: "Aug 9 – Sep 12",
    startDate: "2026-08-09", endDate: "2026-09-12", weeks: 5,
    color: "#1E47B8",
    desc: "The year begins facing inward. Before a student gives anything away, Cycle 1 asks them to take an honest account of how they actually treat the people closest to them — at home, in the classroom, at recess. Everything the year builds outward starts from this.",
    focus: [
      "Daily cheshbon hanefesh journal in every classroom",
      "One repaired relationship per student before Rosh Hashanah",
      "Elul middah shiur series: the honest look inward",
    ],
    stats: { value: "318", label: "students journaling", people: "11", peopleLabel: "partner schools" },
    weekPlan: [
      { title: "Name the middah", body: "Opening shiur on what an honest accounting actually is — and why it comes before any chesed." },
      { title: "Start the journal", body: "Every student begins a daily cheshbon: one interaction, honestly recorded, no audience." },
      { title: "Find the hard one", body: "Each student identifies one relationship they have handled badly this year." },
      { title: "Go repair it", body: "Students approach that person before Rosh Hashanah. Teachers coach the conversation, not the outcome." },
      { title: "Close the account", body: "Class siyum reading back what changed, and one kabbalah carried into Tishrei." },
    ],
  },
  {
    num: 2, slug: "hachnasas-orchim",
    theme: "Hachnasas Orchim", gloss: "Opening the door to others",
    question: "Who is standing at the edge of the room?",
    hebrew: "Tishrei", anchor: "Sukkos · Ushpizin",
    range: "Sep 13 – Oct 17",
    startDate: "2026-09-13", endDate: "2026-10-17", weeks: 5,
    color: "#1B7F4B",
    desc: "The first step outward. Having looked honestly at themselves, students open a door — at the sukkah table, at recess, and at the lunch table where the same child sits alone every day.",
    focus: [
      "Sukkah hosting map across partner communities",
      "No-one-eats-alone lunch rotation in every grade",
      "Ushpizin unit: the guest you did not expect",
    ],
    weekPlan: [
      { title: "Who is at the edge?", body: "Students map their own class — who eats alone, who is never invited, who went quiet." },
      { title: "Build the sukkah list", body: "Families register to host; the school matches guests who would otherwise have nowhere." },
      { title: "Ushpizin week", body: "Daily learning on the guest you did not expect, paired with a real invitation." },
      { title: "No one eats alone", body: "Lunch rotation goes live in every grade and runs for the rest of the year." },
      { title: "Hold the door open", body: "Debrief: what made it awkward, and what makes welcoming last past yom tov." },
    ],
  },
  {
    num: 3, slug: "hakaras-hatov",
    theme: "Hakaras Hatov", gloss: "Recognizing who carried us",
    question: "Who has held us up without ever being thanked?",
    hebrew: "Cheshvan", anchor: "The month with no yom tov",
    range: "Oct 18 – Nov 14",
    startDate: "2026-10-18", endDate: "2026-11-14", weeks: 4,
    color: "#2C7AC9",
    desc: "Elul's accounting turned up a list of people who carried us. Cheshvan has no yom tov to hide behind, which makes it the month to go back down that list and say it — to parents, rebbeim, bus drivers, custodians.",
    focus: [
      "Thank-you delivery route to every school staff member",
      "Hakaras hatov letters home, one per student per week",
      "Middah shiur series: seeing the giver behind the gift",
    ],
    weekPlan: [
      { title: "Make the list", body: "Students name everyone who carried them this year — including people they have never thanked." },
      { title: "Say it to staff", body: "Thank-you route through the building: custodians, office, bus drivers, kitchen." },
      { title: "Say it at home", body: "One written hakaras hatov letter home per student, delivered by hand." },
      { title: "Say it out loud", body: "Class assembly where students read what they wrote. Cheshvan closes on gratitude spoken, not felt." },
    ],
  },
  {
    num: 4, slug: "nesinah-bseiser",
    theme: "Nesinah B'seiser", gloss: "Giving with no name attached",
    question: "Would we still give if no one ever found out?",
    hebrew: "Kislev – Teves", anchor: "Chanukah",
    range: "Nov 15 – Dec 19",
    startDate: "2026-11-15", endDate: "2026-12-19", weeks: 5,
    color: "#F7941D",
    desc: "Light given away loses nothing. Through Chanukah, Cycle 4 separates giving from recognition — the gift with no name on it, the help nobody hears about, the matanah that arrives without a sender.",
    focus: [
      "Anonymous giving drive across every grade",
      "Chanukah deliveries to homebound community members",
      "Middah shiur series: the giver who is never named",
    ],
    weekPlan: [
      { title: "Give with no name", body: "Introduce nesinah b'seiser: why the Rambam ranks the anonymous gift so high." },
      { title: "Set up the drive", body: "Grades run a collection where no giver and no recipient is ever identified." },
      { title: "Chanukah deliveries", body: "Packages reach homebound community members. Students do not stay to be thanked." },
      { title: "Resist the credit", body: "The hard week: students practice letting someone else be praised for what they did." },
      { title: "Light and leave", body: "Siyum on what was given that nobody will ever trace back." },
    ],
  },
  {
    num: 5, slug: "shmiras-halashon",
    theme: "Shmiras Halashon", gloss: "Guarding how we speak",
    question: "What does our classroom sound like when no one is watching?",
    hebrew: "Teves – Shevat", anchor: "Tu BiShvat",
    range: "Dec 20 – Jan 23",
    startDate: "2026-12-20", endDate: "2027-01-23", weeks: 5,
    color: "#9B4DCA",
    desc: "Cheshbon hanefesh applied to the mouth. Cycle 5 reframes speech as kindness or harm — the joke at someone's expense, the defense nobody offered, the word that made a child want to come back tomorrow.",
    focus: [
      "Shmiras halashon chavrusa pairs, ten minutes daily",
      "Class kabbalos posted and tracked for the full cycle",
      "Upstander training: what to say when a classmate is mocked",
    ],
    weekPlan: [
      { title: "Hear the room", body: "Students record — privately — what their classroom actually sounds like for a week." },
      { title: "Pair up", body: "Shmiras halashon chavrusas begin: ten minutes daily, same partner all cycle." },
      { title: "Write the kabbalah", body: "Each class agrees one specific, checkable commitment and posts it on the wall." },
      { title: "Be the upstander", body: "Training on what to actually say when a classmate is mocked — scripts, not slogans." },
      { title: "Speak up for someone", body: "Every student defends one person out loud this week. Reported, not graded." },
    ],
  },
  {
    num: 6, slug: "reius",
    theme: "Rei'us", gloss: "Friendship that leaves nobody out",
    question: "Who is never on anyone's list?",
    hebrew: "Adar", anchor: "Purim · Mishloach Manos",
    range: "Jan 24 – Feb 27",
    startDate: "2027-01-24", endDate: "2027-02-27", weeks: 5,
    color: "#F7941D",
    desc: "Mishloach manos is a friendship mitzvah, and Adar is when exclusion shows most clearly. Cycle 6 makes sure every student sends — and, just as deliberately, that every student receives.",
    focus: [
      "Mishloach manos matching so no student is missed",
      "Cross-grade Adar chavrusa pairings",
      "Simcha deliveries to families having a hard year",
    ],
    weekPlan: [
      { title: "Who is off the list?", body: "Anonymous survey: who in this grade would receive nothing if we did nothing?" },
      { title: "Match everyone", body: "Mishloach manos pairings assigned so every student both sends and receives." },
      { title: "Cross the grades", body: "Older and younger students paired for Adar chavrusa learning." },
      { title: "Purim itself", body: "Deliveries go out, including simcha packages to families having a hard year." },
      { title: "Keep the friendship", body: "Debrief: which of these pairings should outlive Purim?" },
    ],
  },
  {
    num: 7, slug: "cheirus-lacheirim",
    theme: "Cheirus L'acheirim", gloss: "The freedom we owe others",
    question: "Who is still not free, and what does that ask of us?",
    hebrew: "Nissan", anchor: "Pesach · Yom HaShoah",
    range: "Feb 28 – Apr 10",
    startDate: "2027-02-28", endDate: "2027-04-10", weeks: 6,
    color: "#1B7F4B", israel: true,
    desc: "We were freed in order to free others. Cycle 7 runs from kol dichfin at the seder — maos chittim, placement for anyone alone — to Yom HaShoah at the month's end, remembering those who were denied every freedom we now take as given.",
    focus: [
      "Maos chittim distribution run by grades",
      "Seder placement for anyone alone",
      "Yom HaShoah: survivor testimony and student candle project",
    ],
    weekPlan: [
      { title: "What is cheirus?", body: "Opening unit on freedom as an obligation to others, not a possession." },
      { title: "Maos chittim", body: "Grade-run collection so no family in the community enters Pesach short." },
      { title: "Kol dichfin, for real", body: "Seder placement: every person identified as alone is matched to a table." },
      { title: "Clean and carry", body: "Pre-Pesach crews sent to homes that cannot manage the work alone." },
      { title: "Yom HaShoah", body: "Survivor testimony, and a student candle project naming those who were denied all of it." },
      { title: "Freedom owed forward", body: "Siyum connecting the seder we sat at to the obligation it left us." },
    ],
  },
  {
    num: 8, slug: "achrayus",
    theme: "Achrayus", gloss: "Responsibility for a people, not just a person",
    question: "What do we owe people we will never meet?",
    hebrew: "Iyar", anchor: "Yom HaZikaron · Yom Ha'atzmaut · Lag BaOmer · Yom Yerushalayim",
    range: "Apr 11 – May 15",
    startDate: "2027-04-11", endDate: "2027-05-15", weeks: 5,
    color: "#1E47B8", israel: true,
    desc: "The high point of the year. Iyar carries Yom HaZikaron, Yom Ha'atzmaut and Yom Yerushalayim back to back, and Cycle 8 widens the circle from the classroom to a whole people — including those who gave everything so it would exist.",
    focus: [
      "Yom HaZikaron letters to bereaved families in Israel",
      "Twinned classroom partnership with an Israeli school, running all cycle",
      "Yom Ha'atzmaut chesed day and Yom Yerushalayim siyum",
    ],
    weekPlan: [
      { title: "Widen the circle", body: "From classroom to klal: what areivus means when the person is a stranger." },
      { title: "Yom HaZikaron", body: "Students write to bereaved families in Israel. Letters are translated and sent, not filed." },
      { title: "Yom Ha'atzmaut", body: "Chesed day run jointly with the twinned Israeli classroom." },
      { title: "Lag BaOmer", body: "Cross-grade achdus program — the middah practiced on the people hardest to include." },
      { title: "Yom Yerushalayim", body: "Cycle siyum tying the month together: what we owe people we will never meet." },
    ],
  },
  {
    num: 9, slug: "anavah",
    theme: "Anavah", gloss: "Making room by taking up less",
    question: "Whose turn have we been taking?",
    hebrew: "Sivan", anchor: "Shavuos · Kabbalas HaTorah",
    range: "May 16 – Jun 12",
    startDate: "2027-05-16", endDate: "2027-06-12", weeks: 4,
    color: "#2C7AC9",
    desc: "Har Sinai was chosen for being the lowest mountain. Cycle 9 is about the chesed that only happens when a student steps back — letting someone else answer, lead, or be seen first.",
    focus: [
      "Step-back practice: give away one turn a day",
      "Shavuos night learning paired with a chesed commitment",
      "Peer-led shiurim where students hand over the floor",
    ],
    weekPlan: [
      { title: "Take up less", body: "Introduce anavah through Har Sinai — chosen for being the lowest." },
      { title: "Give away a turn", body: "Daily practice: hand one opportunity to answer, lead, or go first to someone else." },
      { title: "Students lead", body: "Peer-led shiurim. The strongest students hand over the floor and stay quiet." },
      { title: "Shavuos night", body: "Learning paired with one chesed commitment made without announcing it." },
    ],
  },
  {
    num: 10, slug: "ahavas-yisroel",
    theme: "Ahavas Yisroel", gloss: "Loving another as our own",
    question: "What have we built that should outlast our name on it?",
    hebrew: "Tammuz – Av", anchor: "The Three Weeks · Tishah B'Av · Tu B'Av",
    range: "Jun 13 – Jul 24",
    startDate: "2027-06-13", endDate: "2027-07-24", weeks: 6,
    color: "#10233F",
    desc: "The weeks that mourn sinas chinam are the weeks to answer it. Cycle 10 closes the year by handing every chesed to the grade behind — standing commitments nobody takes credit for.",
    focus: [
      "Teen chesed leadership cohort",
      "Grade captain handoffs for next year",
      "Year-end siyum and Elul planning for 5788",
    ],
    weekPlan: [
      { title: "Name the sinah", body: "The Three Weeks open with an honest look at where division actually lives in this school." },
      { title: "Repair one thing", body: "Each student addresses one relationship they let fray over the year." },
      { title: "Tishah B'Av", body: "Learning and a community chesed project run on the day itself." },
      { title: "Build the cohort", body: "Next year's teen chesed leaders selected and trained by this year's." },
      { title: "Hand it over", body: "Grade captains formally pass their programs to the grade behind them." },
      { title: "Year-end siyum", body: "The whole year read back, and Elul planning for 5788 begins." },
    ],
  },
];
