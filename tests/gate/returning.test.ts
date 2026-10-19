import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

/**
 * The gate decides whether it is on when the module loads, from the
 * environment, so the environment has to exist before the import does.
 * Without a signing secret and a database it stands aside entirely and
 * every assertion below would pass against a gate that was never shut.
 */
let proxy: (req: NextRequest) => Response & { cookies: { get(n: string): { value: string } | undefined } };

beforeAll(async () => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "postgres://test/test";
  // The gate is switched off for now. These describe it as it behaves when
  // it is back on, so they ask for it: without this they would all pass
  // against a gate that was never shut, which is the failure mode this file
  // was written to avoid in the first place.
  process.env.GATE = "on";
  ({ proxy } = (await import("@/proxy")) as never);
});

/**
 * The gate, for somebody who has been here before.
 *
 * A stranger gets the landing page — that is where the explanation of the
 * whole thing lives. A teacher whose session has run out used to get it
 * too, which meant finding a sign-in button and scrolling to a form to
 * reach a page they open every week.
 *
 * These pin the difference, and pin that the marker carries nothing: it is
 * the string "1", and it decides where somebody is sent, never what they
 * are allowed to see. Every one of these requests is signed out.
 */

const SESSION = "authjs.session-token";
const RETURNING = "joc-returning";

function go(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return proxy(
    new NextRequest(`https://education.justonechesed.org${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );
}

const to = (res: Response) => {
  const loc = res.headers.get("location");
  return loc ? new URL(loc).pathname + new URL(loc).search : null;
};

describe("a browser that has never signed in", () => {
  it("gets the landing page at the root", () => {
    // 200/next() rather than a redirect: the landing page is the right
    // answer for somebody who has not heard of us.
    expect(to(go("/"))).toBeNull();
  });

  it("is sent to the landing page from a page behind the gate", () => {
    expect(to(go("/home"))).toBe("/");
  });

  it("keeps where they were going", () => {
    expect(to(go("/school/screen"))).toBe("/?next=%2Fschool%2Fscreen");
  });
});

describe("a browser that has signed in before", () => {
  const seen = { [RETURNING]: "1" };

  it("goes straight to the sign-in page instead of the marketing page", () => {
    expect(to(go("/", seen))).toBe("/login");
  });

  it("is sent to sign-in from a page behind the gate, not to the landing page", () => {
    expect(to(go("/home", seen))).toBe("/login");
  });

  it("still keeps where they were going", () => {
    expect(to(go("/school/screen", seen))).toBe("/login?next=%2Fschool%2Fscreen");
  });

  it("can still reach the landing page deliberately", () => {
    // Somebody wanting to read the marketing page, or send its link on.
    expect(to(go("/?stay=1", seen))).toBeNull();
  });
});

describe("the marker is a signpost, not a key", () => {
  it("does not let a signed-out browser past the gate", () => {
    // The whole point: it changes where you are sent, never what you see.
    const res = go("/admin", { [RETURNING]: "1" });
    expect(res.status).toBe(307);
    expect(to(res)).toBe("/login?next=%2Fadmin");
  });

  it("still answers an API caller with 401 rather than a redirect", () => {
    const res = go("/api/lobby/doc", { [RETURNING]: "1" });
    expect(res.status).toBe(401);
  });

  it("leaves the public screens alone", () => {
    expect(to(go("/lobby", { [RETURNING]: "1" }))).toBeNull();
    expect(to(go("/api/lobby/screen", { [RETURNING]: "1" }))).toBeNull();
  });
});

describe("signed in", () => {
  const live = { [SESSION]: "x", [RETURNING]: "1" };

  it("is taken off the landing page to their own home", () => {
    expect(to(go("/", live))).toBe("/home");
  });

  it("marks a browser that has a session but no marker yet", () => {
    const res = go("/home", { [SESSION]: "x" });
    expect(res.cookies.get(RETURNING)?.value).toBe("1");
  });
});
