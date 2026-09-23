"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { runAppSync, isAppConnected } from "@/lib/app-sync";

/**
 * Read the JOC App now, by hand.
 *
 * The scheduled run is the normal path. This exists because a scheduled job
 * nobody can trigger is a job nobody can test: the first time anybody would
 * have learned the connection was wrong is when a figure quietly failed to
 * appear, hours later, with no way to ask why.
 */

export async function syncAppNow(): Promise<
  { ok: true; rows: number; unmatched: number } | { ok: false; error: string }
> {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "app_activity")) {
    return { ok: false, error: "Your admin type does not include JOC App activity." };
  }
  if (!isAppConnected) {
    return {
      ok: false,
      error: "The JOC App is not connected yet — JOC_APP_API_URL and JOC_APP_API_KEY are not set.",
    };
  }

  const r = await runAppSync();
  if (!r.ok) return { ok: false, error: r.error ?? "The sync failed." };

  revalidatePath("/admin/programs/joc-app");
  revalidatePath("/admin/schools/status");
  return { ok: true, rows: r.rows, unmatched: r.unmatched };
}
