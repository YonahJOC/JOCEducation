import { NextRequest, NextResponse } from "next/server";

// Wire to an email service (Resend, SendGrid, etc.) once credentials are available.
// For now, validates and returns success so the UI flow is complete.

type ContactPayload = {
  name?: string;
  school?: string;
  email: string;
  role?: string;
  subject?: string;
  message: string;
};

export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email?.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // TODO: send email via Resend / SendGrid
  // await resend.emails.send({
  //   from: "noreply@education.justonechesed.org",
  //   to: ["info@justonechesed.org"],
  //   subject: `JOC Education contact: ${body.subject ?? "general"}`,
  //   html: `<p>From: ${body.name} &lt;${body.email}&gt;</p><p>School: ${body.school}</p><p>Role: ${body.role}</p><p>${body.message}</p>`,
  // });

  console.log("[contact]", { email: body.email, subject: body.subject });

  return NextResponse.json({ ok: true });
}
