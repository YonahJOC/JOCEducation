/**
 * The panel that is particular to one program.
 *
 * Every console is the same page except for one slot: the JOC App shows what
 * every school is doing in the app, an assembly shows its bookings, a trip
 * shows the group. That was written as `slug === "joc-app"` in the middle of
 * the page, which meant the other seven programs had a console with a hole in
 * it and no way to say so.
 *
 * A slot with no data source yet says what is not recorded, in one sentence.
 * It never shows an empty chart, because an empty chart reads as "nothing
 * happened" when the truth is "nobody is collecting this".
 */

export type SlotKind =
  | "app"        // live: AppActivityPanel
  | "bookings"   // live: the calendar's own runs
  | "reports"    // live once a program has ambassadors
  | "none";      // nothing is recorded for this one yet

export type Slot = {
  kind: SlotKind;
  /** The heading over the panel. */
  title: string;
  /** Said when kind is "none" — what is not being recorded, in words. */
  missing?: string;
};

/**
 * By slug where a program is genuinely particular, by tag otherwise, so a
 * ninth program added in the console gets a sensible slot without a deploy.
 */
const BY_SLUG: Record<string, Slot> = {
  "joc-app": { kind: "app", title: "All schools on the app" },

  "kindness-booth": {
    kind: "reports",
    title: "From the booth",
  },

  "bake-for-chesed": {
    kind: "none",
    title: "This month's cycle",
    missing:
      "Nothing records what a school bakes, or when. Until the app or an ambassador reports it, " +
      "this console can only show where each school is up to and who to ring.",
  },

  "just-one-tutor": {
    kind: "none",
    title: "Pairs this week",
    missing:
      "Tutor pairings are not recorded anywhere yet — not who is matched with whom, nor whether " +
      "they met. That is the one figure this program is actually judged on.",
  },

  "chesed-match": {
    kind: "none",
    title: "Placements",
    missing:
      "Chesed Match runs on another JOC site and nothing comes back from it. Placements are " +
      "invisible here until the two are joined up.",
  },

  "joc-center-trip": {
    kind: "none",
    title: "The group",
    missing:
      "Who is going on the trip lives in the sign-ups below rather than in a list of its own. " +
      "Nothing records the group once it has left.",
  },

  "boots-for-israel": {
    kind: "none",
    title: "What has been collected",
    missing: "Nothing records how much has been collected, or by which school.",
  },
};

const BY_TAG: Record<string, Slot> = {
  Event: { kind: "reports", title: "From the ground" },
  "One-time": { kind: "bookings", title: "Bookings" },
  Trip: { kind: "none", title: "The group", missing: "Nothing records the group once it has left." },
  Platform: { kind: "none", title: "Activity", missing: "Nothing is reported back from this one yet." },
  Ongoing: { kind: "reports", title: "This month" },
};

export function slotFor(slug: string, tag: string): Slot {
  return (
    BY_SLUG[slug] ??
    BY_TAG[tag] ?? {
      kind: "none",
      title: "Activity",
      missing: "Nothing is recorded for this program yet.",
    }
  );
}
