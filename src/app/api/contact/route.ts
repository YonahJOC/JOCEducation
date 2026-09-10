import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { sendContactMessage } from "@/lib/notify";

/**
 * The contact form.
 *
 * This route used to validate a message, log the sender's address, and
 * return success — the message itself went nowhere. Now it is stored first,
 * so nothing a school writes is lost, and emailed as well when mail is
 * switched on.
 */

type ContactPayload = {
  name?: string;
  school?: string;
  email?: string;
  role?: string;
  subject?: string;
  message?: string;
};

export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  const name = (body.name ?? "").trim() || "Someone";

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const emailed = await sendContactMessage({
    name,
    email,
    subject: body.subject ?? null,
    message,
  });

  if (!isDatabaseConfigured()) {
    console.warn("[contact] no database — message not stored:", { email, subject: body.subject });
    return NextResponse.json({ ok: true, stored: false, emailed });
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        schoolName: (body.school ?? "").trim() || null,
        role: (body.role ?? "").trim() || null,
        subject: (body.subject ?? "").trim() || null,
        message,
        emailed,
      },
    });
    return NextResponse.json({ ok: true, stored: true, emailed });
  } catch (err) {
    console.error("[contact] failed to store:", err);
    return NextResponse.json({ ok: true, stored: false, emailed });
  }
}
