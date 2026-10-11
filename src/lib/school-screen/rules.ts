/**
 * The school screen's rules, as plain functions with no database and no DOM,
 * so they can be tested and so the TV, the API and the editors all agree.
 */

/** Days are Jerusalem days: the screens hang in schools, but JOC keeps the calendar. */
export const SCREEN_TZ = "Asia/Jerusalem";

/** YYYY-MM-DD for the given moment in a timezone. */
export function dayKey(at: Date, tz = SCREEN_TZ): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * The moment a YYYY-MM-DD day begins in a timezone.
 *
 * Worked out from the zone's own offset on that day, so a flyer set to go up
 * on the 27th of March goes up at midnight whichever side of the clocks
 * changing it falls.
 */
export function dayStart(ymd: string, tz = SCREEN_TZ): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return new Date(NaN);
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return new Date(guess - (asIfUtc - guess));
}

/** The last moment of a YYYY-MM-DD day in a timezone. */
export function dayEnd(ymd: string, tz = SCREEN_TZ): Date {
  const start = dayStart(ymd, tz);
  const next = new Date(start.getTime() + 36 * 3600_000);
  return new Date(dayStart(dayKey(next, tz), tz).getTime() - 1);
}

/* ------------------------------------------------------------ dedication -- */

export type DedicationRow = {
  schoolId: string | null;
  /** YYYY-MM-DD */
  date: string;
  hebrewName: string;
  text: string | null;
};

/**
 * Today's dedication for one school.
 *
 * The school's own wins. Failing that, one set for every school (a null
 * school). Failing that, nothing, and the card is not drawn — a screen that
 * says "dedicated to a refuah shleima for" and then nobody is worse than no
 * dedication at all.
 */
export function pickDedication(
  rows: DedicationRow[], schoolId: string, today: string,
): { hebrewName: string; text: string | null } | null {
  const todays = rows.filter((r) => r.date === today && r.hebrewName.trim());
  const pick = todays.find((r) => r.schoolId === schoolId) ?? todays.find((r) => r.schoolId === null);
  return pick ? { hebrewName: pick.hebrewName.trim(), text: pick.text?.trim() || null } : null;
}

/* ---------------------------------------------------------------- flyers -- */

export type FlyerWindow = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  template: "EVENT" | "PROGRAM" | "BANNER";
  showFrom: Date;
  showUntil: Date;
  startsAt: Date | null;
};

/**
 * Whether a flyer is on the wall right now.
 *
 * Approved, inside its own show window — and an event comes down the day
 * after it happens even if somebody left the window open, because a flyer for
 * last Thursday's bake sale tells everyone walking past that nobody is
 * looking after the screen.
 */
export function flyerShowing(f: FlyerWindow, now: Date): boolean {
  if (f.status !== "APPROVED") return false;
  if (now < f.showFrom || now > f.showUntil) return false;
  if (f.template === "EVENT" && f.startsAt) {
    if (dayKey(now) > dayKey(f.startsAt)) return false;
  }
  return true;
}

/** An event title's size: as big as fits one line of the panel, never over 72px. */
export function eventTitleSize(title: string): number {
  return Math.min(72, Math.floor(900 / Math.max(1, title.trim().length)));
}

