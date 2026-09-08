import { NextRequest, NextResponse } from "next/server";
import { LESSONS } from "@/lib/lessons";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const grade = searchParams.get("grade");
  const time  = searchParams.get("time");

  let results = LESSONS;

  if (grade && grade !== "all") {
    results = results.filter((l) => l.grade === grade);
  }

  if (time && time !== "all") {
    if (time === "90") {
      results = results.filter((l) => l.time >= 90);
    } else {
      const t = parseInt(time, 10);
      if (!isNaN(t)) results = results.filter((l) => l.time === t);
    }
  }

  return NextResponse.json({ lessons: results, total: results.length });
}
