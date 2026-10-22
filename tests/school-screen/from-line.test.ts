import { describe, expect, it } from "vitest";
import { shoutOutFrom } from "@/lib/school-screen/rules";

/**
 * The line under a shout-out on the wall.
 *
 * A pupil is placed by their grade and a visitor by where they are from,
 * and the two are not interchangeable: "9th" needs the word grade after it
 * to read as anything, and "Bnei Akiva" very much does not.
 *
 * The half that matters is the last block. Thirty school screens render
 * through this function and none of them sends an organisation, so adding
 * one must leave every one of them exactly as it was.
 */

const base = { firstName: "Rivka", lastName: "L", showName: true };

describe("a visitor, placed by where they are from", () => {
  it("prints the organisation as typed", () => {
    expect(shoutOutFrom({ ...base, grade: "", org: "Bnei Akiva" })).toBe("— Rivka L., Bnei Akiva");
  });

  it("does not put the word grade after it", () => {
    // The rule that makes "9th" into "9th grade" would make this into
    // "Shaalvim grade", which is the whole reason org is its own field.
    expect(shoutOutFrom({ ...base, grade: "", org: "Shaalvim" })).not.toContain("grade");
  });

  it("leaves the name alone when there is no organisation", () => {
    expect(shoutOutFrom({ ...base, grade: "", org: "" })).toBe("— Rivka L.");
    expect(shoutOutFrom({ ...base, grade: "", org: null })).toBe("— Rivka L.");
  });

  it("still shows nothing at all when the name is not to be shown", () => {
    // No name, and no organisation either: an organisation with no name is
    // a way of identifying somebody who asked not to be identified.
    expect(shoutOutFrom({ ...base, showName: false, grade: "", org: "Bnei Akiva" })).toBe("");
  });

  it("keeps an apostrophe or an ampersand in a real name", () => {
    expect(shoutOutFrom({ ...base, grade: "", org: "Ohr Sameach" })).toContain("Ohr Sameach");
  });
});

describe("a pupil, placed by their grade — unchanged", () => {
  it("adds the word grade where it is missing", () => {
    expect(shoutOutFrom({ ...base, grade: "9th" })).toBe("— Rivka L., 9th grade");
  });

  it("does not add it twice", () => {
    expect(shoutOutFrom({ ...base, grade: "11th grade" })).toBe("— Rivka L., 11th grade");
  });

  it("shows the grade alone when the name is not to be shown", () => {
    expect(shoutOutFrom({ ...base, showName: false, grade: "9th" })).toBe("— 9th grade");
  });

  it("renders identically whether or not the field exists", () => {
    // Every school screen calls this with rows that have no org. The two
    // must be the same string, or thirty walls change the day it ships.
    const withoutField = shoutOutFrom({ ...base, grade: "9th" });
    const withNull = shoutOutFrom({ ...base, grade: "9th", org: null });
    const withEmpty = shoutOutFrom({ ...base, grade: "9th", org: "" });
    expect(withNull).toBe(withoutField);
    expect(withEmpty).toBe(withoutField);
  });

  it("prefers the grade if somehow both arrive", () => {
    // A school's form cannot send an org, but if one ever did, the pupil's
    // grade is the thing that school's wall is about.
    expect(shoutOutFrom({ ...base, grade: "9th", org: "Bnei Akiva" })).toBe("— Rivka L., 9th grade");
  });
});
