import { NextRequest, NextResponse } from "next/server";
import { PROGRAMS } from "@/lib/programs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const available = searchParams.get("available");

  let programs = PROGRAMS;

  if (tag) {
    programs = programs.filter((p) => p.tag.toLowerCase() === tag.toLowerCase());
  }
  if (available === "true") {
    programs = programs.filter((p) => p.available);
  }

  return NextResponse.json(
    programs.map((p) => ({
      slug: p.slug,
      name: p.name,
      tag: p.tag,
      tagline: p.tagline,
      description: p.description,
      available: p.available,
      heroColor: p.heroColor,
    }))
  );
}
