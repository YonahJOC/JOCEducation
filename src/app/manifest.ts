import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JOC Education",
    short_name: "JOC Education",
    description: "Educating Towards Chesed — Just One Student at a Time.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF9F4",
    theme_color: "#10233F",
    orientation: "portrait",
    categories: ["education", "lifestyle"],
    icons: [
      { src: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { src: "/icon.png", sizes: "64x64", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      // Android cuts an installed icon to a circle or squircle. Without a
      // maskable version it shrinks the icon inside a white blob instead.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Lesson Plans", url: "/lesson-plans", description: "Browse all chesed lesson plans" },
      { name: "Programs", url: "/programs", description: "JOC chesed programs for schools" },
      { name: "Resources", url: "/resources", description: "Free chesed education resources" },
    ],
  };
}
