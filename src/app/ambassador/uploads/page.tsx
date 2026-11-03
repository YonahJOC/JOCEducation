import { redirect } from "next/navigation";

/**
 * The queue moved onto the Live Screen page.
 *
 * Kept as a redirect rather than deleted: this address is on codes a
 * teacher may already have read out, and in a student's history. A dead
 * link reads as the software being broken.
 */
export const dynamic = "force-dynamic";

export default function AmbassadorUploadsMoved() {
  redirect("/ambassador/screen");
}
