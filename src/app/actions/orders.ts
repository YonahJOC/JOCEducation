"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageAccounts } from "@/lib/access";
import { sendEmail, emailShell, siteUrl } from "@/lib/email";
import { JOC_INBOX } from "@/lib/notify";

/**
 * Placing an order.
 *
 * Card payment is not connected, and a school buying from JOC uses a purchase
 * order anyway. What matters is that the order exists somewhere JOC can see
 * it — the shop used to open a mail client, which loses the order entirely if
 * the school has no mail client set up, and leaves no record either way.
 *
 * Prices are read from the database here, never from the browser: a total the
 * page sent could say anything.
 */

export type PlaceResult =
  | { ok: true; id: string; emailed: boolean }
  | { ok: false; error: string };

export async function placeOrder(input: {
  items: { productId: string; quantity: number }[];
  contactName: string;
  contactEmail: string;
  phone?: string;
  schoolName: string;
  address?: string;
  poNumber?: string;
  notes?: string;
}): Promise<PlaceResult> {
  const contactName = input.contactName.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const schoolName = input.schoolName.trim();

  if (!contactName) return { ok: false, error: "Please give a name we can reply to." };
  if (!contactEmail.includes("@")) return { ok: false, error: "Please give a valid email address." };
  if (!schoolName) return { ok: false, error: "Which school is this for?" };

  const wanted = input.items.filter((i) => i.quantity > 0);
  if (wanted.length === 0) return { ok: false, error: "There is nothing in the order." };
  if (!isDatabaseConfigured()) return { ok: false, error: "Ordering is not connected yet." };

  const session = await safeAuth();

  try {
    // The catalogue decides the price, not the page.
    const products = await prisma.product.findMany({
      where: { id: { in: wanted.map((i) => i.productId) }, published: true },
    });
    if (products.length === 0) return { ok: false, error: "Those items are no longer available." };

    const lines = wanted
      .map((i) => {
        const p = products.find((x) => x.id === i.productId);
        if (!p) return null;
        return {
          productId: p.id,
          name: p.name,
          unit: p.unit,
          unitPrice: p.price,
          quantity: Math.min(Math.max(1, Math.floor(i.quantity)), 999),
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    if (lines.length === 0) return { ok: false, error: "Those items are no longer available." };

    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const anyPhysical = products.some((p) => !p.fileUrl);

    const order = await prisma.order.create({
      data: {
        contactName,
        contactEmail,
        phone: input.phone?.trim() || null,
        schoolName,
        address: input.address?.trim() || null,
        poNumber: input.poNumber?.trim() || null,
        notes: input.notes?.trim() || null,
        userId: session?.user?.id ?? null,
        schoolId: session?.user?.schoolId ?? null,
        subtotal,
        items: { create: lines },
      },
      select: { id: true },
    });

    const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const body = lines.map((l) => `${l.quantity} × ${l.name} — ${money(l.unitPrice)} ${l.unit}`);

    const [toSchool, toJoc] = await Promise.all([
      sendEmail({
        to: contactEmail,
        replyTo: JOC_INBOX,
        subject: "We have your order — JOC Education",
        text:
          `Hello ${contactName},\n\nThank you — we have your order for ${schoolName}.\n\n` +
          `${body.join("\n")}\n\nSubtotal: ${money(subtotal)}` +
          `${anyPhysical ? " before shipping" : ""}\n\n` +
          `Nothing has been charged. Someone from Just One Chesed will confirm the total` +
          `${anyPhysical ? ", including shipping," : ""} and arrange the invoice.\n`,
        html: emailShell({
          heading: "We have your order",
          body: [
            `Hello ${contactName},`,
            `Thank you — we have your order for ${schoolName}.`,
            ...body,
            `Subtotal: ${money(subtotal)}${anyPhysical ? " before shipping" : ""}.`,
            "Nothing has been charged. Someone from Just One Chesed will confirm the total and arrange the invoice.",
          ],
        }),
      }),
      sendEmail({
        to: JOC_INBOX,
        replyTo: contactEmail,
        subject: `Order — ${schoolName} — ${money(subtotal)}`,
        text: [
          `School:  ${schoolName}`,
          `Contact: ${contactName} <${contactEmail}>`,
          input.phone ? `Phone:   ${input.phone}` : null,
          input.poNumber ? `PO:      ${input.poNumber}` : null,
          input.address ? `Address:\n${input.address}` : "No address — downloads only.",
          "",
          ...body,
          "",
          `Subtotal: ${money(subtotal)}`,
          input.notes ? `\nNotes:\n${input.notes}` : "",
          "",
          `In the console: ${siteUrl()}/admin/orders`,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      }),
    ]);

    revalidatePath("/admin/orders");
    return { ok: true, id: order.id, emailed: toSchool.ok && toJoc.ok };
  } catch {
    return { ok: false, error: "Could not place that order. Please try again." };
  }
}

type Result = { ok: true } | { ok: false; error: string };

/** Move an order along, and optionally write back to the school. */
export async function updateOrder(input: {
  id: string;
  status?: string;
  response?: string;
}): Promise<Result> {
  const session = await safeAuth();
  if (!canManageAccounts(session?.user)) {
    return { ok: false, error: "Only super admins can handle orders." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected." };

  try {
    await prisma.order.update({
      where: { id: input.id },
      data: {
        ...(input.status ? { status: input.status as never } : {}),
        ...(input.response !== undefined ? { response: input.response.trim() || null } : {}),
      },
    });
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update that order." };
  }
}
