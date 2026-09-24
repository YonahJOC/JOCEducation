import React from "react";
import { C } from "@/lib/joc-tokens";

/**
 * The small amount of formatting a lesson actually needs.
 *
 * Not a rich-text editor and not Markdown — a teacher writing a lesson step
 * wants to emphasise a phrase, list three things, and occasionally link out.
 * A full editor would be a fortnight of work and a lifetime of paste bugs.
 *
 * Understood, and nothing else:
 *
 *   **bold**            a phrase in bold
 *   *italic*            a phrase in italic
 *   - item              a bullet, one per line
 *   1. item             a numbered point, one per line
 *   [text](https://…)   a link, http and https only
 *
 * Everything is escaped first, so what a teacher types can never become
 * markup. A stray asterisk stays a stray asterisk.
 */

type Piece = { kind: "p" | "ul" | "ol"; lines: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBER = /^\s*\d+[.)]\s+(.*)$/;

function group(text: string): Piece[] {
  const out: Piece[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;

    const bullet = BULLET.exec(line);
    const numbered = NUMBER.exec(line);
    const kind: Piece["kind"] = bullet ? "ul" : numbered ? "ol" : "p";
    const content = bullet?.[1] ?? numbered?.[1] ?? line;

    const last = out[out.length - 1];
    // Consecutive lines of the same list join it; paragraphs stay separate.
    if (last && last.kind === kind && kind !== "p") last.lines.push(content);
    else out.push({ kind, lines: [content] });
  }
  return out;
}

/** Inline marks, applied to already-plain text. */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // One pass, longest marker first so ** wins over *.
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;

    if (m[1] !== undefined) {
      nodes.push(<strong key={key}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={key}>{m[2]}</em>);
    } else if (m[3] !== undefined && m[4] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={m[4]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.blue, fontWeight: 600 }}
        >
          {m[3]}
        </a>
      );
    }
    last = pattern.lastIndex;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function RichText({
  text, style,
}: {
  text: string;
  /** Applied to each paragraph and list, so callers keep their typography. */
  style?: React.CSSProperties;
}) {
  const pieces = group(text);
  if (pieces.length === 0) return null;

  return (
    <>
      {pieces.map((piece, i) => {
        if (piece.kind === "p") {
          return (
            <p key={i} style={{ margin: i === 0 ? "0 0 10px" : "0 0 10px", ...style }}>
              {inline(piece.lines[0], `p${i}`)}
            </p>
          );
        }

        const List = piece.kind === "ul" ? "ul" : "ol";
        return (
          <List key={i} style={{ margin: "0 0 10px", paddingLeft: "22px", ...style }}>
            {piece.lines.map((line, j) => (
              <li key={j} style={{ marginBottom: "4px" }}>{inline(line, `l${i}-${j}`)}</li>
            ))}
          </List>
        );
      })}
    </>
  );
}

/** The one-line reminder to show under a field that accepts this. */
export const RICH_TEXT_HINT =
  "**bold**, *italic*, - for a bullet, 1. for a numbered point, [words](https://link)";
