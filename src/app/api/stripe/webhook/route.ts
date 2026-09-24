import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { verifyWebhook, isWebhookConfigured } from "@/lib/payments";
import { schoolYear } from "@/lib/app-flags";

/**
 * Stripe telling us money moved.
 *
 * This is the only thing that marks anything paid. The success page a person
 * lands on after Checkout is not proof — it is a URL, and anybody can visit a
 * URL. Only a signed delivery from Stripe counts.
 *
 * Four events, and each one writes the same two things: the state of the
 * thing that was bought, and a `Payment` row. The Payment row is what the
 * Money tab reads, so a fee that only flipped a boolean was money the console
 * could never account for.
 *
 * Returns 200 on anything it has handled or deliberately ignored, so Stripe
 * stops retrying. It returns 400 only when the signature is wrong and 500
 * when a real payment failed to record, which are the two cases where a
 * retry is the right thing for Stripe to do.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Everything this endpoint acts on. Anything else is answered and dropped. */
const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "charge.refunded",
]);

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

  const type = event.type ?? "unknown";
  if (!HANDLED.has(type)) {
    // Something we do not act on. Say so plainly rather than erroring, so a
    // subscription added in the dashboard ahead of its handler is harmless.
    return NextResponse.json({ ignored: type });
  }

  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true, note: "no database" });

  const object = event.data?.object ?? {};

  try {
    if (type === "charge.refunded") {
      await recordRefund(object);
    } else if (type === "checkout.session.async_payment_failed") {
      await unmarkPaid(object);
    } else {
      await recordPaid(object);
    }
    return NextResponse.json({ ok: true, handled: type });
  } catch {
    // Tell Stripe to try again — the money is real and we failed to record it.
    return NextResponse.json({ error: "Could not record that." }, { status: 500 });
  }
}

/**
 * A Checkout session that has been paid for.
 *
 * Shared by `completed` and `async_payment_succeeded`, because a bank debit
 * clearing four days later is the same fact arriving late, and a school whose
 * payment cleared slowly should not read as unpaid forever.
 */
async function recordPaid(session: Record<string, unknown>) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const sessionId = String(session.id ?? "");
  const amount = Number(session.amount_total ?? 0) || 0;
  const charge = typeof session.payment_intent === "string" ? session.payment_intent : null;

  if (metadata.kind === "form" && metadata.responseId) {
    // updateMany rather than update: a repeat delivery of the same event then
    // does nothing instead of throwing, and Stripe does repeat.
    await prisma.formResponse.updateMany({
      where: { id: metadata.responseId },
      data: { paid: true, paymentRef: sessionId, amountCents: amount },
    });

    // Which school, and which program's fee this was. Both come from the
    // response rather than the metadata, because the metadata is written by
    // us and the response is the record.
    const response = await prisma.formResponse.findUnique({
      where: { id: metadata.responseId },
      select: {
        schoolId: true,
        form: { select: { programs: { select: { id: true }, take: 1 } } },
      },
    });

    if (response?.schoolId && amount > 0) {
      await upsertPayment({
        schoolId: response.schoolId,
        programId: response.form?.programs[0]?.id ?? null,
        kind: "PROGRAM_FEE",
        amountCents: amount,
        chargeId: charge ?? sessionId,
        formResponseId: metadata.responseId,
      });
    }
    return;
  }

  if (metadata.kind === "order" && metadata.orderId) {
    // INVOICED, not a new PAID: its own definition is "invoice sent, or
    // payment received", and inventing a status the console cannot show would
    // make an order disappear from every filter.
    await prisma.order.updateMany({
      where: { id: metadata.orderId },
      data: { status: "INVOICED" as never },
    });

    const order = await prisma.order.findUnique({
      where: { id: metadata.orderId },
      select: { schoolId: true },
    });

    if (order?.schoolId && amount > 0) {
      await upsertPayment({
        schoolId: order.schoolId,
        // Shop money belongs to no program, and attributing it to one would
        // put a mug on a program's books.
        programId: null,
        kind: "SHOP",
        amountCents: amount,
        chargeId: charge ?? sessionId,
        orderId: metadata.orderId,
      });
    }
  }
}

/**
 * A delayed payment that bounced.
 *
 * The registration stays: somebody filled it in and we should chase them, not
 * delete them. What goes is the claim that they paid.
 */
async function unmarkPaid(session: Record<string, unknown>) {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  if (metadata.kind !== "form" || !metadata.responseId) return;

  await prisma.formResponse.updateMany({
    where: { id: metadata.responseId },
    data: { paid: false, paymentRef: null },
  });

  // And the Payment row, if the optimistic one ever landed.
  await prisma.payment.deleteMany({
    where: { formResponseId: metadata.responseId, kind: "PROGRAM_FEE" },
  });
}

/**
 * Money going back.
 *
 * Its own row, negative, pointing at what it refunds — never an edit to the
 * original and never netted off a total. A total that quietly absorbs a
 * refund stops being a number anybody trusts.
 */
async function recordRefund(charge: Record<string, unknown>) {
  const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  const chargeId = String(charge.id ?? "");
  const refunded = Number(charge.amount_refunded ?? 0) || 0;
  if (refunded <= 0) return;

  // What it refunds. Without the original we do not know whose money it was,
  // and a refund attributed to the wrong school is worse than none recorded.
  const original = await prisma.payment.findFirst({
    where: {
      OR: [
        intent ? { stripePaymentIntentId: intent } : {},
        { stripeChargeId: chargeId },
        intent ? { stripeChargeId: intent } : {},
      ].filter((w) => Object.keys(w).length > 0),
      kind: { in: ["PROGRAM_FEE", "PLAN", "SHOP"] },
    },
    select: { id: true, schoolId: true, programId: true },
  });

  if (!original) return;

  const already = await prisma.payment.findFirst({
    where: { refundOfId: original.id, kind: "REFUND" },
    select: { id: true },
  });
  if (already) return;

  await prisma.payment.create({
    data: {
      schoolId: original.schoolId,
      programId: original.programId,
      kind: "REFUND",
      amountCents: -Math.abs(refunded),
      paidAt: new Date(),
      schoolYear: schoolYear(),
      refundOfId: original.id,
      reason: "Refunded through Stripe.",
    },
  });
}

/**
 * One payment, written once however many times Stripe delivers the event.
 *
 * The charge id is unique in the schema, so a repeat delivery would throw
 * rather than double-count. Checking first keeps the endpoint answering 200,
 * which is what stops Stripe retrying.
 */
async function upsertPayment(input: {
  schoolId: string;
  programId: number | null;
  kind: "PROGRAM_FEE" | "SHOP";
  amountCents: number;
  chargeId: string;
  formResponseId?: string;
  orderId?: string;
}) {
  const existing = await prisma.payment.findFirst({
    where: { stripeChargeId: input.chargeId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.payment.create({
    data: {
      schoolId: input.schoolId,
      programId: input.programId ?? undefined,
      kind: input.kind,
      amountCents: input.amountCents,
      paidAt: new Date(),
      schoolYear: schoolYear(),
      stripeChargeId: input.chargeId,
      formResponseId: input.formResponseId,
      orderId: input.orderId,
      // recordedById stays null: nobody typed this in, Stripe told us.
    },
  });
}
