import { describe, expect, it } from "vitest";
import {
  myUploads, needsYou, queueItems, setAsideItems, uploadProgress,
} from "@/lib/school-screen/queue";
import type { ScreenEditorData } from "@/lib/school-screen/editor-data";
import type { ScreenStatus } from "@/lib/school-screen/rules";

/**
 * Which of a school's things are in front of which person.
 *
 * The rule used to live inside the component that drew the cards, where the
 * only way to check it was to look at a screen. These are the two it has to
 * get right: a student sees what nobody has touched, and the school sees
 * that *and* what a student passed on — so a week with no ambassador on
 * duty does not quietly stop the wall.
 */

const flyer = (over: Partial<ScreenEditorData["flyers"][number]> = {}) => ({
  id: "f1", schoolId: "s1", template: "EVENT" as const, title: "Bake sale",
  line: "11th grade", startsAt: null, time: "2:00 PM", place: "Gym",
  ambassadors: null, icon: null, imageUrl: null, qrUrl: null, qrLabel: null,
  showFrom: "2026-10-20", showUntil: "2026-10-27", sort: 0,
  status: "PENDING" as ScreenStatus, by: "Rivka Mandel", endorsedBy: null, mine: false,
  at: "2026-10-22T10:00:00.000Z",
  ...over,
});

const photo = (over: Partial<ScreenEditorData["photos"][number]> = {}) => ({
  id: "p1", imageUrl: "/x.jpg", caption: "Packing packages",
  status: "PENDING" as ScreenStatus, by: "Rivka Mandel", endorsedBy: null, mine: false,
  at: "2026-10-22T10:00:00.000Z",
  ...over,
});

const shout = (over: Partial<ScreenEditorData["shoutOuts"][number]> = {}) => ({
  id: "x1", text: "Thank you for helping me with my locker",
  firstName: "Dovid", lastName: "Klein", grade: "11th", showName: true,
  email: "dovid@demo-academy.test", status: "PENDING" as ScreenStatus,
  createdAt: "2026-10-22T10:00:00.000Z", endorsedBy: null, at: "2026-10-22T10:00:00.000Z",
  ...over,
});

const make = (over: Partial<ScreenEditorData> = {}): ScreenEditorData => ({
  school: {
    id: "s1", slug: "demo", name: "Demo Academy", shortName: "Demo",
    logoUrl: null, gradeGoal: null, emailDomains: [], screenUp: true,
  },
  role: "teacher",
  canApprove: true,
  canEndorse: true,
  flyers: [],
  photos: [],
  shoutOuts: [],
  dedications: [],
  ...over,
});

describe("what is waiting for whom", () => {
  it("gives a student only what nobody has looked at", () => {
    const data = make({
      flyers: [flyer({ id: "a", status: "PENDING" }), flyer({ id: "b", status: "ENDORSED" })],
    });
    expect(needsYou(data, "endorse").map((i) => i.id)).toEqual(["a"]);
  });

  it("gives the school what was passed on and what nobody reached", () => {
    // A school whose ambassador is away for a week must not be stuck
    // waiting for a student before anything can go up.
    const data = make({
      flyers: [flyer({ id: "a", status: "PENDING" }), flyer({ id: "b", status: "ENDORSED" })],
    });
    expect(needsYou(data, "approve").map((i) => i.id).sort()).toEqual(["a", "b"]);
  });

  it("leaves decided things out of both queues", () => {
    const data = make({
      flyers: [
        flyer({ id: "up", status: "APPROVED" }),
        flyer({ id: "no", status: "REJECTED" }),
        flyer({ id: "aside", status: "SET_ASIDE" }),
      ],
    });
    expect(needsYou(data, "approve")).toHaveLength(0);
    expect(needsYou(data, "endorse")).toHaveLength(0);
  });

  it("can keep a student's own uploads out of their own first look", () => {
    const data = make({
      flyers: [flyer({ id: "mine", mine: true }), flyer({ id: "theirs", mine: false })],
    });
    // Off by default: this is how the queue has always worked.
    expect(needsYou(data, "endorse").map((i) => i.id).sort()).toEqual(["mine", "theirs"]);
    expect(needsYou(data, "endorse", { hideOwn: true }).map((i) => i.id)).toEqual(["theirs"]);
  });

  it("never hides the school's own queue, whoever sent things in", () => {
    // hideOwn is a rule about a student's first look. The school's sign-off
    // is the one that puts things in a hallway and skips nothing.
    const data = make({ flyers: [flyer({ id: "mine", mine: true, status: "ENDORSED" })] });
    expect(needsYou(data, "approve", { hideOwn: true }).map((i) => i.id)).toEqual(["mine"]);
  });
});

describe("the three kinds in one list", () => {
  it("carries a flyer through for a preview and leaves the others without one", () => {
    const data = make({ flyers: [flyer()], photos: [photo()], shoutOuts: [shout()] });
    const items = queueItems(data, ["PENDING"]);
    expect(items.map((i) => i.kind)).toEqual(["flyer", "photo", "shout-out"]);
    expect(items[0].flyer?.title).toBe("Bake sale");
    expect(items[1].flyer).toBeNull();
    expect(items[2].flyer).toBeNull();
  });

  it("signs a shout-out the way the TV will sign it", () => {
    const data = make({ shoutOuts: [shout()] });
    expect(queueItems(data, ["PENDING"])[0].onScreen).toBe("— Dovid Klein, 11th grade");
  });

  it("keeps a name off the screen when the student said no", () => {
    // The thing being approved is what the wall will say, not what was
    // typed into the name boxes.
    const data = make({ shoutOuts: [shout({ showName: false })] });
    const item = queueItems(data, ["PENDING"])[0];
    expect(item.onScreen).toBe("— 11th grade");
    expect(item.onScreen).not.toContain("Dovid");
  });

  it("never counts a shout-out as somebody in the portal's own upload", () => {
    const data = make({ shoutOuts: [shout()] });
    expect(queueItems(data, ["PENDING"])[0].mine).toBe(false);
  });
});

describe("the other two lists", () => {
  it("collects what a student set aside", () => {
    const data = make({
      flyers: [flyer({ id: "a", status: "SET_ASIDE" }), flyer({ id: "b", status: "PENDING" })],
    });
    expect(setAsideItems(data).map((i) => i.id)).toEqual(["a"]);
  });

  it("collects a student's own uploads whatever became of them", () => {
    const data = make({
      flyers: [flyer({ id: "a", mine: true, status: "APPROVED" }), flyer({ id: "b", mine: false })],
      photos: [photo({ id: "c", mine: true, status: "REJECTED" })],
    });
    expect(myUploads(data).map((i) => i.id).sort()).toEqual(["a", "c"]);
  });
});

describe("how far along an upload is", () => {
  it("fills one more pip at each stage", () => {
    expect(uploadProgress("PENDING").done).toBe(1);
    expect(uploadProgress("ENDORSED").done).toBe(2);
    expect(uploadProgress("APPROVED").done).toBe(3);
  });

  it("marks a no as stopped rather than as progress", () => {
    for (const s of ["SET_ASIDE", "REJECTED"] as const) {
      expect(uploadProgress(s).stopped, s).toBe(true);
      expect(uploadProgress(s).done, s).toBe(1);
    }
  });
});
