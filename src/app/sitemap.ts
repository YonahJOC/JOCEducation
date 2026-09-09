import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://education.justonechesed.org";

/**
 * The site runs as a hard gate: the educator landing page at `/` is the only
 * public route, so it is the only thing worth submitting to search engines.
 * If the gate is ever relaxed, restore the lesson, program and cycle routes here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
}
