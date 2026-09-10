import type { Metadata } from "next";
import { getPublishedPrograms } from "@/lib/content";
import { ProgramsBrowser } from "./ProgramsBrowser";

export const metadata: Metadata = {
  title: { absolute: "Programs — JOC Education" },
  description:
    "The chesed programs JOC runs for Jewish schools — from a single class to a whole school, plus organised programs your school can register for.",
};

export default async function ProgramsPage() {
  const programs = await getPublishedPrograms();
  return <ProgramsBrowser programs={programs} />;
}
