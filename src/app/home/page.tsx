import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeAuth, isAuthConfigured } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { HeroSection } from "@/components/sections/HeroSection";
import { CycleStripSection } from "@/components/sections/CycleStripSection";
import { ProgramsSection } from "@/components/sections/ProgramsSection";
import { LessonPlansSection } from "@/components/sections/LessonPlansSection";
import { ResourceLibrarySection } from "@/components/sections/ResourceLibrarySection";
import { TeachersBoardSection } from "@/components/sections/TeachersBoardSection";
import { ShopSection } from "@/components/sections/ShopSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { PortalSection } from "@/components/sections/PortalSection";
import { ClosingCTA } from "@/components/sections/ClosingCTA";

export const metadata: Metadata = {
  title: "JOC Education — Educating Towards Chesed",
  description:
    "Lesson plans, chesed programs, and classroom resources for Jewish schools. Educating Towards Chesed — Just One Student at a Time.",
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  // Signed in but attached to no school with an active plan: send them
  // somewhere that explains why, rather than an empty site.
  if (isAuthConfigured) {
    const session = await safeAuth();
    if (session?.user && !hasSiteAccess(session.user)) redirect("/no-access");
  }

  return (
    <>
      <HeroSection />
      <CycleStripSection />
      <ProgramsSection />
      <LessonPlansSection />
      <ResourceLibrarySection />
      <TeachersBoardSection />
      <ShopSection />
      <PricingSection />
      <PortalSection />
      <ClosingCTA />
    </>
  );
}
