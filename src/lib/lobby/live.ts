/**
 * Hours of chesed, from the app itself.
 *
 * The counter on the wall was typed in — 250,000, a number with no source
 * anybody could point at. The app already answers it: every organisation's
 * public dashboard carries `spendTimeByAll`, the hours logged across all of
 * them, and Just One Chesed is organisation 1. That is the figure the
 * 250,000 was approximating all along, so this is the same number with a
 * provenance rather than a different one.
 *
 * Deliberately not summed from our own AppSchoolStats rows. Those cover the
 * thirty-odd schools this portal happens to track and last synced whenever
 * the nightly job last ran — adding them up gave 177,708, which is neither
 * what the app says nor what the schools' own screens show.
 *
 * Read from the public endpoint, so no token and nothing about any child:
 * the response also carries a recently-active student's initials and grade,
 * and none of that is touched here.
 */

/** The app's own API. The same host scripts/app-sync.mjs reads. */
const BASE = "https://api.justonechesed.org";

/**
 * Just One Chesed's own organisation.
 *
 * Any organisation's dashboard carries the same `spendTimeByAll`, but JOC's
 * own is the one to ask: a school could leave, and the wall would then be
 * quoting a number through somebody else's account.
 */
const JOC_ORG = process.env.JOC_APP_ORG_ID?.trim() || "1";

/** How long a figure on a wall may be stale. The TVs poll every minute. */
const TTL_SECONDS = 900;

export type LiveTotals = {
  /** Hours logged across every organisation on the app. */
  hours: number | null;
  /** When this was read, ISO. */
  readAt: string | null;
};

export const NO_TOTALS: LiveTotals = { hours: null, readAt: null };

export async function liveTotals(): Promise<LiveTotals> {
  try {
    const res = await fetch(`${BASE}/organisations/${JOC_ORG}/publicDashboard`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      // Cached between requests, so forty televisions polling every minute
      // are one call to the app every quarter of an hour.
      next: { revalidate: TTL_SECONDS },
    });
    if (!res.ok) return NO_TOTALS;

    const d = (await res.json()) as { spendTimeByAll?: unknown };
    const hours = Number(d?.spendTimeByAll);

    // A zero here means the app answered but had nothing to say, which on a
    // wall is indistinguishable from a broken endpoint. Treat it as neither.
    if (!Number.isFinite(hours) || hours <= 0) return NO_TOTALS;

    return { hours: Math.round(hours), readAt: new Date().toISOString() };
  } catch {
    // The tile shows a dash. A screen that goes blank because the app
    // blinked is worse than one that admits it does not know.
    return NO_TOTALS;
  }
}

/** Part of the display route's ETag, so a new figure is not held behind a 304. */
export function liveTag(t: LiveTotals): string {
  return String(t.hours ?? "-");
}

/** One school's figures, as the app reports them. */
export type SchoolFigure = { name: string; acts: number; hours: number };

/**
 * Every school's figures, read from the app at render.
 *
 * These used to come off AppSchoolStats, our own table, filled by a nightly
 * job. The job needs CRON_SECRET; without it the route answers 503 to a cron
 * log nobody reads, and that is how the wall spent twenty-five days showing
 * September's numbers while the app had October's. A cache whose staleness is
 * invisible is worse than no cache.
 *
 * So the wall asks the app directly, school by school, exactly as the nightly
 * job does — `opportunitiesCount` and `spendTimeByOrganization` off each
 * school's own public dashboard, neither adjusted. Next caches each response
 * for the same quarter of an hour as the total above, so forty televisions
 * polling every minute cost the app two calls per school per hour.
 *
 * Returns null if nothing answered at all, so the caller can fall back to the
 * table rather than put an empty ticker on a wall.
 */
export async function liveSchools(
  schools: { name: string; appSchoolId: string | null }[],
): Promise<SchoolFigure[] | null> {
  const asked = schools.filter((s) => s.appSchoolId);
  if (asked.length === 0) return null;

  const results = await Promise.all(
    asked.map(async (s) => {
      try {
        const res = await fetch(`${BASE}/organisations/${s.appSchoolId}/publicDashboard`, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(8000),
          next: { revalidate: TTL_SECONDS },
        });
        if (!res.ok) return null;
        const d = (await res.json()) as {
          opportunitiesCount?: unknown;
          spendTimeByOrganization?: unknown;
        };
        const acts = Number(d?.opportunitiesCount);
        const hours = Number(d?.spendTimeByOrganization);
        if (!Number.isFinite(acts) || !Number.isFinite(hours)) return null;
        return { name: s.name, acts: Math.max(0, Math.round(acts)), hours: Math.max(0, Math.round(hours)) };
      } catch {
        return null;
      }
    }),
  );

  const ok = results.filter((r): r is SchoolFigure => r !== null);
  // A handful failing is a blip and the rest still belong on the wall. Every
  // one failing is the app being down, and then the table is the better
  // answer than a ticker with nothing in it.
  return ok.length === 0 ? null : ok;
}
