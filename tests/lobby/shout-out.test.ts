import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Who may send a shout-out, and to which wall.
 *
 * The lobby asks for no account: the people in front of that screen are
 * visitors in JOC's building, not students with school logins. A school
 * still asks for one, and still asks for the school's own address when the
 * school has named one — thirty screens run on that rule and none of them
 * changed.
 *
 * The half of this that matters is the second describe block. Opening one
 * door must not have opened the others.
 */

let session: { user: { id: string; email: string } } | null = null;
let pendingForAuthor = 0;
let pendingForSchool = 0;
const created: Record<string, unknown>[] = [];

const SCHOOLS: Record<string, { id: string; screenEmailDomains: string[] }> = {
  "joc-lobby": { id: "lobby-id", screenEmailDomains: [] },
  haftr: { id: "haftr-id", screenEmailDomains: ["haftr.org"] },
  // A school that never named a domain: any school account may post, but it
  // is still an account. This one used to produce "(@undefined)".
  openschool: { id: "open-id", screenEmailDomains: [] },
};

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/auth", () => ({ safeAuth: async () => session, openForReview: false }));
vi.mock("@/lib/files", () => ({ putFile: async () => ({ id: "f" }) }));

vi.mock("@/lib/prisma", () => ({
  isDatabaseConfigured: () => true,
  prisma: {
    school: { findUnique: async ({ where }: { where: { slug: string } }) => SCHOOLS[where.slug] ?? null },
    shoutOut: {
      count: async ({ where }: { where: { authorId?: string; schoolId?: string } }) =>
        where.authorId ? pendingForAuthor : pendingForSchool,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: "new-id" };
      },
    },
  },
}));

const { submitShoutOut } = await import("@/app/actions/school-screen");

function send(slug: string, over: Record<string, string> = {}) {
  const f = new FormData();
  const fields: Record<string, string> = {
    slug,
    text: "Thank you for carrying the boxes in from the car with me.",
    firstName: "Rivka",
    lastName: "L",
    grade: "9th",
    showName: "1",
    ...over,
  };
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return submitShoutOut(f);
}

beforeEach(() => {
  session = null;
  pendingForAuthor = 0;
  pendingForSchool = 0;
  created.length = 0;
});

describe("the lobby wall, from a visitor's phone", () => {
  it("takes a shout-out from somebody with no account at all", async () => {
    expect(await send("joc-lobby")).toEqual({ ok: true, id: "new-id" });
  });

  it("asks for no grade, because a visitor is not in one", async () => {
    await send("joc-lobby", { grade: "" });
    expect(created[0].grade).toBe("");
  });

  it("ignores a grade sent anyway rather than printing it on the wall", async () => {
    await send("joc-lobby", { grade: "11th" });
    expect(created[0].grade).toBe("");
  });

  it("stores no author and no address when there is nobody to store", async () => {
    await send("joc-lobby");
    expect(created[0].authorId).toBeNull();
    expect(created[0].authorEmail).toBe("");
  });

  it("still goes up for approval rather than onto the wall", async () => {
    await send("joc-lobby");
    // status is left to the column default, which is PENDING.
    expect(created[0]).not.toHaveProperty("status");
  });

  it("still holds everyone to the same shout-out itself", async () => {
    const res = await send("joc-lobby", { text: "thanks" });
    expect(res).toEqual({ ok: false, error: "Say a little more: who, and what they did." });
  });

  it("asks somebody to come back when the queue is already deep", async () => {
    // Not a wall problem — a person reads every one of these — but nobody
    // reads a hundred, so the real ones would be lost among them.
    pendingForSchool = 60;
    const res = await send("joc-lobby");
    expect(res.ok).toBe(false);
    expect(created).toHaveLength(0);
  });

  it("counts a signed-in sender against their own five, not the queue", async () => {
    session = { user: { id: "u1", email: "someone@justonechesed.org" } };
    pendingForAuthor = 5;
    pendingForSchool = 0;
    expect((await send("joc-lobby")).ok).toBe(false);
  });
});

describe("a school's wall, which did not change", () => {
  it("turns away somebody signed out", async () => {
    const res = await send("haftr");
    expect(res).toEqual({ ok: false, error: "Sign in with your school email first." });
    expect(created).toHaveLength(0);
  });

  it("turns away an account from the wrong domain", async () => {
    session = { user: { id: "u2", email: "someone@gmail.com" } };
    const res = await send("haftr");
    expect(res).toEqual({ ok: false, error: "Sign in with your school email (@haftr.org)." });
  });

  it("takes one from the school's own domain", async () => {
    session = { user: { id: "u3", email: "student@haftr.org" } };
    expect((await send("haftr")).ok).toBe(true);
    expect(created[0].authorEmail).toBe("student@haftr.org");
  });

  it("still requires a grade", async () => {
    session = { user: { id: "u3", email: "student@haftr.org" } };
    const res = await send("haftr", { grade: "" });
    expect(res).toEqual({ ok: false, error: "Which grade are you in?" });
  });

  it("still holds a signed-in student to five waiting", async () => {
    session = { user: { id: "u3", email: "student@haftr.org" } };
    pendingForAuthor = 5;
    expect((await send("haftr")).ok).toBe(false);
  });

  it("does not let a school with no named domain in without an account", async () => {
    // An empty domain list means "any school account", never "anybody".
    const res = await send("openschool");
    expect(res).toEqual({ ok: false, error: "Sign in with your school email first." });
  });

  it("says something sensible when that school refuses an outside address", async () => {
    // emailAllowed lets any signed-in address through an empty list, so this
    // is really pinning that the message never reads "(@undefined)".
    session = { user: { id: "u4", email: "a@b.com" } };
    const res = await send("openschool");
    expect(res.ok).toBe(true);
  });

  it("still refuses a wall that does not exist", async () => {
    expect(await send("not-a-school")).toEqual({ ok: false, error: "That school isn't on JOC." });
  });
});
