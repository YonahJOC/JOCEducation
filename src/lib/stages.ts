/**
 * A program's four stages, and where each one sends a school.
 *
 * Kept out of the component so the address rules can be tested without
 * rendering anything — they are the part that quietly sends somebody to the
 * wrong place.
 */

export type Stage = {
  step: string;
  title: string;
  description: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
};

/**
 * `{form}` in a stage's address means this program's own sign-up form, so the
 * four stages are the same four rows on every program and adding a program
 * means editing nothing.
 *
 * While that form is still a draft it falls back to pricing, which is where
 * the Register button went before forms existed. A school reading stage two
 * needs somewhere to go; a stage that quietly loses its button while the
 * others keep theirs reads as though the process is broken.
 */
export function resolveStageUrl(url: string | null | undefined, formSlug: string | null): string | null {
  if (!url) return null;
  if (url.trim() === "{form}") return formSlug ? `/forms/${formSlug}` : "/pricing";
  return url.trim() || null;
}
