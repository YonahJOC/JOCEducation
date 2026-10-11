import { describe, expect, it } from "vitest";
import { jocNav } from "@/lib/nav";
import { CAPABILITIES } from "@/lib/access";

/**
 * Where Experiences lands in the rail. The department holds this one
 * permission and nothing else, and a super admin holds everything — the rail
 * has to be right for both without the seven-item cap eating anything that
 * was there before.
 */

const labels = (caps: string[]) =>
  jocNav({ email: "someone@example.com", role: "STAFF", capabilities: caps }).map((i) => i.label);

describe("jocNav and Experiences", () => {
  it("gives the department its desk, the Office and Experiences", () => {
    expect(labels(["experiences"])).toEqual(["My desk", "The Office", "Experiences"]);
  });

  it("sits straight after Programs", () => {
    const l = labels(["programs", "experiences"]);
    expect(l.indexOf("Experiences")).toBe(l.indexOf("Programs") + 1);
  });

  it("leaves somebody who holds everything with the rail they had", () => {
    const all = labels([...CAPABILITIES]);
    const before = labels(CAPABILITIES.filter((c) => c !== "experiences"));
    expect(all).toEqual(before);
    expect(all).toHaveLength(7);
    expect(all).toContain("People & access");
    expect(all).toContain("Admin meeting");
  });

  it("is not in anybody's rail without the permission", () => {
    expect(labels(["schools"])).not.toContain("Experiences");
  });
});
