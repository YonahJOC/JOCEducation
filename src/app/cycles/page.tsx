import type { Metadata } from "next";
import { CYCLES, getCycleState } from "@/lib/cycles";
import { CycleRailSection } from "@/components/sections/CycleRailSection";

export const metadata: Metadata = {
  title: "Chesed Cycles — JOC Education",
  description:
    "The Just One Chesed year in ten consecutive cycles — one middah, one guiding question, four to six weeks each. From Elul to Av.",
  openGraph: {
    title: "Chesed Cycles — JOC Education",
    description: "Ten cycles. Ten middos. One question to carry through each.",
  },
};

export default function CyclesPage() {
  const initialIndex = CYCLES.findIndex((c) => getCycleState(c) === "current");
  const resolvedIndex = initialIndex >= 0 ? initialIndex : 0;

  return (
    <main>
      <CycleRailSection initialIndex={resolvedIndex} />
    </main>
  );
}