export function wordCount(...parts: (string | null | undefined)[]): number {
  return parts
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export type FlyerDraft = {
  template: "EVENT" | "PROGRAM" | "BANNER";
  title: string;
  line?: string | null;
  time?: string | null;
  place?: string | null;
  startsAt?: string | Date | null;
  hasImage?: boolean;
  qrUrl?: string | null;
};

/**
 * What a flyer gets wrong against the flyer guidelines.
 *
 * Warnings, never refusals: whoever is making it may have a reason, and a
 * form that will not save is a form people stop using. The DOM check for a
 * title that does not fit its line is the editor's; this covers the rest.
 */
export function flyerWarnings(f: FlyerDraft): string[] {
  const out: string[] = [];
  const words = wordCount(f.title, f.line, f.place);
  if (words > 12) out.push(`${words} words. Twelve is the most anyone reads walking past.`);
  if (!f.title.trim()) out.push("It has no name.");
  if (f.template === "EVENT") {
    if (!f.startsAt) out.push("No date. An event flyer needs one, or it never comes down on its own.");
    if (!f.hasImage) out.push("No photo. An event flyer is built around one.");
    if (f.title.trim() && eventTitleSize(f.title) < 60) {
      out.push("The name is long enough to shrink below 60px. Try a shorter one.");
    }
  }
  if (f.template === "BANNER" && !f.hasImage) out.push("A banner is a picture. Add one.");
  if (f.qrUrl && /\.pdf($|\?)/i.test(f.qrUrl)) out.push("The QR code opens a PDF. Link to a page that works on a phone.");
  return out;
}

/* ---------------------------------------------------------------- grades -- */

export type GradeTile = { label: string; hours: number; reached: boolean; over: number };

/** Every grade shares one goal. At or over it, the tile turns orange: bonus round. */
export function gradeTiles(rows: { label: string; hours: number }[], goal: number): GradeTile[] {
  const g = Math.max(1, Math.round(goal));
  return rows.map((r) => {
    const hours = Math.max(0, Math.round(r.hours));
    return { label: r.label, hours, reached: hours >= g, over: Math.max(0, hours - g) };
  });
}

/* ------------------------------------------------------------ shout-outs -- */

/**
 * The line under a shout-out.
 *
 * A name only with the student's say-so, given when they sent it. Without
 * it, the grade alone: the shout-out still lands, and nobody's name is on a
 * wall they did not agree to.
 */
export function shoutOutFrom(s: {
  firstName: string; lastInitial: string; grade: string; showName: boolean;
}): string {
  const grade = s.grade.trim();
  const g = grade ? (/grade/i.test(grade) ? grade : `${grade} grade`) : "";
  if (!s.showName || !s.firstName.trim()) return g ? `— ${g}` : "";
  const initial = s.lastInitial.trim().charAt(0).toUpperCase();
  const name = `${s.firstName.trim()}${initial ? ` ${initial}.` : ""}`;
  return g ? `— ${name}, ${g}` : `— ${name}`;
}

/* ------------------------------------------------------------- sign-in ---- */

/** "@haftr.org, haftr.org; students.haftr.org" → ["haftr.org", "students.haftr.org"] */
export function normalizeDomains(input: string | string[]): string[] {
  const parts = Array.isArray(input) ? input : input.split(/[\s,;]+/);
  const out = parts
    .map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
    .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
  return [...new Set(out)];
}

/**
 * Whether this address may send a shout-out to this school.
 *
 * The school's own domain, or a subdomain of it. A school with no domain set
 * yet takes any signed-in account — the approval queue still stands between
 * a post and the wall — and the staff page says so until one is set.
 */
export function emailAllowed(email: string | null | undefined, domains: string[]): boolean {
  if (!email) return false;
  if (domains.length === 0) return true;
  const host = email.trim().toLowerCase().split("@")[1] ?? "";
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/* ---------------------------------------------------------------- theme --- */

/**
 * The cycle themes in Hebrew, for the line under the English on the screen.
 *
 * Keyed on the theme's transliteration before any " - English" the console
 * adds ("Hachnasat Orchim-Welcoming Guests"). A theme not listed shows in
 * English only.
 */
const THEME_HE: Record<string, string> = {
  "cheshbon hanefesh": "חשבון הנפש",
  "hachnasat orchim": "הכנסת אורחים",
  "shmirat halashon": "שמירת הלשון",
  "hakarat hatov": "הכרת הטוב",
  "kavod": "כבוד",
  "marbim b'simcha": "מרבים בשמחה",
  "ahavat yisrael": "אהבת ישראל",
  "achrayut": "אחריות",
};

export function themeParts(theme: string): { en: string; he: string | null } {
  const en = theme.split(/\s*[-–—]\s*/)[0].trim() || theme.trim();
  const key = en.toLowerCase().replace(/[’`]/g, "'");
  return { en, he: THEME_HE[key] ?? null };
}

/* ---------------------------------------------------------------- misc ---- */

/** Hours from the app's minutes, rounded; null stays null. */
export function hoursFromMinutes(m: number | null | undefined): number | null {
  return typeof m === "number" && Number.isFinite(m) ? Math.round(m / 60) : null;
}

/** "HAFTR" from "HAFTR High School" when nobody has set a short name. */
export function shortName(name: string, set?: string | null): string {
  if (set?.trim()) return set.trim();
  const words = name.trim().split(/\s+/);
  return words.length <= 2 ? name.trim() : words.slice(0, 2).join(" ");
}
