import { NextResponse } from "next/server";
import { safeAuth, isAuthConfigured } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { readFile } from "@/lib/files";

/**
 * Downloads for teaching materials.
 *
 * The gate in proxy.ts only checks that a session cookie exists, so this
 * route does the real check: a file is subscriber content and is served only
 * to someone whose access is live. Nothing here is guessable from outside —
 * ids are cuids — but access is enforced rather than assumed.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (isAuthConfigured) {
    const session = await safeAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to download this." }, { status: 401 });
    }
    if (!hasSiteAccess(session.user)) {
      return NextResponse.json({ error: "Your account does not have access to the library." }, { status: 403 });
    }
  }

  const file = await readFile(id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = new Uint8Array(file.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": file.mimeType,
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
