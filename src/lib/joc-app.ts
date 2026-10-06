/**
 * Where the JOC App lives.
 *
 * One constant, because "Open the app" appeared on two screens and one of
 * them pointed at /school/activity — a page inside this portal showing what
 * the app had reported, not the app. Somebody told to go and approve hours
 * landed on a read-only summary and had nowhere to go from there.
 *
 * Linked, never embedded. The app sends no X-Frame-Options so a frame would
 * load, but what a school meets inside it is a login form, and a login form
 * served from another origin inside a frame is the shape of a phishing page.
 * Browsers are also steadily refusing cookies to third-party frames, so the
 * session would work for some schools and silently not for others.
 */
export const JOC_APP_URL = "https://app.justonechesed.org";

/** Every link to it opens in its own tab, so the portal is not replaced. */
export const JOC_APP_LINK = {
  href: JOC_APP_URL,
  target: "_blank",
  rel: "noreferrer",
} as const;
