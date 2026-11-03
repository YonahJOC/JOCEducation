import { redirect } from "next/navigation";

/**
 * Updates moved onto the Live Screen page.
 *
 * It is the answer to "did anything happen to my flyer", which belongs
 * beside the flyer rather than on a page of its own. Kept as a redirect so
 * an address somebody has already seen still lands somewhere.
 */
export const dynamic = "force-dynamic";

export default function AmbassadorUpdatesMoved() {
  redirect("/ambassador/screen");
}
