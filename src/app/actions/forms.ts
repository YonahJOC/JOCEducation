"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, isAuthConfigured } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can } from "@/lib/access";
import { FIELD_TYPES, NEEDS_OPTIONS, type FieldType, type Answer } from "@/lib/forms";
import { createCheckout, isPaymentConfigured, money } from "@/lib/payments";
import { sendEmail, emailShell } from "@/lib/email";
import { JOC_INBOX } from "@/lib/notify";

/**
 * Building forms, and receiving what people send back.
 *
 * Two audiences in one file, with very different rules. Building is for the
 * JOC team and needs the `forms` permission. Submitting is for whoever has
 * the link — possibly a parent with no account — so it validates hard and
 * trusts nothing the page sent about what the form is.
 */

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function requireFormEditor() {
  const session = await safeAuth();
  if (isAuthConfigured && !can(session?.user, "forms")) {
    throw new Error("Your admin type does not include Forms and their answers");
  }
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  return session?.user ?? null;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

// ─── Building ────────────────────────────────────────────────────────────────

export async function saveForm(input: {
  id?: string;
  title: string;
  description?: string;
  thankYou?: string;
  published: boolean;
  closed: boolean;
  requiresSignIn: boolean;
  /** Dollars as typed; stored as cents. Empty or 0 means free. */
  feeDollars?: number | null;
  feeLabel?: string;
  fields: {
    label: string;
    help?: string;
    type: string;
    required: boolean;
    options: string[];
  }[];
}): Promise<Result> {
  try {
    await requireFormEditor();

    const title = input.title.trim();
    if (!title) return { ok: false, error: "Give the form a name." };

    const fields = input.fields
      .filter((f) => f.label.trim())
      .map((f, order) => ({
        label: f.label.trim(),
        help: f.help?.trim() || null,
        type: (FIELD_TYPES as readonly string[]).includes(f.type)
          ? (f.type as FieldType)
          : ("SHORT_TEXT" as FieldType),
        required: f.required,
        options: f.options.map((o) => o.trim()).filter(Boolean),
        order,
      }));

    // A "pick one" with nothing to pick is a dead end for whoever opens it.
    const emptyChoice = fields.find(
      (f) => NEEDS_OPTIONS.includes(f.type) && f.options.length === 0
    );
    if (emptyChoice) {
      return { ok: false, error: `"${emptyChoice.label}" is a pick-one but has no options to pick.` };
    }

    const feeCents =
      input.feeDollars && input.feeDollars > 0 ? Math.round(input.feeDollars * 100) : null;

    if (input.published) {
      if (fields.length === 0) {
        return { ok: false, error: "Add at least one question before publishing." };
      }
      // Publishing a form that charges money it cannot take would collect
      // registrations and never bill anyone. Refuse rather than half-work.
      if (feeCents && !isPaymentConfigured) {
        return {
          ok: false,
          error: "This form charges a fee, but card payment is not switched on yet. Remove the fee or connect Stripe first.",
        };
      }
      if (feeCents && feeCents < 50) {
        return { ok: false, error: "The smallest amount that can be charged is $0.50." };
      }
    }

    const data = {
      title,
      description: input.description?.trim() ?? "",
      thankYou: input.thankYou?.trim() || "Thank you — we have your answers.",
      published: input.published,
      closed: input.closed,
      requiresSignIn: input.requiresSignIn,
      feeCents,
      feeLabel: input.feeLabel?.trim() || null,
    };

    if (input.id) {
      // Replacing the fields wholesale is simplest and safe: responses keep
      // their own snapshot of the label, so nothing already submitted breaks.
      await prisma.$transaction([
        prisma.formField.deleteMany({ where: { formId: input.id } }),
        prisma.form.update({
          where: { id: input.id },
          data: { ...data, fields: { create: fields } },
        }),
      ]);
      revalidatePath("/admin/forms");
      revalidatePath("/forms");
      return { ok: true, id: input.id };
    }

    let slug = slugify(title);
    if (await prisma.form.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    const made = await prisma.form.create({
      data: { ...data, slug, fields: { create: fields } },
      select: { id: true },
    });
    revalidatePath("/admin/forms");
    revalidatePath("/forms");
    return { ok: true, id: made.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that form." };
  }
}

export async function deleteForm(id: string): Promise<Result> {
  try {
    await requireFormEditor();
    const n = await prisma.formResponse.count({ where: { formId: id } });
    if (n > 0) {
      return {
        ok: false,
        error: `${n} ${n === 1 ? "person has" : "people have"} answered this form. Close it instead — deleting it would throw their answers away.`,
      };
    }
    await prisma.form.delete({ where: { id } });
    revalidatePath("/admin/forms");
    revalidatePath("/forms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not remove that form." };
  }
}

// ─── Submitting ──────────────────────────────────────────────────────────────

export type SubmitResult =
  | { ok: true; thankYou: string }
  /** A paid form: go to Stripe, come back to the success page. */
  | { ok: true; payUrl: string }
  | { ok: false; error: string };

export async function submitForm(input: {
  slug: string;
  name: string;
  email: string;
  /** fieldId -> what they typed or picked. */
  values: Record<string, string | string[]>;
}): Promise<SubmitResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  try {
    // Read the form from the database, never from what the page sent — the
    // page is whatever the visitor's browser says it is.
    const form = await prisma.form.findUnique({
      where: { slug: input.slug },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!form || !form.published) return { ok: false, error: "That form is not open." };
    if (form.closed) return { ok: false, error: "That form has closed." };

    const session = await safeAuth();
    if (form.requiresSignIn && !session?.user?.id) {
      return { ok: false, error: "Please sign in before filling this in." };
    }

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) return { ok: false, error: "Please give your name." };
    if (!email.includes("@")) return { ok: false, error: "Please give an email address we can reply to." };

    const answers: Answer[] = [];
    for (const f of form.fields) {
      const raw = input.values[f.id];
      const value = Array.isArray(raw) ? raw.filter(Boolean).join(", ") : (raw ?? "").trim();

      if (f.required && !value) return { ok: false, error: `"${f.label}" is needed.` };
      if (!value) continue;

      if (f.type === "EMAIL" && !value.includes("@")) {
        return { ok: false, error: `"${f.label}" should be an email address.` };
      }
      if (f.type === "NUMBER" && Number.isNaN(Number(value))) {
        return { ok: false, error: `"${f.label}" should be a number.` };
      }
      // Only what the form actually offered — a crafted request must not be
      // able to file an answer that was never one of the choices.
      if (NEEDS_OPTIONS.includes(f.type as FieldType)) {
        const picked = value.split(",").map((v) => v.trim());
        const unknown = picked.find((v) => !f.options.includes(v));
        if (unknown) return { ok: false, error: `"${unknown}" is not one of the choices for "${f.label}".` };
      }

      // The label is stored alongside the answer on purpose: renaming the
      // question later must not make this answer unreadable.
      answers.push({ fieldId: f.id, label: f.label, value });
    }

    const response = await prisma.formResponse.create({
      data: {
        formId: form.id,
        userId: session?.user?.id ?? null,
        name,
        email,
        answers: answers as never,
        amountCents: form.feeCents,
        paid: false,
      },
      select: { id: true },
    });

    if (form.feeCents && form.feeCents > 0) {
      const checkout = await createCheckout({
        amountCents: form.feeCents,
        description: form.feeLabel || form.title,
        successPath: `/forms/${form.slug}`,
        cancelPath: `/forms/${form.slug}`,
        email,
        metadata: { kind: "form", responseId: response.id, formSlug: form.slug },
      });
      if (!checkout.ok) {
        // The answers are saved either way — better a registration JOC has to
        // chase for payment than one that vanished because Stripe hiccuped.
        return {
          ok: false,
          error: `${checkout.error} Your answers were saved; JOC will be in touch about the ${money(form.feeCents)}.`,
        };
      }
      return { ok: true, payUrl: checkout.url };
    }

    await sendEmail({
      to: JOC_INBOX,
      replyTo: email,
      subject: `${form.title} — ${name}`,
      text: [`${name} <${email}>`, "", ...answers.map((a) => `${a.label}: ${a.value}`)].join("\n"),
      html: emailShell({
        heading: form.title,
        body: [`${name} — ${email}`, ...answers.map((a) => `${a.label}: ${a.value}`)],
      }),
    });

    revalidatePath("/admin/forms");
    return { ok: true, thankYou: form.thankYou };
  } catch {
    return { ok: false, error: "Could not send that. Please try again." };
  }
}
