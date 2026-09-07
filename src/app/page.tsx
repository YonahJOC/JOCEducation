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
