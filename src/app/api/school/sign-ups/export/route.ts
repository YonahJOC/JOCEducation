import { NextResponse } from "next/server";
import { safeAuth, openForReview } from "@/auth";
import { canRunSchoolApp } from "@/lib/access";
import { schoolSignUpsToCsv, type SchoolSignUp } from "@/lib/csv";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * A school's own sign-ups, as a spreadsheet.
 *
 * Deliberately takes no id of any kind. The JOC-side export is given a form
 * to export and checks who is asking; here there is nothing to ask for — the
 * school comes from the session and the query is built around it. A route
 * with no id cannot be pointed at somebody else's school.
 */

const stamp = (d: Date) => d.toISOString().slice(0, 10);
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "school";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "No database." }, { status: 503 });
  }

  const session = await safeAuth();
  if (!openForReview && !canRunSchoolApp(session?.user)) {
    return NextResponse.json({ error: "This is for whoever runs a school's JOC App." }, { status: 403 });
  }

  const schoolId = session?.user?.schoolId ?? null;
  if (!schoolId) {
    return NextResponse.json({ error: "Your account is not attached to a school." }, { status: 400 });
  }

  const [school, responses] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }).catch(() => null),
    prisma.formResponse
      .findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 2000,
        include: {
          form: {
            select: {
              title: true,
              feeCents: true,
              programs: { select: { name: true }, take: 1 },
            },
          },
        },
      })
      .catch(() => []),
  ]);

  const rows: SchoolSignUp[] = responses.map((r) => ({
    programName: r.form?.programs?.[0]?.name ?? r.form?.title ?? "Other",
    createdAt: r.createdAt,
    name: r.name,
    email: r.email,
    paid: r.paid,
    amountCents: r.amountCents,
    charged: Boolean(r.form?.feeCents),
    answers: Array.isArray(r.answers) ? (r.answers as unknown as { label: string; value: string }[]) : [],
  }));

  const filename = `${slug(school?.name ?? "school")}-sign-ups-${stamp(new Date())}.csv`;

  return new NextResponse(schoolSignUpsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
