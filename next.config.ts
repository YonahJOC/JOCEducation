import type { NextConfig } from "next";

/**
 * One build-time setting, for one reason: the pooler.
 *
 * `next build` generates fifty-seven pages across seven workers, each with
 * its own Prisma client, and Supabase's pooler refuses some of the
 * connections. The queries behind that failure are wrapped in a catch that
 * returns an empty list — right at runtime, wrong at build time, because the
 * page is then baked with nothing in it and served that way until the next
 * deploy. The footer's Programs column is on every static page and is exactly
 * this query.
 *
 * A retry means a refused connection is asked again rather than quietly
 * becoming an empty page. It is a mitigation, not the fix: the fix is
 * `&connection_limit=1` on the pooled DATABASE_URL, which is an environment
 * variable rather than something this file can set.
 *
 * (staticGenerationMinPagesPerWorker was tried here and did not change the
 * worker count in this version, so it has been taken out rather than left
 * looking like it does something.)
 */
const nextConfig: NextConfig = {
  experimental: {
    staticGenerationRetryCount: 2,
  },
};

export default nextConfig;
