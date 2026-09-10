import { getPublishedLessons } from "@/lib/content";
import { LessonsBrowser } from "./LessonsBrowser";

export const metadata = { title: "Lesson Plans" };

/**
 * Reads whatever the Education Team has published. Filtering happens in the
 * browser component; the list itself comes from the database.
 */
export default async function LessonPlansPage() {
  const lessons = await getPublishedLessons();

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 64px" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>LESSON LIBRARY</p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "12px" }}>
        Every lesson plan we have.
      </h1>
      <p style={{ fontSize: "17px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "56ch", marginBottom: "40px" }}>
        Ready-to-use chesed lesson plans for elementary, middle, and high school. Download the full plan and all printables in one click.
      </p>

      <LessonsBrowser lessons={lessons} />
    </div>
  );
}
