/**
 * The Experiences department's words and rules, written down once.
 *
 * Experiences hosts groups — a family, a tour, an organisation, a bar or bat
 * mitzvah group — for a chesed experience, and wanted to keep track of each
 * client the way the console already keeps track of schools. This is that,
 * mirrored from the School Update Form and the Buzz rather than bolted onto
 * them: a client is not a school, and putting a family's bat mitzvah on the
 * schools board would make that board about everything.
 *
 * Its own module, and pure, for two reasons. A "use server" file may only
 * export async functions — a constant exported from one reaches the browser
 * as something else entirely (see lib/school-update.ts) — and everything here
 * is worth a test that does not need a database.
 */

/** "Add a client" is an option in the list, so its value must not be an id. */
export const NEW_CLIENT = "__new";

// ─── Clients ────────────────────────────────────────────────────────────────

/** Where a client stands with us. Mirrors ExperienceClientStatus. */
export const CLIENT_STATUSES = ["LEAD", "BOOKED", "REGULAR", "DORMANT"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const STATUS_LABEL: Record<ClientStatus, string> = {
  LEAD: "Lead",
  BOOKED: "Booked",
  REGULAR: "Regular",
  DORMANT: "Gone quiet",
};

/** Anything a form sends that is not one of the four is a lead. */
export function parseStatus(v: unknown): ClientStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(String(v)) ? (v as ClientStatus) : "LEAD";
}

/**
 * Suggestions for what kind of group a client is — offered, never enforced.
 *
 * The column is free text because a fixed list would be wrong by the second
 * month, and a group that fits none of the options is still a group.
 */
export const CLIENT_KINDS = [
  "Family", "Bar/Bat mitzvah group", "School group", "Tour group", "Organisation", "Shul", "Company",
] as const;

// ─── Activities ─────────────────────────────────────────────────────────────

