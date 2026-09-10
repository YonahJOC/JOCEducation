import { redirect } from "next/navigation";

/**
 * The old portal was a mockup: a dashboard of illustrative numbers with a
 * banner saying auth was not connected. Auth is connected, and /home is the
 * real personal home, so this address goes there rather than showing a
 * teacher figures that were never theirs.
 */
export default function PortalPage() {
  redirect("/home");
}
