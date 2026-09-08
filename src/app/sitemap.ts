import type { MetadataRoute } from "next";
import { LESSONS } from "@/lib/lessons";
import { PROGRAMS } from "@/lib/programs";
import { CYCLES } from "@/lib/cycles";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://education.justonechesed.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const static_routes: MetadataRoute.Sitemap = [
    { url: BASE_URL,               lastModified: new Date(), changeFrequency: "weekly",  priority: 1 },
    { url: `${BASE_URL}/programs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/lesson-plans`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/resources`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/board`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/pricing`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/shop`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/login`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE_URL}/signup`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
  ];

  const lesson_routes: MetadataRoute.Sitemap = LESSONS.map((l) => ({
    url: `${BASE_URL}/lesson-plans/${l.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const program_routes: MetadataRoute.Sitemap = PROGRAMS.map((p) => ({
    url: `${BASE_URL}/programs/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const cycle_routes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/cycles`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    ...CYCLES.map((c) => ({
      url: `${BASE_URL}/cycles/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  return [...static_routes, ...lesson_routes, ...program_routes, ...cycle_routes];
}
