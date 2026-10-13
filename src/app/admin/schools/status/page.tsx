import { redirect } from "next/navigation";

/**
 * The Status board's cards now are Client relations (/admin/schools), so the
 * old address goes there rather than to a page that no longer exists — it is
 * in people's bookmarks and in links on Today.
 */
export default function SchoolStatusPage() {
  redirect("/admin/schools");
}
