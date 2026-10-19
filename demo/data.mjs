// The model school, and everything the demo shows about it.
//
// Beth Jacob Academy does not exist. Every name, number and message below was
// written for this demo. The Chesed Cycles are the only thing here that is
// real — those are JOC's own eight, pulled from src/lib/cycles.ts — because
// the Cycle is the idea the whole portal is built around, and inventing it
// would have meant demonstrating something we do not actually teach.

export const SCHOOL = {
  name: "Beth Jacob Academy",
  place: "Teaneck, NJ",
  students: 412,
  plan: "Full year",
  seats: 120,
  since: "September 2026",
  contact: { name: "Mrs. Shira Feldman", role: "Head of Chesed", initial: "S" },
  principal: "Rabbi D. Weiss",
};

/** What the school sees on its own page. */
export const SCHOOL_PROGRAMS = [
  { name: "Kindness Booth", when: "Thu 12 Nov · 2:00–4:00 PM", where: "Machane Yehuda Shuk", group: "11th Grade", status: "Booked" },
  { name: "Build A Bed", when: "Sun 15 Nov · 9:30 AM", where: "Lieberman Family", group: "Gap year", status: "Booked" },
  { name: "Bake for Chesed", when: "Awaiting a date", where: "School kitchen", group: "9th & 10th", status: "Asked for" },
  { name: "Chesed Match", when: "Running all year", where: "In school", group: "Whole school", status: "Running" },
];

export const SCHOOL_TEACHERS = [
  { name: "Mrs. Shira Feldman", role: "Head of Chesed", initial: "S" },
  { name: "Rabbi Y. Brodsky", role: "11th Grade", initial: "Y" },
  { name: "Mrs. T. Gold", role: "9th Grade", initial: "T" },
  { name: "Mr. A. Lebowitz", role: "Gap year programme", initial: "A" },
];

/** A lesson as a teacher opens it. Written for the demo, tied to a real Cycle. */
export const LESSON = {
  title: "The people who hold the door",
  theme: "Hakarat Hatov",
  cycle: "Cycle 4 · Week 2",
  grade: "9–12",
  minutes: 45,
  prep: "Almost none",
  description:
    "Students spend a week noticing the people in the building whose work is never announced — the custodian, the bus driver, the kitchen staff, the secretary who finds the lost coat. The lesson ends with each student writing one letter, by hand, to one of them.",
  objectives: [
    "Name three people whose work in the building usually goes unseen",
    "Explain why hakarat hatov is an obligation rather than a courtesy",
    "Write a thank-you that names something specific, not something general",
  ],
  materials: ["Letter paper, one sheet per student", "Envelopes", "The building's staff list (ask the office)"],
  steps: [
    { title: "The count", minutes: 5, detail: "Ask: how many adults work in this building? Write the guesses on the board, then read the real number from the staff list. It is always higher than the guesses." },
    { title: "Who did we miss?", minutes: 15, detail: "In pairs, students list every adult they can name. Then read the staff list aloud. The gap between the two is the lesson." },
    { title: "Specific, not general", minutes: 10, detail: "Read two thank-you letters — one vague, one specific. Ask which one the reader would keep." },
    { title: "Write one", minutes: 15, detail: "Each student writes one letter to one person on the list. Collect them. Deliver them by hand, not by pigeonhole." },
  ],
  discussion: [
    "Is thanking someone for doing their job still hakarat hatov?",
    "Who thanked you this week? Who did you thank?",
    "Why does a handwritten letter land differently from a message?",
  ],
};

/** The hallway screen in the school's own entrance. */
export const SCHOOL_SCREEN = {
  dedication: "The chesed programme at Beth Jacob Academy is dedicated in memory of Chaya bas Avraham a’’h",
  today: [
    { time: "2:00 PM", title: "Kindness Booth", group: "11th Grade", where: "Machane Yehuda Shuk", venue: "shuk" },
  ],
  coming: [
    { day: "SUN", date: "15", title: "Build A Bed", meta: "GAP YEAR · 9:30 AM", venue: "center" },
    { day: "TUE", date: "17", title: "Chesed Match pairing", meta: "WHOLE SCHOOL · IN SCHOOL", venue: "other" },
    { day: "THU", date: "19", title: "Bake for Chesed", meta: "9TH & 10TH · SCHOOL KITCHEN", venue: "other" },
  ],
  counters: [
    { label: "Letters written", value: "412" },
    { label: "Beds built", value: "36" },
    { label: "Meals packed", value: "1,240" },
  ],
};

