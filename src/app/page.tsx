import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { DedicationLine } from "@/components/sections/DedicationLine";
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
  openGraph: {
    title: "JOC Education — Educating Towards Chesed",
    description:
      "Lesson plans, chesed programs, and classroom resources for Jewish schools.",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DedicationLine />
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
