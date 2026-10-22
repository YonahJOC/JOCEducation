/**
 * What the iPad at the pizza table is in the middle of.
 *
 * A group arrives, somebody types their name, and for the next hour the
 * device holds a count. That count is the iPad's own business until the
 * button is pressed: the wall does not need to know a group is on four and
 * then five and then six, it needs to know the six when somebody says so.
 *
 * So the session lives on the device and survives a reload, a sleep and a
 * dropped network — a tally that vanishes because a browser refreshed is a
 * group's afternoon gone. What reaches the server is each submit, which is
 * written down in ImpactSubmit with who pressed it.
 */

export type Project = "pizzas" | "beds";

export type CounterSession = {
  groupName: string;
  /** Whether the name is shown on the wall and on the iPad. */
  showName: boolean;
  project: Project;
  /** Null when counting without one. */
  goal: number | null;
  count: number;
  /** What has already reached the wall, so a submit sends the difference. */
  submitted: number;
  startedAt: string;
};

export const WORDS: Record<Project, { made: string; label: string; one: string }> = {
  pizzas: { made: "Pizzas made", label: "Pizza project", one: "pizza" },
  beds: { made: "Beds given out", label: "Bed project", one: "bed" },
};

export function newSession(input: {
  groupName: string;
  project: Project;
  goal: number | null;
}): CounterSession {
  return {
    groupName: input.groupName.trim().slice(0, 48),
    showName: true,
    project: input.project,
    goal: input.goal && input.goal > 0 ? Math.min(9999, Math.round(input.goal)) : null,
    count: 0,
    submitted: 0,
    startedAt: new Date().toISOString(),
  };
}

/** What a submit would send: what has been counted but not yet sent. */
export const pending = (s: CounterSession) => s.count - s.submitted;

const KEY = "joc-counter-session";

/**
 * Reading comes back null rather than throwing, because every one of these
 * fails in a private window, with site data blocked, and in a preview — and
 * a counter that will not open is worse than one that forgot a name.
 */
export function loadSession(): CounterSession | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CounterSession>;
    if (p.project !== "pizzas" && p.project !== "beds") return null;
    const num = (v: unknown, f: number) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : f);
    return {
      groupName: typeof p.groupName === "string" ? p.groupName.slice(0, 48) : "",
      showName: p.showName !== false,
      project: p.project,
      goal: p.goal && Number(p.goal) > 0 ? num(p.goal, 0) : null,
      count: num(p.count, 0),
      submitted: num(p.submitted, 0),
      startedAt: typeof p.startedAt === "string" ? p.startedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveSession(s: CounterSession | null): void {
  try {
    if (s === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Nothing to do about it and nothing worth stopping for: the count is
    // in React state either way, and only a reload would lose it.
  }
}
