import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import { viewingAs } from "@/lib/school-scope";

/**
 * Who may be inside the school panel.
 *
 * Three kinds of person, and for a long time these guards knew about two.
 *
 * Whoever runs the school's account, and a teacher who runs its app, both
 * carry a schoolId — that is what every check here turned on. Somebody from
 * JOC looking in on a school carries none: they have a capability instead.
 * So "See their school panel" set its cookie, redirected to /school, and the
 * first guard on the page sent them to /home. The button worked perfectly and
 * the page it opened threw them out, which from the outside is a dead link.
 *
 * It only showed in production. In review mode `openForReview` returns early
 * and no guard below it ever runs, so every local test passed.
 *
 * `viewingAs()` is the right check rather than a capability test here: it
 * already requires the schools capability before it will return anything, and
 * it returns null the moment the cookie is dropped — so these stay closed to
 * everybody who has not deliberately opened a school.
 */

/** Pages about the account rather than the app: the plan, the teacher list. */
export async function requireAccountHolder(): Promise<void> {
  if (openForReview) return;
  if (await viewingAs()) return;
  const session = await safeAuth();
  if (!canRunOwnSchool(session?.user)) redirect("/school/programs");
}

/**
 * Anywhere inside the school panel at all.
 *
 * The layout already asks this, and every read underneath derives the school
 * from the session, so a page without it leaks nothing. It is here because
 * the layout is one edit away from being the only thing standing there, and
 * the admin pages all learned this lesson already.
 */
export async function requireSchoolPanel(): Promise<void> {
  if (openForReview) return;
  if (await viewingAs()) return;
  const session = await safeAuth();
  if (!canRunSchoolApp(session?.user)) redirect("/home");
}
