import Image from "next/image";

/**
 * The JOC lockup: the wordmark file, then "Education".
 *
 * Seven pages each built this by hand — the ring icon beside "JustOneChesed"
 * typeset in Outfit — which is wrong twice. The ring is already the O in the
 * real wordmark, so setting it alongside draws the mark twice; and Outfit is
 * not the logo's typeface, so the letterforms were an impression of the name
 * rather than the name.
 *
 * It is one component now. A logo rebuilt on seven pages drifts on seven
 * pages, and this is the thing a school sees before it sees anything else.
 */

const ORANGE_TEXT = "#C96C00";
const ORANGE = "#FA912D";

/** The wordmark on its own. Nothing beside it — the O is the mark. */
export function Wordmark({
  height = 20,
  white = false,
  priority = true,
}: {
  height?: number;
  white?: boolean;
  priority?: boolean;
}) {
  return (
    <Image
      src={white ? "/brand/joc-wordmark-white.png" : "/brand/joc-wordmark.png"}
      alt="JustOneChesed"
      // The file is 4970×605; the ratio is what keeps it from being squashed.
      width={Math.round(height * 8.21)}
      height={height}
      priority={priority}
      style={{ height: `${height}px`, width: "auto", display: "block" }}
    />
  );
}

/**
 * The wordmark with the division under it — what the header, the sign-in
 * pages and the error pages all show.
 */
export function BrandLockup({
  height = 20,
  white = false,
  label = "Education",
  priority = true,
}: {
  height?: number;
  white?: boolean;
  label?: string;
  priority?: boolean;
}) {
  return (
    <span style={{ display: "inline-block", lineHeight: 1 }}>
      <Wordmark height={height} white={white} priority={priority} />
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-outfit)",
          fontWeight: 700,
          fontSize: `${Math.max(9, Math.round(height * 0.53))}px`,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: white ? ORANGE : ORANGE_TEXT,
          marginTop: `${Math.round(height * 0.3)}px`,
        }}
      >
        {label}
      </span>
    </span>
  );
}
