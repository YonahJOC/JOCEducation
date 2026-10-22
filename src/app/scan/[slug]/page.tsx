import { notFound, redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { readDoc } from "@/lib/lobby/store";
import { isLobby } from "@/lib/lobby/slug";
import { shortName } from "@/lib/school-screen/rules";
import { ScanLanding } from "@/components/scan/ScanLanding";

/**
 * Where the QR code on the lobby wall goes.
 *
 * A visitor standing in the building, holding a phone, with four things
 * they might want to do — of which one is built. The design for the rest
 * exists; see src/lib/scan/actions.ts for why they are not shown yet.
 *
 * The lobby only. A school's screen has the same kind of code on it and it
 * still goes to /shout-out/<school>: donations, swag and a marathon
 * sign-up have no business on a hallway wall in somebody else's building,
 * and a school's shout-out form asks for a school address, which this page
 * deliberately does not.
 */

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Just One Chesed",
  robots: { index: false, follow: false },
};

/**
 * The phone's own furniture, which the rest of the site never had to think
 * about because the rest of the site is cream.
 *
 *   themeColor    the bar above the page. Without it Android draws its
 *                 status bar white and Safari tints its chrome grey, and a
 *                 navy page gets a stripe of the wrong colour over it on
 *                 both. This is the "colours on Apple and Android" fix.
 *   viewportFit   lets the page reach under the notch and the home bar, so
 *                 the navy runs edge to edge. The padding that keeps
 *                 content out of them is in the component's own CSS.
 *   colorScheme   the site already declares this, and it is restated here
 *                 because this page is the one somebody opens on a phone
 *                 with auto-dark turned on.
 */
export const viewport = {
  themeColor: "#1E2A8C",
  viewportFit: "cover" as const,
  // "light", not "only light": the meta takes the same grammar as the CSS
  // property, so an older engine drops a value it cannot parse and the
  // page is left with no instruction at all. The stylesheet carries the
  // firmer form for everything that can read it.
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) notFound();

  // Anything that is not the lobby goes to the form it already had, rather
  // than to a page offering it things that are not its own.
  if (!isLobby(slug)) redirect(`/shout-out/${encodeURIComponent(slug)}`);

  const school = await prisma.school
    .findUnique({ where: { slug }, select: { name: true, screenShortName: true } })
    .catch(() => null);
  if (!school) notFound();

  // The same question the wall is showing. One source, so the phone cannot
  // ask something the screen beside it is not.
  const doc = await readDoc().catch(() => null);
  const question = doc?.settings.theme.question?.trim() || "What’s a chesed someone did for you this week?";

  return (
    <>
      {/* The design is set in Montserrat, which the rest of the site does
          not use. React hoists this into the head and it ships on this
          page alone. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap"
      />
    <ScanLanding
      question={question}
      slug={slug}
      shortName={shortName(school.name, school.screenShortName)}
    />
    </>
  );
}
