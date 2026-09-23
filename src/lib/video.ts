/**
 * Turning a pasted video link into something playable.
 *
 * Whoever writes a program page will paste whatever link they have — the one
 * in the browser bar, the Share button's short link, a Vimeo page, sometimes
 * a file. Making them find an embed code would mean the video does not go up.
 * So this takes the link as given and works out how to play it.
 *
 * Nothing renders when there is no video. An empty 16:9 box on a live program
 * page reads as broken, not as "coming soon".
 */

export type Embed =
  | { kind: "iframe"; src: string; title: string }
  | { kind: "file"; src: string }
  | null;

/**
 * A link to something playable, or null.
 *
 * YouTube goes to youtube-nocookie.com: a school reads this page before it
 * has any relationship with us, and a program page should not hand them a
 * tracking cookie on the way past.
 */
export function toEmbed(url: string | null | undefined, title = "Promo video"): Embed {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;

  const host = u.hostname.replace(/^www\./, "");

  // youtu.be/ID · youtube.com/watch?v=ID · /embed/ID · /shorts/ID · /live/ID
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}`, title } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    const path = u.pathname.split("/").filter(Boolean);
    const id = v ?? (["embed", "shorts", "live", "v"].includes(path[0]) ? path[1] : null);
    return id ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}`, title } : null;
  }

  // vimeo.com/ID · vimeo.com/ID/HASH (unlisted) · player.vimeo.com/video/ID
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const path = u.pathname.split("/").filter(Boolean);
    const i = path[0] === "video" ? 1 : 0;
    const id = /^\d+$/.test(path[i] ?? "") ? path[i] : null;
    if (!id) return null;
    // An unlisted video needs its hash, or the embed is refused.
    const hash = path[i + 1] && /^[a-z0-9]+$/i.test(path[i + 1]) ? `?h=${path[i + 1]}` : "";
    return { kind: "iframe", src: `https://player.vimeo.com/video/${id}${hash}`, title };
  }

  if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };

  return null;
}

