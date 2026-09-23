import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";

/**
 * Pages inside the school panel that are about the account rather than the app.
 *
 * The layout lets two kinds of person in: whoever runs the school's account,
 * and a teacher who runs its app. The sidebar shows each of them the right
 * things — but a hidden link is not a closed door, and the plan and the
 * teacher list were reachable by typing the address.
 *
 * Every page that is not the app's calls this.
 */
export async function requireAccountHolder(): Promise<void> {
  if (openForReview) return;
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
  const session = await safeAuth();
  if (!canRunSchoolApp(session?.user)) redirect("/home");
}
