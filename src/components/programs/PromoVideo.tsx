import { toEmbed } from "@/lib/video";
import { C } from "@/lib/joc-tokens";

/**
 * The promo video at the top of a program page.
 *
 * Nothing renders when there is no video. An empty 16:9 box on a live
 * program page reads as broken, not as "coming soon".
 */

export function PromoVideo({ url, title }: { url: string | null | undefined; title?: string }) {
  const embed = toEmbed(url, title ? `${title} — promo video` : "Promo video");
  if (!embed) return null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: "18px",
        overflow: "hidden",
        backgroundColor: C.ink,
        marginBottom: "40px",
      }}
    >
      {embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title={embed.title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      ) : (
        <video
          src={embed.src}
          controls
          preload="metadata"
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}
