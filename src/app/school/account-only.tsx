import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import { viewingAs } from "@/lib/school-scope";
import { sealDemo } from "@/lib/demo-school";

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
 *
 * ── The demo ───────────────────────────────────────────────────────────
 *
 * Every page in the school panel calls one of these two, so this is where
 * the demo portal is sealed. The default is closed: a page added next year
 * that guards itself the way every other one does is shut to a demo school
 * without anybody remembering to shut it. The two pages that *are* the demo
 * opt out by name with `{ demo: "allow" }`, which is a thing you have to
 * write down and can be read off a grep.
 *
 * The seal runs before the review-mode and looking-in escapes on purpose.
 * Somebody at JOC opening a demo school is asking what that school sees,
 * and an escape hatch here would answer with something nobody else gets.
 */

type Guard = {
  /** Set on the two pages that make up the demo portal, and nowhere else. */
  demo?: "allow";
};

/** Pages about the account rather than the app: the plan, the teacher list. */
export async function requireAccountHolder(opts: Guard = {}): Promise<void> {
  if (opts.demo !== "allow") await sealDemo();
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
export async function requireSchoolPanel(opts: Guard = {}): Promise<void> {
  if (opts.demo !== "allow") await sealDemo();
  if (openForReview) return;
  if (await viewingAs()) return;
  const session = await safeAuth();
  if (!canRunSchoolApp(session?.user)) redirect("/home");
}
