import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { readDoc, writeDoc } from "@/lib/lobby/store";

/**
 * The document the admin panel edits.
 *
 * The handoff guarded this with a shared team passcode. We have accounts, so
 * it is the `lobby` permission instead: one fewer secret to circulate, and
 * the row records who last changed it.
 */
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function editor() {
  const session = await safeAuth();
  const me = session?.user;
  // Before sign-in is configured the console is open for review, and this
  // endpoint has to agree with the page or the panel loads into an error.
  if (openForReview) return me ?? { id: null };
  return me?.id && can(me, "lobby") ? me : null;
}

export async function GET() {
  const me = await editor();
  if (!me) return json({ error: "not-allowed" }, 403);
  return json(await readDoc());
}

export async function PUT(req: Request) {
  const me = await editor();
  if (!me) return json({ error: "not-allowed" }, 403);

  let body: { baseVersion?: number; doc?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  if (typeof body.baseVersion !== "number") return json({ error: "bad-json" }, 400);

  const saved = await writeDoc(body.baseVersion, body.doc, me.id ?? null);

  // Somebody else saved first. Hand back the newer copy; the panel re-applies
  // this editor's change to it rather than losing it.
  if (!saved) return json({ error: "conflict", doc: await readDoc() }, 409);

  return json(saved);
}
