import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedLessons } from "@/lib/content";
import { LessonDetail } from "./LessonDetail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lesson = (await getPublishedLessons()).find((l) => l.id === Number(id));
  if (!lesson) return { title: "Lesson not found" };
  return { title: lesson.title, description: lesson.description };
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lessons = await getPublishedLessons();
  const lesson = lessons.find((l) => l.id === Number(id));

  if (!lesson) {
    return (
      <div style={{ maxWidth: "720px", margin: "80px auto", padding: "0 26px", textAlign: "center" }}>
        <h1 style={{ fontWeight: 800, fontSize: "36px", color: "#10233F", marginBottom: "12px" }}>Lesson not found</h1>
        <Link href="/lesson-plans" style={{ color: "#2D46AF", fontWeight: 600, fontSize: "16px" }}>← Back to lesson plans</Link>
      </div>
    );
  }

  const related = lessons.filter((l) => l.grade === lesson.grade && l.id !== lesson.id).slice(0, 3);

  return <LessonDetail lesson={lesson} related={related} />;
}
