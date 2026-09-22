import { prisma } from "@/lib/prisma";
import type { FieldType } from "@/lib/forms";

/**
 * Every program has a sign-up form from the moment it exists.
 *
 * The alternative — an empty panel and a "Build a sign-up form" button — put
 * the blank page problem on whoever runs the program. They open their page,
 * find nothing, and have to decide from scratch what a sign-up form for a
 * school program should ask. Most people faced with that do nothing.
 *
 * So the form is already there, as a draft, with the questions JOC asks every
 * school anyway. The work becomes editing rather than starting, and nothing
 * reaches the public site until somebody ticks Published.
 */

type Starter = { label: string; help?: string; type: FieldType; required: boolean; options: string[] };

/**
 * What JOC needs from a school for any program. Deliberately short — a
 * starting point to cut down, not a form to fill in. Name and email are
 * collected by every form and are not listed here.
 */
export const STARTER_QUESTIONS: Starter[] = [
  { label: "School name", type: "SHORT_TEXT", required: true, options: [] },
  { label: "Your role at the school", help: "Principal, rebbe, morah, chesed coordinator — whatever fits.", type: "SHORT_TEXT", required: false, options: [] },
  { label: "Which grades are taking part", type: "SHORT_TEXT", required: true, options: [] },
  { label: "Roughly how many students", type: "NUMBER", required: false, options: [] },
  { label: "Phone number", help: "For anything quicker than email.", type: "PHONE", required: false, options: [] },
  { label: "When would you like to run it", type: "DATE", required: false, options: [] },
  { label: "Anything we should know", type: "LONG_TEXT", required: false, options: [] },
];

const starterDescription = (name: string) =>
  `Tell us about your school and we will be in touch to set up ${name}.`;

/**
 * The program's own form, creating it if it does not have one yet.
 *
 * Idempotent, and safe if two people open the page at the same moment: the
 * form slug is derived from the program slug and Form.slug is unique, so the
 * second create loses and reads back the first one's work rather than
 * quietly making a duplicate nobody notices.
 *
 * Returns null rather than throwing — a form that could not be made must not
 * take the program's page down with it.
 */
export async function ensureProgramForm(program: {
  id: number;
  name: string;
  slug: string;
  formId: string | null;
}): Promise<string | null> {
  if (program.formId) return program.formId;

  const slug = `${program.slug}-sign-up`.slice(0, 70);

  try {
    const existing = await prisma.form.findUnique({ where: { slug }, select: { id: true } });
    const formId =
      existing?.id ??
      (
        await prisma.form.create({
          data: {
            slug,
            title: `${program.name} sign-up`,
            description: starterDescription(program.name),
            thankYou: "Thank you — we have your details and will be in touch.",
            // A starter form is never live. Somebody has to read it first.
            published: false,
            closed: false,
            requiresSignIn: false,
            feeCents: null,
            feeLabel: null,
            fields: {
              create: STARTER_QUESTIONS.map((q, order) => ({
                label: q.label,
                help: q.help ?? null,
                type: q.type,
                required: q.required,
                options: q.options,
                order,
              })),
            },
          },
          select: { id: true },
        })
      ).id;

    await prisma.programPage.update({ where: { id: program.id }, data: { formId } });
    return formId;
  } catch {
    // Losing the race, or anything else — read back whatever is attached now.
    try {
      const p = await prisma.programPage.findUnique({
        where: { id: program.id },
        select: { formId: true },
      });
      return p?.formId ?? null;
    } catch {
      return null;
    }
  }
}
