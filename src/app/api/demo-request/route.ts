import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Demo requests from the landing page scheduler.
 *
 * These are the top of the sales pipeline — the whole point of the public
 * page — so they are written to the database and surface in the admin console
 * under Demo requests. Before the database is connected they are logged, and
 * the response says plainly that it was not stored, rather than pretending.
 */

type Body = {
  name?: string;
  email?: string;
  school?: string;
  phone?: string;
  requestedFor?: string;
  message?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!name) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "A valid email is required" }, { status: 400 });
  }

  const record = {
    name,
    email,
    schoolName: (body.school ?? "").trim() || null,
    phone: (body.phone ?? "").trim() || null,
    requestedFor: body.requestedFor ? new Date(body.requestedFor) : null,
    message: (body.message ?? "").trim() || null,
  };

  if (!isDatabaseConfigured()) {
    // Nothing to write to yet. Log it so it is at least recoverable from the
    // server output, and tell the caller the truth.
    console.warn("[demo-request] no database configured — not stored:", record);
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const created = await prisma.demoRequest.create({ data: record });
    return NextResponse.json({ ok: true, stored: true, id: created.id });
  } catch (err) {
    console.error("[demo-request] failed to store:", err);
    // The person booking should not see a failure for our storage problem —
    // the details are in the logs and the team can still be told.
    return NextResponse.json({ ok: true, stored: false });
  }
}
