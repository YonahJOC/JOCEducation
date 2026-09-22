import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { verifyWebhook, isWebhookConfigured } from "@/lib/payments";

/**
 * Stripe telling us a payment went through.
 *
 * This is the only thing that marks anything paid. The success page a person
 * lands on after Checkout is not proof — it is a URL, and anybody can visit a
 * URL. Only a signed delivery from Stripe counts.
 *
 * Returns 200 on anything it has handled or deliberately ignored, so Stripe
 * stops retrying. It returns 400 only when the signature is wrong, which is
 * the one case where retrying is the right thing for Stripe to do.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isWebhookConfigured) {
    return NextResponse.json({ error: "Webhooks are not configured." }, { status: 503 });
  }

  // The raw body, byte for byte — the signature is over exactly these bytes,
  // so parsing it first and re-serialising would never match.
  const raw = await req.text();
  const check = await verifyWebhook(raw, req.headers.get("stripe-signature"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Unreadable." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Something we do not act on. Say so plainly rather than erroring.
    return NextResponse.json({ ignored: event.type ?? "unknown" });
  }

  const session = event.data?.object ?? {};
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const paymentRef = String(session.id ?? "");
  const amount = Number(session.amount_total ?? 0) || null;

  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true, note: "no database" });

  try {
    if (metadata.kind === "form" && metadata.responseId) {
      // updateMany rather than update: a repeat delivery of the same event
      // then does nothing instead of throwing, and Stripe does repeat.
      await prisma.formResponse.updateMany({
        where: { id: metadata.responseId },
        data: { paid: true, paymentRef, amountCents: amount },
      });
    } else if (metadata.kind === "order" && metadata.orderId) {
      // INVOICED, not a new PAID: its own definition is "invoice sent, or
      // payment received", and inventing a status the console cannot show
      // would make an order disappear from every filter.
      await prisma.order.updateMany({
        where: { id: metadata.orderId },
        data: { status: "INVOICED" as never },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Tell Stripe to try again — the payment is real and we failed to record it.
    return NextResponse.json({ error: "Could not record that." }, { status: 500 });
  }
}
