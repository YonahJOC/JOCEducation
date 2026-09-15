import type { Metadata } from "next";
import { getCycleState } from "@/lib/cycles";
import { getCycles } from "@/lib/cycle-data";
import { CycleRailSection } from "@/components/sections/CycleRailSection";

export const metadata: Metadata = {
  title: "Chesed Cycles",
  description:
    "The Just One Chesed year in eight consecutive cycles — one middah, one guiding question, four to six weeks each. From school opening through Shavuos.",
  openGraph: {
    title: "Chesed Cycles — JOC Education",
    description: "Eight cycles. Eight middos. One question to carry through each.",
  },
};

export default async function CyclesPage() {
  const cycles = await getCycles();
  const initialIndex = cycles.findIndex((c) => getCycleState(c) === "current");
  const resolvedIndex = initialIndex >= 0 ? initialIndex : 0;

  return (
    <main>
      <CycleRailSection initialIndex={resolvedIndex} cycles={cycles} />
    </main>
  );
}
