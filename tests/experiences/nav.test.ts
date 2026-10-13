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

  it("is one item for somebody who holds everything, where Schools was", () => {
    const all = labels([...CAPABILITIES]);
    expect(all).toEqual([
      "My desk", "The Office", "Client relations", "Programs",
      "Admin meeting", "Teaching material", "Live screens", "People & access",
    ]);
    expect(all.filter((l) => l === "Client relations")).toHaveLength(1);
  });

  it("opens on the schools for the schools team, on the department's log for Experiences", () => {
    const nav = (caps: string[]) =>
      jocNav({ email: "someone@example.com", role: "STAFF", capabilities: caps }).find((i) => i.label === "Client relations");
    expect(nav(["schools"])?.href).toBe("/admin/schools");
    expect(nav(["experiences"])?.href).toBe("/admin/experiences");
    expect(nav(["schools", "experiences"])?.also).toContain("/admin/experiences");
  });

  it("is not in anybody's rail without either permission", () => {
    expect(labels(["programs"])).not.toContain("Client relations");
  });
});
