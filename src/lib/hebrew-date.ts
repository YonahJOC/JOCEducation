/**
 * The Hebrew date, in Hebrew, in one place.
 *
 * It had grown four separate copies — the console's greeting, the lobby TV,
 * a school's own TV and the week poster — each printing "7 Heshvan". Four
 * copies of a thing is how the icon font ended up missing from a whole side
 * of the portal, so: one function, and everything that prints a Hebrew date
 * calls it.
 *
 * **Why the numerals are written here and not by Intl.** A Hebrew date is
 * written with letters — ז׳ בחשוון, not 7 בחשוון. Intl will give the month
 * names, but `numberingSystem: "hebr"` resolves straight back to `latn` in
 * Node and in browsers, because gematria is algorithmic rather than a digit
 * set. So Intl is asked for the parts it is good at (the month name, Adar II
 * included) and the numbers are lettered below. That also means the date
 * reads the same in Node, in every browser and on a stick behind a
 * television, rather than depending on whose ICU is installed.
 *
 * **It turns over at midnight, not at sunset.** A real Hebrew date needs a
 * location and a sunset table, and these are screens on walls and headings
 * on pages. A date that changed halfway through an afternoon would read as a
 * bug to everybody looking at it, so the rule is the simple one and it is
 * the same rule everywhere.
 *
 * Returns '' rather than throwing on an engine with no Hebrew calendar, so
 * every caller can render the English date alone and show nothing where this
 * would have gone.
 */

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];

const GERESH = "׳"; // ׳  after a single letter
const GERSHAYIM = "״"; // ״  before the last of several

/**
 * A number as Hebrew letters: 7 → ז׳, 15 → ט״ו, 787 → תשפ״ז.
 *
 * Fifteen and sixteen are written ט״ו and ט״ז rather than י״ה and י״ו,
 * because those two spell a Name. The rule applies to the last two digits of
 * any number, so 115 is קט״ו.
 */
export function gematria(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";

  let out = "";
  let rest = Math.floor(n);

  // Thousands are dropped: a Hebrew year is written תשפ״ז, not ה׳תשפ״ז, on
  // anything short enough to be read at a glance.
  rest %= 1000;

  out += HUNDREDS[Math.floor(rest / 100)] ?? "";
  const last = rest % 100;
  out += last === 15 ? "טו" : last === 16 ? "טז" : TENS[Math.floor(last / 10)] + ONES[last % 10];

  if (out.length === 0) return "";
  if (out.length === 1) return out + GERESH;
  return out.slice(0, -1) + GERSHAYIM + out.slice(-1);
}

export function hebrewDate(
  date: Date,
  opts: {
    /** Pass the zone the English date beside it uses, or the dates disagree. */
    timeZone?: string;
    /** Adds the year: ז׳ בחשוון תשפ״ז. */
    year?: boolean;
  } = {},
): string {
  try {
    const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
      ...(opts.timeZone ? { timeZone: opts.timeZone } : {}),
      day: "numeric",
      month: "long",
      ...(opts.year ? { year: "numeric" as const } : {}),
    }).formatToParts(date);

    // Rebuilt from the parts rather than string-replaced, so the literals
    // Intl puts between them — the " ב" that makes it "of Cheshvan" — stay
    // exactly where it put them.
    const out = parts
      .map((p) =>
        p.type === "day" || p.type === "year" ? gematria(Number(p.value)) : p.value,
      )
      .join("");

    return out.trim();
  } catch {
    return "";
  }
}

/** First-strong isolate, so Hebrew inside an English line cannot reorder it. */
const FSI = "⁨";
const PDI = "⁩";

/**
 * An English date with the Hebrew one after it, or the English alone.
 *
 * The Hebrew is wrapped in a directional isolate. Without it the bidi
 * algorithm treats the separator and anything after as part of the
 * right-to-left run, and "Mon 19 Oct · ז׳ בחשוון · 2:00pm" rearranges itself
 * on the way to the screen.
 *
 * The separator is the caller's, because this lands in a 56px heading on a
 * television and in a 14px line in a chat, and those do not want the same
 * punctuation between them.
 */
export function withHebrew(english: string, date: Date, opts: {
  timeZone?: string;
  year?: boolean;
  /** Default " · ". */
  separator?: string;
} = {}): string {
  const heb = hebrewDate(date, opts);
  return heb ? `${english}${opts.separator ?? " · "}${FSI}${heb}${PDI}` : english;
}

/** The same isolate, for a Hebrew string a caller already has. */
export function isolate(hebrew: string): string {
  return hebrew ? `${FSI}${hebrew}${PDI}` : "";
}
