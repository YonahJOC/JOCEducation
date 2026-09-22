import { NextResponse } from "next/server";
import { safeAuth, isAuthConfigured } from "@/auth";
import { can } from "@/lib/access";
import { responsesToCsv } from "@/lib/csv";
import { listResponses } from "@/lib/forms";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * A form's answers as a spreadsheet.
 *
 * The console shows them in a table, which is fine for looking at. It is not
 * fine for the actual work — a bus list, a name-badge run, a merge into the
 * school's own sheet. Without this, somebody gets them out by dragging a
 * mouse across the table, and that quietly loses the rows below the fold.
 *
 * Who may download is the same question as who may see the page, so it is
 * answered the same way: Forms, Programs or Coordinators, or being down as
 * running the program this form belongs to. The gate in proxy.ts only proves
 * a session cookie exists, so the real check is here.
 */

const stamp = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "No database." }, { status: 503 });
  }

  const form = await prisma.form
    .findUnique({ where: { id }, include: { fields: { orderBy: { order: "asc" } } } })
    .catch(() => null);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isAuthConfigured) {
    const session = await safeAuth();
    const me = session?.user;
    if (!me) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    let allowed = can(me, "forms") || can(me, "programs") || can(me, "coordinators");
    if (!allowed && me.id) {
      // The one narrow way in: this form belongs to a program they run.
      const owning = await prisma.programPage
        .findFirst({
          where: { formId: form.id, leads: { some: { id: me.id } } },
          select: { id: true },
        })
        .catch(() => null);
      allowed = Boolean(owning);
    }
    if (!allowed) {
      return NextResponse.json({ error: "You do not have access to these answers." }, { status: 403 });
    }
  }

  const csv = responsesToCsv(form, await listResponses(form.id));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${form.slug}-${stamp(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
