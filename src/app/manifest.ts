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
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Lesson Plans", url: "/lesson-plans", description: "Browse all chesed lesson plans" },
      { name: "Programs", url: "/programs", description: "JOC chesed programs for schools" },
      { name: "Resources", url: "/resources", description: "Free chesed education resources" },
    ],
  };
}
