import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/** Reading forms. Degrades to nothing rather than throwing, like the rest of lib/. */

export const FIELD_TYPES = [
  "SHORT_TEXT", "LONG_TEXT", "EMAIL", "PHONE", "NUMBER", "DATE",
  "CHOICE", "CHECKBOXES", "YES_NO",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  SHORT_TEXT: "Short answer",
  LONG_TEXT: "Long answer",
  EMAIL: "Email address",
  PHONE: "Phone number",
  NUMBER: "A number",
  DATE: "A date",
  CHOICE: "Pick one",
  CHECKBOXES: "Pick any",
  YES_NO: "Yes or no",
};

/** The types that need a list of options to mean anything. */
export const NEEDS_OPTIONS: FieldType[] = ["CHOICE", "CHECKBOXES"];

export type PublicField = {
  id: string;
  label: string;
  help: string | null;
  type: FieldType;
  required: boolean;
  options: string[];
};

export type PublicForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thankYou: string;
  closed: boolean;
  requiresSignIn: boolean;
  feeCents: number | null;
  feeLabel: string | null;
  fields: PublicField[];
};

const shapeField = (f: {
  id: string; label: string; help: string | null; type: string;
  required: boolean; options: string[];
}): PublicField => ({
  id: f.id,
  label: f.label,
  help: f.help,
  type: f.type as FieldType,
  required: f.required,
  options: f.options,
});

/** One published form, for somebody to fill in. */
export async function getPublishedForm(slug: string): Promise<PublicForm | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const f = await prisma.form.findUnique({
      where: { slug },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!f || !f.published) return null;
    return {
      id: f.id, slug: f.slug, title: f.title, description: f.description,
      thankYou: f.thankYou, closed: f.closed, requiresSignIn: f.requiresSignIn,
      feeCents: f.feeCents, feeLabel: f.feeLabel,
      fields: f.fields.map(shapeField),
    };
  } catch {
    return null;
  }
}

/** Every published, open form — the list at /forms. */
export async function listOpenForms(): Promise<
  { slug: string; title: string; description: string; feeCents: number | null }[]
> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.form.findMany({
      where: { published: true, closed: false },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true, description: true, feeCents: true },
    });
    return rows;
  } catch {
    return [];
  }
}

export type AdminFormRow = PublicForm & {
  published: boolean;
  responseCount: number;
  createdAt: Date;
};

/** The console's view: drafts and closed ones too. */
export async function listForms(): Promise<AdminFormRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        fields: { orderBy: { order: "asc" } },
        _count: { select: { responses: true } },
      },
    });
    return rows.map((f) => ({
      id: f.id, slug: f.slug, title: f.title, description: f.description,
      thankYou: f.thankYou, closed: f.closed, requiresSignIn: f.requiresSignIn,
      feeCents: f.feeCents, feeLabel: f.feeLabel,
      fields: f.fields.map(shapeField),
      published: f.published,
      responseCount: f._count.responses,
      createdAt: f.createdAt,
    }));
  } catch {
    return [];
  }
}

export type Answer = { fieldId: string; label: string; value: string };

export type ResponseRow = {
  id: string;
  name: string | null;
  email: string | null;
  answers: Answer[];
  paid: boolean;
  amountCents: number | null;
  createdAt: Date;
};

export async function listResponses(formId: string): Promise<ResponseRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.formResponse.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      // Stored as a snapshot, so an old answer stays readable after a field
      // is renamed or removed.
      answers: Array.isArray(r.answers) ? (r.answers as unknown as Answer[]) : [],
      paid: r.paid,
      amountCents: r.amountCents,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}