/** A JOC staff member's desk. */
export const DESK = {
  who: "Dalia",
  role: "Program coordinator",
  greeting: "Good morning",
  date: "THURSDAY 12 NOVEMBER · 22 CHESHVAN",
  recap: "Two things for today, one waiting on Gilad. Shira at Beth Jacob is waiting on you.",
  todayAtJoc: { title: "Kindness Booth", group: "Beth Jacob, 11th Grade", meta: "THE SHUK · 2:00–4:00 PM · +2 MORE" },
  tasks: [
    { text: "Confirm the 13 Nov booth with Beth Jacob", meta: "FROM THE BUZZ · BETH JACOB ACADEMY" },
    { text: "Send the Kindness Booth kit list to Ramaz", meta: "FOR ME · BY MONDAY" },
  ],
  handed: [{ text: "Can you speak to Gilad about the Bake for Chesed date?", who: "Gilad", status: "SEEN", initial: "G" }],
  later: 1,
  week: [
    { day: "TODAY", date: "12", title: "Kindness Booth · Beth Jacob", meta: "THE SHUK · 2:00 PM", kind: "event", today: true },
    { day: "FRI", date: "13", title: "Call Mrs. Feldman", meta: "10:00 AM", kind: "call" },
    { day: "SUN", date: "15", title: "Build A Bed · Lieberman", meta: "9:30 AM", kind: "event" },
    { day: "MON", date: "16", title: "Admin meeting", meta: "9:30 AM · THE OFFICE", kind: "meeting" },
  ],
  forYou: [
    { who: "Mrs. Shira Feldman", verb: "wrote in", quote: "Could we move the Bake for Chesed to the week after? Our kitchen is being refitted.", source: "BETH JACOB ACADEMY · 2 DAYS AGO", reply: true },
  ],
  scratchpad: "Beth Jacob — ask about 10th grade joining the booth.\nRamaz kit list: 40 aprons, 12 tables.\nCheck whether Chanukah week clashes with the Teaneck trip.",
};

/** The Office: the school-by-school feed. */
export const OFFICE = [
  {
    school: "Beth Jacob Academy", ago: "YESTERDAY", kind: "MEETING", program: "Kindness Booth", by: "Dalia",
    body: "Met Shira and Rabbi Brodsky. They want the booth to run twice this cycle, not once — the 11th grade filled it in under a day. Asked about adding the 10th grade. Said we'd confirm numbers by Friday.",
    likes: 2, comments: 1,
  },
  {
    school: "Ramaz Upper School", ago: "2 DAYS", kind: "EMAIL", program: "Bake for Chesed", by: "Gilad",
    body: "Alyssa sent the student list — 38 names. Asked whether we can run two sessions instead of one.",
    likes: 1, comments: 0,
  },
  {
    school: "HAFTR High School", ago: "4 DAYS", kind: "PHONE CALL", program: "Build A Bed", by: "Yudi",
    body: "Spoke to the office. They're in for the spring but want the dates before January so it goes in the school calendar.",
    likes: 0, comments: 2,
  },
];

/** The schools board — the Monday replacement. */
export const BOARD = [
  { school: "Beth Jacob Academy", place: "Teaneck, NJ", status: "Active", plan: "Full year", seats: 120, contact: "Shira Feldman", last: "yesterday" },
  { school: "Ramaz Upper School", place: "New York, NY", status: "Active", plan: "Program only", seats: null, contact: "Alyssa Stern", last: "2 days ago" },
  { school: "HAFTR High School", place: "Lawrence, NY", status: "Contacted", plan: null, seats: null, contact: "Front office", last: "4 days ago" },
  { school: "Maayanot", place: "Teaneck, NJ", status: "Active", plan: "Full year", seats: 90, contact: "Rivka Adler", last: "1 week ago" },
  { school: "DRS Yeshiva High School", place: "Woodmere, NY", status: "Lead", plan: null, seats: null, contact: null, last: "3 weeks ago" },
  { school: "Ida Crown Jewish Academy", place: "Chicago, IL", status: "Contacted", plan: null, seats: null, contact: "Mrs. Perl", last: "1 month ago" },
];

/** The sign-up form a school fills in. */
export const FORM = {
  program: "Kindness Booth",
  blurb: "A stall your students run in a public place, giving away something small and useful to whoever walks past. We bring the stock, the tables and a JOC runner; the school brings the students.",
  fields: [
    { label: "School", type: "text", value: "Beth Jacob Academy" },
    { label: "Who is coming", type: "text", value: "11th Grade — 32 students" },
    { label: "Preferred date", type: "date", value: "2026-11-12" },
    { label: "Where", type: "select", value: "Machane Yehuda Shuk" },
    { label: "Teacher coming with them", type: "text", value: "Rabbi Y. Brodsky" },
    { label: "Anything we should know", type: "textarea", value: "Two students need step-free access." },
  ],
  fee: "No charge — included in the full-year plan",
};
