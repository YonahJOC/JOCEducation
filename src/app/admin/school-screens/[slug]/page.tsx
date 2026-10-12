import { notFound } from "next/navigation";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isScreenStaff } from "@/lib/school-screen/access";
import { screenEditorData } from "@/lib/school-screen/editor-data";
import { ScreenEditor } from "@/components/school-screen/ScreenEditor";
import { ScreensConsole } from "@/components/admin/ScreensConsole";
import { C, F, pageTitle } from "@/lib/joc-tokens";

/** One school's screen, from JOC's side: everything, any school, and approvals. */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Screen · ${slug} — JOC Console` };
}

export default async function SchoolScreenAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await safeAuth();
  if (!isScreenStaff(session?.user)) {
    return (
      <div style={{ padding: "40px 26px", maxWidth: "520px" }}>
        <h1 style={{ ...pageTitle, color: C.ink }}>School screens aren&rsquo;t yours</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted }}>This needs the schools permission.</p>
      </div>
    );
  }
  if (!isDatabaseConfigured()) notFound();

  const school = await prisma.school.findUnique({ where: { slug }, select: { id: true } }).catch(() => null);
  if (!school) notFound();
  const data = await screenEditorData(school.id, "staff", session?.user?.id ?? null);
  if (!data) notFound();

  return (
    <ScreensConsole>
      <div style={{ padding: "28px 32px 60px", maxWidth: "1100px" }}>
        <ScreenEditor data={data} staff />
      </div>
    </ScreensConsole>
  );
}
