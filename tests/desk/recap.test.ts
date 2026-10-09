import { describe, expect, it } from "vitest";
import { recap } from "@/lib/desk-recap";
import { greeting } from "@/lib/desk-words";
import type { Task, TrayItem } from "@/lib/my-desk";

/**
 * The sentence under the greeting is the only thing on the page that says
 * where somebody stands, so it has to be right at zero, at one and at many —
 * and it has to stay a sentence, not a list of counters.
 */

const task = (over: Partial<Task> = {}): Task => ({
  id: Math.random().toString(36).slice(2),
  text: "A thing",
  meta: null,
  done: false,
  later: false,
  handedTo: null,
  ...over,
});

const handed = (name: string, done = false): Task =>
  task({ done, handedTo: { initial: name[0], name, status: done ? "DONE" : "SEEN" } });

const tray = (who: string, verb: string): TrayItem => ({
  id: Math.random().toString(36).slice(2),
  kind: "mention",
  initial: who[0],
  who,
  verb,
  quote: "…",
  source: "SOMEWHERE",
  canReply: false,
});

const desk = (tasks: Task[] = [], hand: Task[] = [], items: TrayItem[] = []) => ({
  tasks, handed: hand, tray: items,
});

describe("the recap sentence", () => {
  it("says so plainly when there is nothing at all", () => {
    expect(recap(desk())).toBe("A clear desk. Enjoy it.");
  });

  it("counts one thing in words, not digits", () => {
    expect(recap(desk([task()]))).toBe("One thing for today. Nobody's waiting on you.");
  });

  it("counts several", () => {
    expect(recap(desk([task(), task(), task()]))).toBe(
      "Three things for today. Nobody's waiting on you.",
    );
  });

  it("switches to digits past ten", () => {
    expect(recap(desk(Array.from({ length: 11 }, () => task())))).toMatch(/^11 things for today\./);
  });

  it("mentions what is parked when today is empty", () => {
    expect(recap(desk([task({ later: true })]))).toBe(
      "Nothing for today, one parked for later. Nobody's waiting on you.",
    );
  });

  it("names the one person holding your work", () => {
    expect(recap(desk([task()], [handed("Gilad")]))).toBe(
      "One thing for today, one waiting on Gilad. Nobody's waiting on you.",
    );
  });

  it("names two people, and stops naming beyond that", () => {
    expect(recap(desk([], [handed("Gilad"), handed("Dalia")]))).toMatch(
      /two waiting on Gilad and Dalia/i,
    );
    expect(recap(desk([], [handed("Gilad"), handed("Dalia"), handed("Yudi")]))).toMatch(
      /three waiting on other people/i,
    );
  });

  it("ignores a hand-off that is already done", () => {
    expect(recap(desk([task()], [handed("Gilad", true)]))).toBe(
      "One thing for today. Nobody's waiting on you.",
    );
  });

  it("says who is waiting on you, in their own words", () => {
    expect(recap(desk([], [], [tray("Gilad", "asked you something")]))).toBe(
      "Gilad asked you something.",
    );
  });

  it("counts them once there is more than one", () => {
    expect(recap(desk([], [], [tray("Gilad", "a"), tray("Dalia", "b")]))).toBe(
      "Two things are waiting on you.",
    );
  });

  it("puts all three clauses together in order", () => {
    const s = recap(desk([task(), task()], [handed("Gilad")], [tray("Dalia", "wrote in")]));
    expect(s).toBe("Two things for today, one waiting on Gilad. Dalia wrote in.");
  });
});

describe("the greeting", () => {
  const at = (h: number) => {
    const d = new Date(2026, 9, 9, h, 0, 0);
    return greeting(d);
  };

  it("is morning until noon", () => {
    expect(at(0)).toBe("Good morning");
    expect(at(11)).toBe("Good morning");
  });

  it("is afternoon from noon until six", () => {
    expect(at(12)).toBe("Good afternoon");
    expect(at(17)).toBe("Good afternoon");
  });

  it("is evening from six", () => {
    expect(at(18)).toBe("Good evening");
    expect(at(23)).toBe("Good evening");
  });
});
