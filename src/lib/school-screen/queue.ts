import type { EditorFlyer, ScreenEditorData } from "./editor-data";
import { shoutOutFrom, type ScreenStatus } from "./rules";

/**
 * The queue, as a list rather than as three tables.
 *
 * A flyer, a photo and a shout-out are three rows in the database and one
 * job to a person: look at it, say yes or no. The editor used to flatten
 * them inside the component that drew them, which meant the rule for what
 * belongs in whose queue lived in JSX and could not be tested.
 *
 * Nothing in here reaches for the session, the database or React. What it
 * decides is which of a school's things are in front of which person, which
 * is the one part of this worth being sure about.
 */

export type QueueKind = "flyer" | "photo" | "shout-out";

export type QueueItem = {
  id: string;
  kind: QueueKind;
  title: string;
  /** A second line: the flyer's own line, where it is, when it is. */
  detail: string | null;
  imageUrl: string | null;
  /** What a student wrote, for a shout-out. */
  quote: string | null;
  /** How that quote will be signed on the TV — shoutOutFrom's answer. */
  onScreen: string | null;
  by: string | null;
  endorsedBy: string | null;
  status: ScreenStatus;
  /** When it last moved: decided, else endorsed, else made. */
  at: string;
  /** This person sent it in. */
  mine: boolean;
  /** The flyer itself, so a preview can be drawn the way the TV draws it. */
  flyer: EditorFlyer | null;
};

/** One row of the queue, keyed across the three kinds it is made of. */
export const queueKey = (item: Pick<QueueItem, "kind" | "id">) => `${item.kind}-${item.id}`;

/** Everything in the editor's data, in one list, in whichever states are wanted. */
export function queueItems(data: ScreenEditorData, want: ScreenStatus[]): QueueItem[] {
  const out: QueueItem[] = [];

  for (const f of data.flyers) {
    if (!want.includes(f.status)) continue;
    out.push({
      id: f.id,
      kind: "flyer",
      title: f.title,
      detail: [f.line, f.place, f.time].filter(Boolean).join(" · ") || null,
      imageUrl: f.imageUrl,
      quote: null,
      onScreen: null,
      by: f.by,
      endorsedBy: f.endorsedBy,
      status: f.status,
      at: f.at,
      mine: f.mine,
      flyer: f,
    });
  }

  for (const p of data.photos) {
    if (!want.includes(p.status)) continue;
    out.push({
      id: p.id,
      kind: "photo",
      title: p.caption || "A photo for the screen",
      detail: null,
      imageUrl: p.imageUrl,
      quote: null,
      onScreen: null,
      by: p.by,
      endorsedBy: p.endorsedBy,
      status: p.status,
      at: p.at,
      mine: p.mine,
      flyer: null,
    });
  }

  for (const s of data.shoutOuts) {
    if (!want.includes(s.status)) continue;
    const name = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
    out.push({
      id: s.id,
      kind: "shout-out",
      title: name ? `From ${name}${s.grade ? `, ${s.grade}` : ""}` : "Anonymous",
      detail: s.showName ? "Name may be shown" : "Name to stay off the screen",
      imageUrl: null,
      quote: s.text,
      // What the wall will actually say under it, which is the thing being
      // approved — not what the student typed into the name boxes.
      onScreen: shoutOutFrom(s) || null,
      by: name || s.email || null,
      endorsedBy: s.endorsedBy,
      status: s.status,
      at: s.at,
      // A shout-out comes from a student who is not in this portal at all,
      // so it is never anybody's own upload.
      mine: false,
      flyer: null,
    });
  }

  return out;
}

export type QueueMode = "endorse" | "approve";

/**
 * What is waiting for this person.
 *
 * An ambassador is given the first look: the things nobody has touched. The
 * school is given what an ambassador passed on *and* anything still
 * untouched, so a school whose ambassador is away for a week is never stuck
 * waiting for a student.
 *
 * `hideOwn` leaves an ambassador's own uploads out of their own first look.
 * It is off by default, which is how the queue has always worked: the
 * school still signs everything off, so a student passing on their own
 * flyer skips nobody's check. Turning it on is a decision about what two
 * stages are for rather than a bug fix, so it is a switch and not a rule.
 */
export function needsYou(
  data: ScreenEditorData,
  mode: QueueMode,
  opts: { hideOwn?: boolean } = {},
): QueueItem[] {
  const items = queueItems(data, mode === "endorse" ? ["PENDING"] : ["ENDORSED", "PENDING"]);
  if (mode === "endorse" && opts.hideOwn) return items.filter((i) => !i.mine);
  return items;
}

/**
 * What a student said no to.
 *
 * Kept apart from the queue rather than hidden: somebody has to be able to
 * see that eleven things went this way this week, and to put any of them
 * back, without those eleven being mixed in with the real work.
 */
export function setAsideItems(data: ScreenEditorData): QueueItem[] {
  return queueItems(data, ["SET_ASIDE"]);
}

/** Everything this person sent in themselves, newest state first. */
export function myUploads(data: ScreenEditorData): QueueItem[] {
  return queueItems(data, ["PENDING", "ENDORSED", "APPROVED", "SET_ASIDE", "REJECTED"])
    .filter((i) => i.mine);
}

/**
 * How far along an upload is, as three steps.
 *
 * Sent in → passed on → on the screen. A student watching their own flyer
 * wants to know whether anything has happened to it, and "ENDORSED" does
 * not answer that; two filled pips out of three does.
 */
export function uploadProgress(status: ScreenStatus): { done: number; label: string; stopped: boolean } {
  switch (status) {
    case "PENDING":
      return { done: 1, label: "Sent in — waiting for a first look", stopped: false };
    case "ENDORSED":
      return { done: 2, label: "Passed on — waiting for a teacher", stopped: false };
    case "APPROVED":
      return { done: 3, label: "On the screen", stopped: false };
    case "SET_ASIDE":
      return { done: 1, label: "Set aside by an ambassador", stopped: true };
    case "REJECTED":
      return { done: 1, label: "Not approved", stopped: true };
  }
}
