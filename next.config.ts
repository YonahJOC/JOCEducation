import type { NextConfig } from "next";

/**
 * Two build-time settings, for two different problems.
 *
 * **The pooler.** `next build` generates fifty-seven pages across seven
 * workers, each with its own Prisma client, and Supabase's pooler refuses
 * some of the connections. The queries behind that failure are wrapped in a
 * catch that returns an empty list — right at runtime, wrong at build time,
 * because the page is then baked with nothing in it and served that way until
 * the next deploy. The footer's Programs column is on every static page and
 * is exactly this query.
 *
 * A retry means a refused connection is asked again rather than quietly
 * becoming an empty page. It is a mitigation, not the fix: the fix is
 * `&connection_limit=1` on the pooled DATABASE_URL, which is an environment
 * variable rather than something this file can set.
 *
 * (staticGenerationMinPagesPerWorker was tried here and did not change the
 * worker count in this version, so it has been taken out rather than left
 * looking like it does something.)
 *
 * **Function storage.** Twenty-one routes are force-dynamic, so twenty-one
 * serverless functions get built, and Next traces a copy of everything each
 * one imports into it. Prisma's query engine is about twenty megabytes, so
 * that is roughly half a gigabyte per deployment before a line of our own
 * code — and Vercel counts every deployment it is still keeping, which is how
 * a free tier's ten gigabytes disappears.
 *
 * The engines below are the ones that cannot possibly run on Vercel: it is
 * Linux, so the Windows and macOS builds are dead weight in every single
 * function. Excluding them is safe because nothing there can load them, and
 * it is the difference between a deployment costing half a gig and costing a
 * fraction of it. The Linux engine is deliberately NOT excluded — that one is
 * the one that runs.
 */
const nextConfig: NextConfig = {
  experimental: {
    staticGenerationRetryCount: 2,
  },

  outputFileTracingExcludes: {
    "*": [
      // Engines for platforms Vercel is not.
      "**/node_modules/.prisma/client/*windows*",
      "**/node_modules/.prisma/client/*darwin*",
      "**/node_modules/@prisma/engines/*windows*",
      "**/node_modules/@prisma/engines/*darwin*",
      // Leftovers from an interrupted `prisma generate`. They are whole
      // copies of the engine and have been seen to reach 250MB.
      "**/node_modules/.prisma/client/*.tmp*",
      // The schema engine is a migration tool. Migrations do not run inside
      // a request, so it has no business in a function bundle.
      "**/node_modules/@prisma/engines/schema-engine*",
      "**/node_modules/prisma/build/**",
      // Reference material, not code. Two of these are over a megabyte of
      // base64 images.
      "design/**",
      "**/*.md",
    ],
  },
};

export default nextConfig;
