import { describe, expect, it } from "vitest";
import { jocNav } from "@/lib/nav";
import { CAPABILITIES } from "@/lib/access";

/**
 * Where Client relations lands in the rail. The department holds this one
 * permission and nothing else, and a super admin holds everything — the rail
 * has to be right for both, and giving it a place must not cost anybody an
 * item they had before.
 */

const labels = (caps: string[]) =>
  jocNav({ email: "someone@example.com", role: "STAFF", capabilities: caps }).map((i) => i.label);

describe("jocNav and Client relations", () => {
  it("gives the department its desk, the Office and Client relations", () => {
    expect(labels(["experiences"])).toEqual(["My desk", "The Office", "Client relations"]);
  });

  it("sits straight after Programs", () => {
    const l = labels(["programs", "experiences"]);
    expect(l.indexOf("Client relations")).toBe(l.indexOf("Programs") + 1);
  });

  it("is in the rail of somebody who holds everything, and takes nothing out of it", () => {
    // The seven a super admin had before Client relations, in order.
    expect(labels([...CAPABILITIES])).toEqual([
      "My desk", "The Office", "Schools", "Programs", "Client relations",
      "Admin meeting", "Live screens", "People & access",
    ]);
  });

  it("is not in anybody's rail without the permission", () => {
    expect(labels(["schools"])).not.toContain("Client relations");
  });
});
