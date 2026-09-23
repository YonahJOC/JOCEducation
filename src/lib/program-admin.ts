import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can, canAccessConsole } from "@/lib/access";
import { listResponses, type ResponseRow, type PublicField } from "@/lib/forms";
import { ensureProgramForm } from "@/lib/program-forms";

/**
 * One program's own corner of the console.
 *
 * The point of this is narrowness. Whoever runs Boots for Israel needs to see
 * who has signed up for Boots for Israel — and nothing else. Making that
 * possible without handing them the whole console is the difference between
 * a person being useful and a person being a risk.
 *
 * Three ways in, checked in this order:
 *
 *   1. A lead of this program. Sees this program and no other.
 *   2. Anyone with the `programs` permission. Sees every program.
 *   3. Anyone with `forms`. Sees the answers wherever they are.
 *
 * A lead is deliberately given neither the `forms` permission nor the right
 * to edit this program's own form. They see the questions and they see the
 * answers; writing the questions stays with JOC.
 */

export type ProgramAdminView = {
  id: number;
  slug: string;
  name: string;
  published: boolean;
  comingSoon: boolean;
  /** The form attached to this program, if any. */
  form: {
    id: string;
    slug: string;
    title: string;
    /// Every field the builder edits — anything missing here would be blanked
    /// the first time somebody saved the form from this page.
    description: string;
    thankYou: string;
    published: boolean;
    closed: boolean;
    requiresSignIn: boolean;
    feeCents: number | null;
    feeLabel: string | null;
    fields: PublicField[];
  } | null;
  responses: ResponseRow[];
  /**
   * Where and when this program is actually running. A console for one
   * program is not just its sign-ups — the question its coordinator is asked
   * is "when are we at Darchei Torah", and that lived only on the
   * calendar, filtered by hand.
   */
  runs: {
    id: number;
    title: string;
    schoolName: string | null;
    startsAt: Date;
    endsAt: Date | null;
    status: string;
    published: boolean;
    location: string | null;
    audience: string | null;
  }[];
  leads: { id: string; name: string | null; email: string }[];
  /** True when this person only got here by being a lead. */
  asLead: boolean;
  /** May swap which form this program uses — an education-team job. */
  canEditProgram: boolean;
  /** May say who runs it — a programming-team job. */
  canSetCoordinators: boolean;
  /**
   * May build and edit this program's own sign-up form. Scoped to this
   * program: it does not imply the site-wide Forms permission.
   *
   * Not a coordinator. They read their sign-ups; the questions a school is
   * asked are JOC's to write, and the person running one program should not
   * be able to change what every school arriving at it is asked.
   */
  canEditForm: boolean;
};

/**
 * Look at a program the way its coordinator does.
 *
 * Only ever takes things away — the three permissions are forced off and the
 * lead banner forced on. A preview that could show more than the real thing
 * would be worse than no preview, because somebody would trust it.
 */