/** Mirrors ExperienceActivityType, in the order the form offers them. */
export const ACTIVITY_TYPES = [
  "CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE", "EXPERIENCE_BOOKED", "EXPERIENCE_DONE",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** What each one is called on the form. */
export const TYPE_LABEL: Record<ActivityType, string> = {
  CALL: "Phone call",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
  EXPERIENCE_BOOKED: "Experience booked",
  EXPERIENCE_DONE: "Experience done",
};

/** What each one is called on a row — the mono tag, as on the Buzz. */
export const TYPE_TAG: Record<ActivityType, string> = {
  CALL: "PHONE CALL",
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
  MEETING: "MEETING",
  NOTE: "NOTE",
  EXPERIENCE_BOOKED: "BOOKED",
  EXPERIENCE_DONE: "EXPERIENCE",
};

export function parseType(v: unknown): ActivityType | null {
  return (ACTIVITY_TYPES as readonly string[]).includes(String(v)) ? (v as ActivityType) : null;
}

/** Only the experience itself has a group in front of it. */
export function takesGroupSize(type: ActivityType): boolean {
  return type === "EXPERIENCE_BOOKED" || type === "EXPERIENCE_DONE";
}

/**
 * Which types each filter on the feed covers.
 *
 * `all` is the whole list, so a type added later cannot go missing from the
 * feed — which is what nearly happened to the phone call on the schools
 * board.
 */
export const FILTERS = {
  all: ACTIVITY_TYPES,
  talk: ["CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE"],
  booked: ["EXPERIENCE_BOOKED"],
  done: ["EXPERIENCE_DONE"],
} as const satisfies Record<string, readonly ActivityType[]>;
export type Filter = keyof typeof FILTERS;

export const FILTER_LABEL: Record<Filter, string> = {
  all: "Everything",
  talk: "Conversations",
  booked: "Booked",
  done: "Done",
};

export function parseFilter(v: unknown): Filter {
  const s = String(v ?? "");
  return Object.prototype.hasOwnProperty.call(FILTERS, s) ? (s as Filter) : "all";
}

export function matchesFilter(type: string, filter: Filter): boolean {
  return (FILTERS[filter] as readonly string[]).includes(type);
}

/**
 * Does a row match what somebody typed in the search box?
 *
 * The database does the real search; this is the same rule written down so
 * it can be tested, and so the two cannot quietly disagree about whether a
 * client's name counts.
 */
export function matchesSearch(
  row: { clientName: string; summary: string; detail: string | null },
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [row.clientName, row.summary, row.detail ?? ""].some((s) => s.toLowerCase().includes(needle));
}

/**
 * The line a row is called by, when nobody wrote one.
 *
 * Summary is optional on the form because "Call with the Cohens" says nothing
 * the type and the client have not already said. Somebody who does write one
 * keeps theirs.
 */
export function summaryLine(type: ActivityType, clientName: string, written?: string | null): string {
  const own = (written ?? "").trim();
  if (own) return own.slice(0, 200);
  const name = clientName.trim() || "a client";
  switch (type) {
    case "CALL": return `Call with ${name}`;
    case "WHATSAPP": return `WhatsApp with ${name}`;
    case "EMAIL": return `Email with ${name}`;
    case "MEETING": return `Meeting with ${name}`;
    case "NOTE": return `Note on ${name}`;
    case "EXPERIENCE_BOOKED": return `Experience booked for ${name}`;
    case "EXPERIENCE_DONE": return `Experience with ${name}`;
  }
}

/**
 * How many were there, as typed. Whole numbers only; anything else is blank
 * rather than a guess at what they meant. Capped, because a typo of 20000
 * would otherwise sit on the client's card for ever.
 */
export function parseGroupSize(raw: unknown): number | null {
  const s = String(raw ?? "").trim();
  if (!/^\d{1,5}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= 5000 ? n : null;
}

// ─── Time ───────────────────────────────────────────────────────────────────

/**
 * When it happened, as the person meant it.
 *
 * The clock on the wall wherever they were, kept as it was typed — the same
 * rule as the School Update Form. The server runs in UTC and the department
 * is in Israel or New York, so parsing "14:30" as the server's local time
 * files a two-thirty experience at some other hour. The components are pinned
 * to UTC instead, and every screen reads them back in UTC.
 *
 * No date, or one that is not a date, means now.
 */
export function pinWallClock(when: string, time: string, now: Date): Date {
  const date = when.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return now;
  const t = time.trim();
  return /^\d{2}:\d{2}$/.test(t)
    ? new Date(`${date}T${t}:00.000Z`)
    : new Date(`${date}T00:00:00.000Z`);
}

/**
 * The time on a row, only where somebody typed one.
 *
 * A row with no time is stored at midnight, and showing "12:00 AM" is showing
 * a number nobody chose. A row logged with no date at all carries the moment
 * it was written, which is also not a time anybody picked — but it is honest
 * about when, so it is shown.
 */
export function clockOf(d: Date): string | null {
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return null;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

/** Today as the date input wants it. */
export function todayIso(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** The date and time an input shows for a stored row, for editing it. */
export function toInputs(d: Date): { when: string; time: string } {
  const iso = d.toISOString();
  const time = iso.slice(11, 16);
  return { when: iso.slice(0, 10), time: time === "00:00" ? "" : time };
}

// ─── Who may do what ────────────────────────────────────────────────────────

/**
 * Edit or remove one entry: whoever wrote it, or a super admin.
 *
 * Wider than the Buzz, where only a super admin edits. This is a department of
 * three writing down their own calls, and making Moshe ask Yonah to fix his
 * own typo is how a log stops being kept.
 */
export function mayChange(
  entry: { authorId: string | null },
  viewer: { id: string | null; superAdmin: boolean },
): boolean {
  if (viewer.superAdmin) return true;
  return Boolean(viewer.id && entry.authorId && entry.authorId === viewer.id);
}
