/**
 * The desk's pure helpers: a name, a greeting, a date line.
 *
 * They were in lib/desk.ts, which also opens the database and reads the
 * session — so a unit test of "is it morning?" pulled in Prisma and NextAuth
 * and fell over. Nothing here touches the network, the clock or the request.
 * lib/desk.ts re-exports all three, so every existing import still works.
 */

/** First name only. */
export function firstName(who: string | null | undefined): string {
  if (!who) return "there";
  return who.includes("@") ? who.split("@")[0] : who.split(/\s+/)[0];
}

/** Morning until noon, afternoon until six, evening after. */
export function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The date line: Gregorian, then the Hebrew date.
 *
 * Intl does the Hebrew calendar, so there is no table to keep and no library
 * to go stale. It rolls at midnight rather than nightfall — the honest
 * version needs a location and a sunset, and a console is not a siddur.
 */
export function dateLine(now: Date): string {
  const greg = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  }).toUpperCase();

  let hebrew = "";
  try {
    hebrew = new Intl.DateTimeFormat("en-u-ca-hebrew", {
      day: "numeric", month: "long",
    }).format(now).toUpperCase();
  } catch {
    // An engine without the Hebrew calendar: the Gregorian date alone.
  }

  return hebrew ? `${greg} · ${hebrew}` : greg;
}
