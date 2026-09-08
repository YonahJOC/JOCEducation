import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lesson Plans",
  description: "Browse 9 fully-developed chesed lesson plans for Jewish day schools — each with objectives, source sheets, discussion questions, and downloadable materials.",
};

export default function LessonPlansLayout({ children }: { children: React.ReactNode }) {
  return children;
}
