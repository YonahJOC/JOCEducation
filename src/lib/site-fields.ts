import type { FieldType } from "@/lib/site-content";

/**
 * The registry of everything on the public site that the Education Team can
 * edit. This is the single source of truth for the /admin/site editor: the
 * pages list, the section grouping and the field order all derive from it.
 *
 * Each entry carries the value currently hardcoded in the component, which
 * serves two purposes — it seeds the database on first run, and it is the
 * fallback the page renders if the field was never edited.
 *
 * Adding a field here and reading it through `siteContent()` in the component
 * is all that is needed to make a new piece of the site editable.
 */

export type FieldDef = {
  page: string;
  pageLabel: string;
  section: string;
  sectionLabel: string;
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  /** What the site says today — seeds the row and acts as the fallback. */
  value: string;
};

const j = (v: unknown) => JSON.stringify(v);

export const SITE_FIELDS: FieldDef[] = [
  // ─── Landing page ─────────────────────────────────────────────────────────
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "notice", sectionLabel: "Wayfinding bar",
    key: "text", label: "Notice text", type: "SHORT_TEXT",
    help: "Shown above the header, for visitors who wanted the main JOC site.",
    value: "This is the JOC Educators Portal. Looking for the main site?",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "notice", sectionLabel: "Wayfinding bar",
    key: "link_label", label: "Link text", type: "SHORT_TEXT",
    value: "Go to JustOneChesed.org →",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "notice", sectionLabel: "Wayfinding bar",
    key: "link_url", label: "Link address", type: "URL",
    value: "https://justonechesed.org",
  },

  {
    page: "landing", pageLabel: "Educator landing page",
    section: "hero", sectionLabel: "Hero",
    key: "headline_1", label: "Headline, first line", type: "SHORT_TEXT",
    help: "Shown in ink.",
    value: "Educating Towards Chesed",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "hero", sectionLabel: "Hero",
    key: "headline_2", label: "Headline, second line", type: "SHORT_TEXT",
    help: "Shown in brand blue.",
    value: "Just One Student at a Time",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "hero", sectionLabel: "Hero",
    key: "intro", label: "Introduction", type: "LONG_TEXT",
    value:
      "Lesson plans, classroom resources and chesed programs for Jewish day schools and yeshivos — organised around the Chesed Cycle, so the whole school is working on one middah at a time.",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "hero", sectionLabel: "Hero",
    key: "development_note", label: "In-development note", type: "LONG_TEXT",
    help: "Remove this once the platform opens to schools.",
    value:
      "The teaching platform is still being built and accounts are not open to schools yet. In the meantime, JOC runs 10 chesed programs your school can start this year —",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "cycle_band", sectionLabel: "Chesed Cycle band",
    key: "explainer", label: "What the Cycles are", type: "LONG_TEXT",
    value:
      "The JOC year runs as consecutive Cycles, from the first week of school through Shavuos. Each one takes a single middah and one guiding question, and every lesson, program and resource for those weeks points at it. The whole school is working on the same thing at the same time.",
  },

  {
    page: "landing", pageLabel: "Educator landing page",
    section: "inside", sectionLabel: "What's inside",
    key: "eyebrow", label: "Eyebrow", type: "SHORT_TEXT",
    value: "What's inside",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "inside", sectionLabel: "What's inside",
    key: "heading", label: "Heading", type: "SHORT_TEXT",
    value: "Everything your school needs, in one place.",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "inside", sectionLabel: "What's inside",
    key: "cards", label: "Cards", type: "REPEATABLE",
    help: "Four cards. Title is the figure, body is the description.",
    value: j([
      { value: "9", title: "Lesson plans", body: "Objectives, timed steps and discussion questions. Print and teach." },
      { value: "5", title: "Resource library", body: "Source sheets, activities, posters and videos, tagged by grade." },
      { value: "10", title: "Programs for your school", body: "Kindness Booth, Bake for Chesed, Just One Tutor and more — JOC runs the logistics." },
      { value: "∞", title: "Teachers' Board", body: "What rebbeim and morahs at other schools actually ran, and how it went." },
    ]),
  },

  {
    page: "landing", pageLabel: "Educator landing page",
    section: "demo", sectionLabel: "Book a walkthrough",
    key: "eyebrow", label: "Eyebrow", type: "SHORT_TEXT",
    value: "Book a walkthrough",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "demo", sectionLabel: "Book a walkthrough",
    key: "heading", label: "Heading", type: "SHORT_TEXT",
    value: "Start a chesed program this year.",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "demo", sectionLabel: "Book a walkthrough",
    key: "intro", label: "Introduction", type: "LONG_TEXT",
    value: "Twenty minutes with someone from Just One Chesed — not a sales pitch, and not a slide deck.",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "demo", sectionLabel: "Book a walkthrough",
    key: "bullets", label: "What happens on the call", type: "REPEATABLE",
    value: j([
      { body: "We go through the programs — Kindness Booth, Bake for Chesed, Just One Tutor and the rest — and which ones suit your grades." },
      { body: "You tell us how your year is already structured, and we say honestly which programs fit around it." },
      { body: "We cover what running one costs, including the scholarship route if the budget is tight." },
      { body: "We show you where the teaching platform is up to, so you know what is coming and when." },
    ]),
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "demo", sectionLabel: "Book a walkthrough",
    key: "quote", label: "Pull quote", type: "LONG_TEXT",
    help: "Set in Newsreader italic. Replace with a real educator quote once one is on file, with permission.",
    value:
      "Chesed stops being an assembly once the whole school is working on the same middah in the same weeks.",
  },
  {
    page: "landing", pageLabel: "Educator landing page",
    section: "demo", sectionLabel: "Book a walkthrough",
    key: "email", label: "Contact email", type: "EMAIL",
    value: "education@justonechesed.org",
  },

  {
    page: "landing", pageLabel: "Educator landing page",
    section: "auth", sectionLabel: "Sign-in card",
    key: "footnote", label: "Footnote under the form", type: "LONG_TEXT",
    value: "Sign in with your school email address to be matched to your school. Not a partner yet?",
  },

  {
    page: "landing", pageLabel: "Educator landing page",
    section: "footer", sectionLabel: "Footer",
    key: "org_line", label: "Organisation line", type: "SHORT_TEXT",
    value: "A 501(c)(3) nonprofit organization",
  },

  // ─── About ────────────────────────────────────────────────────────────────
  // The people, history and figures here were placeholder text written to fill
  // the page. They are seeded empty on purpose: each section only appears once
  // someone enters something true.
  {
    page: "about", pageLabel: "About page",
    section: "hero", sectionLabel: "Hero",
    key: "headline", label: "Headline", type: "SHORT_TEXT",
    value: "Chesed is a skill. We teach it.",
  },
  {
    page: "about", pageLabel: "About page",
    section: "hero", sectionLabel: "Hero",
    key: "standfirst", label: "Introduction", type: "LONG_TEXT",
    value: "JOC Education is the school-facing arm of JustOneChesed — bringing curriculum, programs, and resources to Jewish schools worldwide.",
  },
  {
    page: "about", pageLabel: "About page",
    section: "mission", sectionLabel: "Mission",
    key: "heading", label: "Heading", type: "SHORT_TEXT",
    value: "Just One Student at a Time.",
  },
  {
    page: "about", pageLabel: "About page",
    section: "mission", sectionLabel: "Mission",
    key: "body", label: "Mission text", type: "LONG_TEXT",
    help: "One paragraph per line.",
    value:
      "JustOneChesed was founded on a simple premise: the most meaningful acts of chesed happen between one person and one other person — not as programs, but as choices.\n" +
      "JOC Education brings that conviction into the classroom. We build lesson plans, resources, and programs that help teachers teach chesed as a skill — something that can be practiced, improved, and carried out of school and into a student's life.",
  },
  {
    page: "about", pageLabel: "About page",
    section: "mission", sectionLabel: "Mission",
    key: "stats", label: "Figures", type: "REPEATABLE",
    help:
      "Each figure: value is the number (\"900+\"), title is the label (\"Schools served\"), " +
      "body is the line underneath. Empty until someone can stand behind the numbers.",
    value: j([]),
  },
  {
    page: "about", pageLabel: "About page",
    section: "history", sectionLabel: "History",
    key: "items", label: "Milestones", type: "REPEATABLE",
    help: "Each milestone: value is the year, body is what happened. The section is hidden while this is empty.",
    value: j([]),
  },
  {
    page: "about", pageLabel: "About page",
    section: "team", sectionLabel: "Team",
    key: "members", label: "People", type: "REPEATABLE",
    help: "Each person: title is their name, value is their role, body is one or two lines about them. The section is hidden while this is empty.",
    value: j([]),
  },

  // ─── Resources ────────────────────────────────────────────────────────────
  {
    page: "resources", pageLabel: "Resources page",
    section: "hero", sectionLabel: "Heading",
    key: "eyebrow", label: "Small line above the title", type: "SHORT_TEXT",
    value: "RESOURCE LIBRARY",
  },
  {
    page: "resources", pageLabel: "Resources page",
    section: "hero", sectionLabel: "Heading",
    key: "headline", label: "Title", type: "SHORT_TEXT",
    value: "Everything for the classroom, all in one place.",
  },
  {
    page: "resources", pageLabel: "Resources page",
    section: "hero", sectionLabel: "Heading",
    key: "standfirst", label: "Line underneath", type: "LONG_TEXT",
    value: "Worksheets, activities, posters, videos and source sheets — tied to the Chesed Cycles and included with any JOC Education subscription.",
  },
  {
    page: "resources", pageLabel: "Resources page",
    section: "empty", sectionLabel: "When the library is empty",
    key: "heading", label: "Heading", type: "SHORT_TEXT",
    help: "Shown only while nothing has been published.",
    value: "The library is being built.",
  },
  {
    page: "resources", pageLabel: "Resources page",
    section: "empty", sectionLabel: "When the library is empty",
    key: "body", label: "Explanation", type: "LONG_TEXT",
    value: "The JOC Education team is preparing the first set of worksheets, activities and source sheets. They will appear here as they are published — nothing is hidden behind a paywall that is not yet ready.",
  },

  // ─── Teachers' Board ──────────────────────────────────────────────────────
  {
    page: "board", pageLabel: "Teachers' Board",
    section: "hero", sectionLabel: "Heading",
    key: "headline", label: "Title", type: "SHORT_TEXT",
    value: "What other schools are running.",
  },
  {
    page: "board", pageLabel: "Teachers' Board",
    section: "hero", sectionLabel: "Heading",
    key: "standfirst", label: "Line underneath", type: "LONG_TEXT",
    value: "Teachers share what they actually ran — what worked, what didn't, and what surprised them. Filter by region or grade to find ideas from schools like yours.",
  },

  // ─── Shop ─────────────────────────────────────────────────────────────────
  {
    page: "shop", pageLabel: "Shop",
    section: "hero", sectionLabel: "Heading",
    key: "headline", label: "Title", type: "SHORT_TEXT",
    value: "Physical materials for your school.",
  },
  {
    page: "shop", pageLabel: "Shop",
    section: "hero", sectionLabel: "Heading",
    key: "standfirst", label: "Line underneath", type: "LONG_TEXT",
    value: "Printed and shipped directly to your school. Card payment is not switched on yet — send an order and JOC will confirm the total and invoice.",
  },

  // ─── Pricing ──────────────────────────────────────────────────────────────
  // The figures themselves are at /admin/pricing; this is the wording round them.
  {
    page: "pricing", pageLabel: "Pricing page",
    section: "hero", sectionLabel: "Heading",
    key: "headline", label: "Title", type: "SHORT_TEXT",
    value: "Simple, transparent pricing.",
  },
  {
    page: "pricing", pageLabel: "Pricing page",
    section: "hero", sectionLabel: "Heading",
    key: "standfirst", label: "Line underneath", type: "LONG_TEXT",
    value: "No long-term commitment on monthly plans. Annual saves 15%. No school is turned away on cost — we offer full and partial scholarships.",
  },
  {
    page: "pricing", pageLabel: "Pricing page",
    section: "faq", sectionLabel: "Questions and answers",
    key: "items", label: "Questions", type: "REPEATABLE",
    help: "Each one: title is the question, body is the answer.",
    value: j([]),
  },

  // ─── Programs ─────────────────────────────────────────────────────────────
  {
    page: "programs", pageLabel: "Programs page",
    section: "hero", sectionLabel: "Heading",
    key: "headline", label: "Title", type: "SHORT_TEXT",
    value: "Chesed your school can actually run.",
  },
  {
    page: "programs", pageLabel: "Programs page",
    section: "models", sectionLabel: "The four ways to run it",
    key: "heading", label: "Section heading", type: "SHORT_TEXT",
    value: "Four ways schools run chesed with JOC.",
  },

  // ─── Chesed Cycle pages ───────────────────────────────────────────────────
  // The headings on every individual cycle page — /cycles/cheshbon-hanefesh
  // and its seven siblings. One edit here changes all eight, which is the
  // point: they are one page rendered eight times, not eight pages.
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "headings", sectionLabel: "Section headings",
    key: "plan", label: "The breakdown list", type: "SHORT_TEXT",
    help: "Above the numbered list on the left. This used to read “Week by week”, which was wrong — the list has four entries whether the cycle runs four weeks or eight.",
    value: "Lesson plan breakdown",
  },
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "headings", sectionLabel: "Section headings",
    key: "about", label: "The description panel", type: "SHORT_TEXT",
    value: "About this cycle",
  },
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "headings", sectionLabel: "Section headings",
    key: "focus", label: "The bullet list panel", type: "SHORT_TEXT",
    help: "The list of what the weeks focus on. Called “Programming” until now, which now reads as the events calendar — rename it to whatever the team actually calls it.",
    value: "Programming",
  },
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "headings", sectionLabel: "Section headings",
    key: "calendar", label: "The dates panel", type: "SHORT_TEXT",
    value: "Calendar",
  },
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "headings", sectionLabel: "Section headings",
    key: "next", label: "The next-cycle panel", type: "SHORT_TEXT",
    value: "Up next",
  },
  // The button wording depends on whether the cycle has started, so all three
  // are here — otherwise editing the one on screen leaves the other two
  // hardcoded and they drift apart.
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "cta", sectionLabel: "The button at the bottom",
    key: "join_current", label: "While the cycle is running", type: "SHORT_TEXT",
    value: "Join this Cycle",
  },
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "cta", sectionLabel: "The button at the bottom",
    key: "join_upcoming", label: "Before it starts", type: "SHORT_TEXT",
    value: "Get notified when it starts",
  },
  {
    page: "cycle", pageLabel: "Chesed Cycle pages",
    section: "cta", sectionLabel: "The button at the bottom",
    key: "join_past", label: "After it has finished", type: "SHORT_TEXT",
    value: "See next year's program",
  },
];

/** Pages, in editor order, derived from the registry. */
export function sitePages(): { page: string; label: string; count: number }[] {
  const seen = new Map<string, { page: string; label: string; count: number }>();
  for (const f of SITE_FIELDS) {
    const existing = seen.get(f.page);
    if (existing) existing.count++;
    else seen.set(f.page, { page: f.page, label: f.pageLabel, count: 1 });
  }
  return [...seen.values()];
}

/** Sections within a page, in registry order. */
export function pageSections(page: string): { section: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const f of SITE_FIELDS) {
    if (f.page === page && !seen.has(f.section)) seen.set(f.section, f.sectionLabel);
  }
  return [...seen.entries()].map(([section, label]) => ({ section, label }));
}

export function fieldDef(page: string, section: string, key: string): FieldDef | undefined {
  return SITE_FIELDS.find((f) => f.page === page && f.section === section && f.key === key);
}