export async function getProgramAdmin(
  slug: string,
  opts: { asCoordinator?: boolean } = {},
): Promise<ProgramAdminView | null | "denied"> {
  if (!isDatabaseConfigured()) return null;

  const session = await safeAuth();
  const me = session?.user;

  try {
    let p = await prisma.programPage.findUnique({
      where: { slug },
      include: {
        form: { include: { fields: { orderBy: { order: "asc" } } } },
        leads: { select: { id: true, name: true, email: true } },
        events: {
          orderBy: { startsAt: "asc" },
          include: { school: { select: { name: true } } },
        },
      },
    });
    if (!p) return null;

    // Every program has a form. If this one has never had one, it gets the
    // starter now — a draft, so nothing about the public page changes — and
    // whoever opened this page finds questions to edit rather than a blank
    // panel and a decision to make.
    if (!p.form) {
      const formId = await ensureProgramForm({ id: p.id, name: p.name, slug: p.slug, formId: p.formId });
      if (formId) {
        p =
          (await prisma.programPage.findUnique({
            where: { slug },
            include: {
              form: { include: { fields: { orderBy: { order: "asc" } } } },
              leads: { select: { id: true, name: true, email: true } },
              events: {
                orderBy: { startsAt: "asc" },
                include: { school: { select: { name: true } } },
              },
            },
          })) ?? p;
      }
    }

    const isLead = Boolean(me?.id && p.leads.some((l) => l.id === me.id));
    const managesPrograms = can(me, "programs");
    const readsForms = can(me, "forms");
    const namesCoordinators = can(me, "coordinators");

    // Before sign-in is configured the console is open for review.
    const open = openForReview;
    if (!open && !isLead && !managesPrograms && !readsForms && !namesCoordinators) return "denied";

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      published: p.published,
      comingSoon: p.comingSoon,
      form: p.form
        ? {
            id: p.form.id,
            slug: p.form.slug,
            title: p.form.title,
            description: p.form.description,
            thankYou: p.form.thankYou,
            published: p.form.published,
            closed: p.form.closed,
            requiresSignIn: p.form.requiresSignIn,
            feeCents: p.form.feeCents,
            feeLabel: p.form.feeLabel,
            fields: p.form.fields.map((f) => ({
              id: f.id, label: f.label, help: f.help,
              type: f.type as PublicField["type"], required: f.required, options: f.options,
            })),
          }
        : null,
      responses: p.form ? await listResponses(p.form.id) : [],
      runs: p.events.map((e) => ({
        id: e.id,
        title: e.title,
        schoolName: e.school?.name ?? null,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        status: e.status,
        published: e.published,
        location: e.location,
        audience: e.audience,
      })),
      leads: p.leads,
      asLead: opts.asCoordinator || (isLead && !managesPrograms && !readsForms && !namesCoordinators),
      canEditProgram: !opts.asCoordinator && (open || managesPrograms),
      canSetCoordinators: !opts.asCoordinator && (open || namesCoordinators),
      canEditForm: !opts.asCoordinator && (open || managesPrograms || readsForms || namesCoordinators),
    };
  } catch {
    return null;
  }
}

/**
 * Does this person run any program?
 *
 * The console door asks for a capability, and a program coordinator has none —
 * which locked them out of the page built for them. This is the second way in:
 * not an admin type, just the fact that somebody put them down as running
 * something.
 */
export async function leadsAnyProgram(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !isDatabaseConfigured()) return false;
  try {
    const n = await prisma.programPage.count({ where: { leads: { some: { id: userId } } } });
    return n > 0;
  } catch {
    return false;
  }
}

/**
 * Can this person open the console at all?
 *
 * Two ways in, and every place that asks has to know about both: a capability,
 * which the education and programming teams hold, or running a program, which
 * a coordinator does while holding no capability whatever.
 *
 * It lives here rather than in access.ts because the second route is a
 * database question and access.ts is deliberately synchronous. Four callers
 * were each answering it their own way — the header, the console layout, the
 * console's front door and the account page — and every time one of them was
 * missed, somebody got a console they could not see a way into.
 */
export async function canOpenConsole(
  user: { id?: string | null; role?: string | null; email?: string | null; capabilities?: string[] | null } | null | undefined,
): Promise<boolean> {
  if (!user) return false;
  if (canAccessConsole(user)) return true;
  return leadsAnyProgram(user.id ?? null);
}

/** Every program this person may open — for the list page. */
export async function listProgramsForAdmin(): Promise<
  { id: number; slug: string; name: string; published: boolean; responseCount: number; formTitle: string | null }[]
> {
  if (!isDatabaseConfigured()) return [];
  const session = await safeAuth();
  const me = session?.user;
  const seesAll = openForReview || can(me, "programs") || can(me, "forms") || can(me, "coordinators");

  try {
    const rows = await prisma.programPage.findMany({
      where: seesAll ? {} : { leads: { some: { id: me?.id ?? "__none__" } } },
      orderBy: { sort: "asc" },
      include: { form: { select: { title: true, _count: { select: { responses: true } } } } },
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      published: p.published,
      responseCount: p.form?._count.responses ?? 0,
      formTitle: p.form?.title ?? null,
    }));
  } catch {
    return [];
  }
}
