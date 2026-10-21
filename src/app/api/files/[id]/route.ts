import { NextResponse } from "next/server";
import { safeAuth, openForReview } from "@/auth";
import { can, hasSiteAccess } from "@/lib/access";
import { readFile } from "@/lib/files";
import { prisma } from "@/lib/prisma";

/**
 * Downloads for teaching materials — and the schools' student lists.
 *
 * The gate in proxy.ts only checks that a session cookie exists, so this
 * route does the real check: a file is subscriber content and is served only
 * to someone whose access is live. Nothing here is guessable from outside —
 * ids are cuids — but access is enforced rather than assumed.
 *
 * Student lists are stored in the same place and come out through this same
 * route, and they carry children's names. A live subscription is not enough
 * for one of those: it goes only to JOC staff who look after schools, or to
 * somebody at the school it belongs to. Everything else — worksheets, PDFs —
 * is for any subscriber, as before.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!openForReview) {
    const session = await safeAuth();
    const me = session?.user;
    if (!me) {
      return NextResponse.json({ error: "Sign in to download this." }, { status: 401 });
    }
    if (!hasSiteAccess(me)) {
      return NextResponse.json({ error: "Your account does not have access to the library." }, { status: 403 });
    }

    // Is this file somebody's student list? A lookup that fails is treated
    // as a yes with no school, so it refuses rather than serving a list by
    // accident.
    const lists = await prisma.studentListFile
      .findMany({ where: { fileId: id }, select: { schoolId: true } })
      .catch(() => null);
    if (lists === null || lists.length > 0) {
      const mine = Boolean(me.schoolId) && (lists ?? []).some((l) => l.schoolId === me.schoolId);
      if (!can(me, "schools") && !mine) {
        return NextResponse.json({ error: "That file belongs to another school." }, { status: 403 });
      }
    }
  }

  const file = await readFile(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = new Uint8Array(file.data);
  // Text without a charset is decoded as Latin-1 by browsers, which turns
  // every em dash in a source sheet into mojibake.
  const contentType = file.mimeType.startsWith("text/")
    ? `${file.mimeType}; charset=utf-8`
    : file.mimeType;

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.size),
      // inline so a PDF opens in the browser; the filename is still offered
      // if the teacher chooses to save it.
      "Content-Disposition": `inline; filename="${file.name.replace(/"/g, "")}"`,
      // Subscriber content: never cached by a shared proxy.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
