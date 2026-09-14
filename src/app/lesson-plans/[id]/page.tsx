import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedLessons, getLessonForPreview } from "@/lib/content";
import { safeAuth } from "@/auth";
import { hasSiteAccess, canManageContent } from "@/lib/access";
import { isLessonSaved } from "@/app/actions/saved";
import { LessonDetail } from "./LessonDetail";

type Search = Promise<{ preview?: string }>;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lesson = (await getPublishedLessons()).find((l) => l.id === Number(id));
  if (!lesson) return { title: "Lesson plan" };
  return { title: lesson.title, description: lesson.description };
}

export default async function LessonDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const [{ id }, { preview }] = await Promise.all([params, searchParams]);
  const session = await safeAuth();

  // The education team can walk an unpublished lesson exactly as a teacher
  // will see it. Everyone else only ever gets what is published.
  const previewing = preview === "1" && canManageContent(session?.user);

  const lessons = await getPublishedLessons();
  let lesson = lessons.find((l) => l.id === Number(id)) ?? null;
  if (!lesson && previewing) lesson = await getLessonForPreview(Number(id));

  if (!lesson) {
    return (
      <div style={{ maxWidth: "720px", margin: "80px auto", padding: "0 26px", textAlign: "center" }}>
        <h1 style={{ fontWeight: 800, fontSize: "36px", color: "#10233F", marginBottom: "12px" }}>Lesson not found</h1>
        <Link href="/lesson-plans" style={{ color: "#2D46AF", fontWeight: 600, fontSize: "16px" }}>← Back to lesson plans</Link>
      </div>
    );
  }

  const related = lessons.filter((l) => l.grade === lesson.grade && l.id !== lesson.id).slice(0, 3);
  const isDraft = previewing && !lessons.some((l) => l.id === lesson.id);

  return (
    <>
      {isDraft && (
        <div style={{ backgroundColor: "#FDEEDA", borderBottom: "1px solid rgba(154,84,5,.25)" }}>
          <p style={{ maxWidth: "1280px", margin: "0 auto", padding: "11px 26px", fontSize: "13.5px", color: "#7C4A00", lineHeight: 1.5 }}>
            <strong>Draft.</strong> This is how the lesson will look once published. No teacher can
            reach this page yet.{" "}
            <Link href="/admin/lessons" style={{ color: "#7C4A00", fontWeight: 700 }}>
              Back to the console
            </Link>
          </p>
        </div>
      )}
      <LessonDetail
        lesson={lesson}
        related={related}
        canDownload={hasSiteAccess(session?.user)}
        signedIn={Boolean(session?.user)}
        initiallySaved={await isLessonSaved(lesson.id)}
      />
    </>
  );
}
