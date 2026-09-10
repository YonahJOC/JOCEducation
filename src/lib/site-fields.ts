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
    section: "hero", sectionLabel: "Hero",
    key: "proof", label: "Proof numbers", type: "REPEATABLE",
    help: "Three figures under the introduction. These are currently unverified — replace with real ones.",
    value: j([
      { title: "300+", body: "partner schools" },
      { title: "14,000+", body: "teachers with access" },
      { title: "2.1M", body: "chesed hours logged" },
    ]),
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
    value: "Everything a rebbe or morah needs, in one place.",
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
