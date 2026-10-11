import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { readFile } from "@/lib/files";
import { safeAuth } from "@/auth";
import { isScreenStaff, screenRoleFor } from "@/lib/school-screen/access";

/**
 * A picture on a school screen, for a TV that cannot sign in.
 *
 * The site's own file route asks for a session with library access, and
 * rightly — most stored files are subscriber material. This one serves a
 * file to anybody only while it is on a wall: an approved photo with
 * consent, or the picture on an approved flyer.
 *
 * Anything still waiting — a pending upload, a rejected one — is served only
 * to somebody who can manage that school's screen, so the teacher deciding
 * on it can see it. Everyone else gets a 404, however they came by the id.
 */
export const dynamic = "force-dynamic";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured() || !/^[a-z0-9]{10,40}$/i.test(id)) return notFound();

  const [photos, flyers] = await Promise.all([
    prisma.screenPhoto.findMany({
      where: { imageId: id },
      select: { schoolId: true, status: true, consent: true },
    }).catch(() => []),
    prisma.screenFlyer.findMany({
      where: { imageId: id },
      select: { schoolId: true, status: true },
    }).catch(() => []),
  ]);
  if (photos.length === 0 && flyers.length === 0) return notFound();

  const onWall =
    photos.some((p) => p.status === "APPROVED" && p.consent) ||
    flyers.some((f) => f.status === "APPROVED");

  if (!onWall && !(await mayPreview(photos, flyers))) return notFound();

  const file = await readFile(id);
  if (!file || !IMAGE_TYPES.has(file.mimeType)) return notFound();

  return new Response(new Uint8Array(file.data), {
    headers: {
      "content-type": file.mimeType,
      "content-length": String(file.size),
      // Short, and private while it is not on a wall: a picture taken down
      // should leave every screen within minutes.
      "cache-control": onWall ? "public, max-age=300" : "private, no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex",
    },
  });
}

async function mayPreview(
  photos: { schoolId: string }[],
  flyers: { schoolId: string | null }[],
): Promise<boolean> {
  const session = await safeAuth();
  const user = session?.user;
  if (isScreenStaff(user)) return true;
  if (!user?.id) return false;
  const schools = new Set<string>([
    ...photos.map((p) => p.schoolId),
    ...flyers.map((f) => f.schoolId).filter((s): s is string => Boolean(s)),
  ]);
  for (const schoolId of schools) {
    if (await screenRoleFor(user, schoolId)) return true;
  }
  return false;
}

function notFound() {
  return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
}
