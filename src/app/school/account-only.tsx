import { redirect } from "next/navigation";
import { safeAuth, isAuthConfigured } from "@/auth";
import { canRunOwnSchool } from "@/lib/access";

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
  if (!isAuthConfigured) return;
  const session = await safeAuth();
  if (!canRunOwnSchool(session?.user)) redirect("/school/programs");
}
