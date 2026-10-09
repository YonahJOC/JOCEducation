import type { Task, TrayItem } from "@/lib/my-desk";

/**
 * The one line under the greeting.
 *
 * It replaces four panel headings, each of which announced its own emptiness
 * at the same volume. A person opening the console wants one sentence telling
 * them where they stand — "Two things for today, one waiting on Gilad" — and
 * then the page itself.
 *
 * Generated rather than written, so it cannot go stale. Three clauses at
 * most, in a fixed order: what is yours, what you are waiting on, and who is
 * waiting on you. Any clause with nothing in it is simply left out, and if
 * all three are empty the sentence says so in one piece.
 */

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Small numbers read better as words in a sentence; big ones don't. */
function count(n: number): string {
  return n <= 10 ? WORDS[n] : String(n);
}

function sentence(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")}, ${parts[parts.length - 1]}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The first names of the people holding your handed-off work, deduplicated. */
function waitingOn(handed: Task[]): string[] {
  return [...new Set(handed.filter((t) => !t.done).map((t) => t.handedTo?.name).filter(Boolean) as string[])];
}

export function recap(desk: { tasks: Task[]; handed: Task[]; tray: TrayItem[] }): string {
  const today = desk.tasks.filter((t) => !t.done && !t.later).length;
  const later = desk.tasks.filter((t) => !t.done && t.later).length;
  const names = waitingOn(desk.handed);
  const tray = desk.tray.length;

  const mine: string[] = [];
  if (today) mine.push(`${count(today)} thing${today === 1 ? "" : "s"} for today`);
  else if (later) mine.push(`nothing for today, ${count(later)} parked for later`);

  if (names.length === 1) mine.push(`one waiting on ${names[0]}`);
  else if (names.length === 2) mine.push(`two waiting on ${names[0]} and ${names[1]}`);
  else if (names.length > 2) mine.push(`${count(names.length)} waiting on other people`);

  // Who is waiting on *you* is its own sentence: it is the thing most likely
  // to be forgotten, and burying it in a list is how it gets forgotten.
  const theirs =
    tray === 0
      ? "Nobody's waiting on you."
      : tray === 1
        ? `${cap(desk.tray[0].who)} ${desk.tray[0].verb}.`
        : `${cap(count(tray))} things are waiting on you.`;

  if (mine.length === 0 && tray === 0) return "A clear desk. Enjoy it.";
  if (mine.length === 0) return theirs;
  return `${cap(sentence(mine))}. ${theirs}`;
}
