import Image from "next/image";

/**
 * The JOC mark.
 *
 * This used to be a hand-drawn SVG — a navy disc with a white ring and an
 * orange arc — which was somebody's approximation of the logo rather than the
 * logo. The real mark is two broken concentric rings, blue outside and orange
 * inside, on no background at all.
 *
 * Used on the header, the footer, and every sign-in page, so it is the file
 * itself rather than a redrawing of it.
 */
export function LogoMark({ size = 40, white = false }: { size?: number; white?: boolean }) {
  return (
    <Image
      src={white ? "/brand/joc-icon-orange.png" : "/brand/joc-icon.png"}
      alt="JustOneChesed"
      width={size}
      height={size}
      priority
      style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", display: "block" }}
    />
  );
}
