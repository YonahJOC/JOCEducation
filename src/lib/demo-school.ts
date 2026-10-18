import { cache } from "react";
import { redirect } from "next/navigation";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { currentSchoolId } from "@/lib/school-scope";

/**
 * The demo portal.
 *
 * A school being shown JOC for the first time does not get the portal with
 * most of it greyed out. It gets a smaller site: the hallway screen, and the
 * people who may sign in to work it. That is the whole thing. No Today, no
 * programs, no Cycle progress, no library, no plan and no seats, and no link
 * back out to the rest of joc — a door that opens onto a price list is not a
 * demo, it is a sales call the school did not agree to.
 *
 * Two rules make that true, and they are deliberately not the same rule:
 *
 *   The rail shows two items.            Nav is decoration. It is what makes
 *                                        the place feel like one site.
 *
 *   Every other page sends them back.    This is the actual restriction, and
 *                                        it runs on the server before a page
 *                                        renders. Typing the address of a
 *                                        page that is not on the list gets
 *                                        them the screen, same as clicking.
 *
 * Hiding a link is not access control, so nothing here relies on the rail.
 */

/** Where a demo school lands, and where everything else sends them. */
export const DEMO_HOME = "/school/screen";

/**
 * Every page a demo school may open.
 *
 * Exact paths, not prefixes, and the list is the spec: `demo-school.test.ts`
 * walks `src/app` and fails if a page exists that is neither on this list nor
 * sealed, so a page added next month cannot quietly widen the demo.
 *
 * `/account/password` is here because somebody issued a password has to be
 * able to change it, and `/login` because they have to be able to get in.
 */
export const DEMO_PAGES: readonly string[] = [
  "/school/screen",
  "/school/teachers",
  "/account/password",
  "/login",
  "/no-access",
];

/** Is this exact path open to a demo school? */
export function demoAllows(pathname: string): boolean {
  return DEMO_PAGES.includes(pathname);
}

/** Is a given school on the demo? One query per request, however often asked. */
export const schoolIsDemo = cache(async (schoolId: string | null): Promise<boolean> => {
  if (!schoolId || !isDatabaseConfigured()) return false;
  try {
    const s = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { demoAt: true },
    });
    return Boolean(s?.demoAt);
  } catch {
    // A database that cannot answer must not be read as "not a demo" and
    // quietly hand a school the whole site. Treat it as the demo: the worst
    // case is that a real school sees two pages until the database is back.
    return true;
  }
});

/**
 * Is *this request* looking at a demo school?
 *
 * View-aware: somebody at JOC looking in on a school sees what that school
 * sees, which is the only way to check the thing before sending it out.
 */
export async function onDemoPortal(): Promise<boolean> {
  return schoolIsDemo(await currentSchoolId());
}

/**
 * Is the signed-in person's *own* school a demo school?
 *
 * Deliberately ignores the look-in cookie. It is what pages outside /school
 * ask, so that a JOC staff member who left the cookie set is not thrown out
 * of their own console and home page.
 */
export async function ownSchoolIsDemo(): Promise<boolean> {
  const session = await safeAuth();
  return schoolIsDemo(session?.user?.schoolId ?? null);
}

/**
 * Refuse this page to a demo school.
 *
 * Call it as the first line of any page a demo school must not reach. It
 * throws the Next redirect, so nothing below it runs and no data for the
 * page is ever fetched, let alone sent.
 *
 * `scope: "site"` is for pages outside /school, which ask about the person's
 * own school rather than the one they may be looking in on.
 */
export async function sealDemo(scope: "school" | "site" = "school"): Promise<void> {
  const demo = scope === "site" ? await ownSchoolIsDemo() : await onDemoPortal();
  if (demo) redirect(DEMO_HOME);
}
