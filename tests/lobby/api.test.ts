import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyDoc } from "@/lib/lobby/config";
import type { LobbyDoc } from "@/lib/lobby/types";

/**
 * The save endpoint's rules, which are the ones worth guarding: a screen that
 * asks before anything is saved gets an empty schedule rather than an error,
 * somebody without the permission cannot write, two people editing at once
 * cannot overwrite each other, and a TV that already has the latest gets a
 * 304 instead of the whole document every minute.
 *
 * The store and the session are stubbed; everything else is the real route.
 */

let stored: LobbyDoc | null = null;
let allowed = true;

vi.mock("@/lib/lobby/store", async () => {
  const { emptyDoc: empty, sanitizeDoc } = await import("@/lib/lobby/config");
  return {
    readDoc: async () => (stored ? sanitizeDoc(stored) : empty()),
    writeDoc: async (baseVersion: number, incoming: unknown) => {
      const current = stored ? sanitizeDoc(stored) : empty();
      if (baseVersion !== current.version) return null;
      const next = sanitizeDoc(incoming);
      next.version = current.version + 1;
      next.updatedAt = new Date().toISOString();
      stored = next;
      return next;
    },
  };
});

vi.mock("@/auth", () => ({
  safeAuth: async () => (allowed ? { user: { id: "u1", email: "someone@justonechesed.org" } } : null),
  openForReview: false,
}));

vi.mock("@/lib/access", () => ({ can: () => allowed }));

const { GET: display } = await import("@/app/api/lobby/display/route");
const { PUT: putDoc } = await import("@/app/api/lobby/doc/route");

const req = (init: RequestInit = {}) => new Request("http://x/api/lobby/display", init);
const put = (baseVersion: number, doc: LobbyDoc) =>
  new Request("http://x/api/lobby/doc", {
    method: "PUT",
    body: JSON.stringify({ baseVersion, doc }),
  });

beforeEach(() => {
  stored = null;
  allowed = true;
});

describe("the lobby endpoints", () => {
  it("serves an empty schedule before anything is saved", async () => {
    const r = await display(req());
    expect(r.status).toBe(200);
    expect((await r.json()).programs).toEqual([]);
  });

  it("refuses an edit from somebody without the lobby permission", async () => {
    allowed = false;
    expect((await putDoc(put(0, emptyDoc()))).status).toBe(403);
  });

  it("saves, bumps the version, and refuses a stale save with the newer copy", async () => {
    const doc = {
      ...emptyDoc(),
      counters: { ...emptyDoc().counters, values: { acts: 1, beds: 2, challahs: 3, pizzas: 4 } },
    };

    const first = await putDoc(put(0, doc));
    expect(first.status).toBe(200);
    expect((await first.json()).version).toBe(1);

    // Somebody else saved in between: this one quoted version 0 and is refused.
    const second = await putDoc(put(0, doc));
    expect(second.status).toBe(409);
    expect((await second.json()).doc.version).toBe(1);
  });

  it("answers 304 when a screen already has the latest", async () => {
    await putDoc(put(0, emptyDoc()));
    const first = await display(req());
    const etag = first.headers.get("etag")!;
    const again = await display(req({ headers: { "if-none-match": etag } }));
    expect(again.status).toBe(304);
  });
});
