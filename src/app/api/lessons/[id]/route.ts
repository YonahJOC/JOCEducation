import { NextRequest, NextResponse } from "next/server";
import { LESSONS } from "@/lib/lessons";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lesson = LESSONS.find((l) => l.id === parseInt(id, 10));
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lesson);
}
