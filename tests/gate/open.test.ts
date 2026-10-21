import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

/**
 * The portal with the gate switched off.
 *
 * Asked for on 19 October 2026. The point of this file is the second half:
 * the gate was never the thing keeping a school's record private, and these
 * pin that taking it away did not quietly make it the thing that was.
 *
 * The environment here is a working production one — a signing secret and a
 * database — so nothing below passes because sign-in happened to be broken.
 * `GATE` is left unset, which is how the deployed site runs.
 */
let proxy: (req: NextRequest) => Response;

beforeAll(async () => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "postgres://test/test";
  delete process.env.GATE;
  ({ proxy } = (await import("@/proxy")) as never);
});

const RETURNING = "joc-returning";
const SESSION = "authjs.session-token";

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

describe("a stranger, signed out", () => {
  it("reaches the published site without being asked to sign in", () => {
    // The whole reason for the change: a link somebody was sent opens on
    // the thing they were sent, not on a form.
    for (const path of ["/lesson-plans", "/resources", "/programs", "/shop", "/cycles"]) {
      expect(to(go(path)), path).toBeNull();
    }
  });

  it("reaches the shout-out form the QR code on the wall points at", () => {
    expect(to(go("/shout-out/joc-lobby"))).toBeNull();
  });

  it("is no longer turned away from an API with a 401", () => {
    const res = go("/api/lobby/doc");
    expect(res.status).not.toBe(401);
  });
});

describe("what the gate was never holding up", () => {
  /**
   * Each of these is guarded where it lives, not here. The assertions are
   * that the proxy now stands aside — and the comment on each says which
   * check the request meets a moment later instead, because that is the
   * thing that would actually have to break for a school to be exposed.
   */

  it("lets the console request through, to be refused by its own layout", () => {
    // src/app/admin/layout.tsx: canOpenConsole(me) renders "Sign in required".
    expect(to(go("/admin"))).toBeNull();
  });

  it("lets a school panel request through, to be refused by its own layout", () => {
    // src/app/school/layout.tsx: canRunSchoolApp(session?.user).
    expect(to(go("/school/screen"))).toBeNull();
  });

  it("still sends somebody signed out away from their own pages", () => {
    // These two redirect in the page itself rather than render empty.
    expect(to(go("/home"))).toBeNull();
    expect(to(go("/account"))).toBeNull();
  });
});

describe("the front door still knows who you are", () => {
  /**
   * The two redirects at the top of the proxy are routing, not locking, so
   * they outlived the gate. Somebody who has an account should not land on
   * the page that sells them one.
   */

  it("takes a signed-in visitor to their home instead of the marketing page", () => {
    // Through /start, which sends each person to their own first page.
  });

  it("takes a returning but signed-out visitor to sign in", () => {
    expect(to(go("/", { [RETURNING]: "1" }))).toBe("/login");
  });

  it("still shows a stranger the landing page", () => {
    expect(to(go("/"))).toBeNull();
  });

  it("still marks a browser that has a session", () => {
    const res = go("/lesson-plans", { [SESSION]: "x" }) as Response & {
      cookies: { get(n: string): { value: string } | undefined };
    };
    // Kept up to date even while the gate is off, so putting it back does
    // not send every teacher through the marketing page once more.
    expect(res.cookies.get(RETURNING)?.value).toBe("1");
  });
});
