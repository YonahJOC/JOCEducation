"use client";

import { C, F, R, T, HIT } from "@/lib/joc-tokens";
import type { EditorStatus } from "@/lib/school-screen/editor-data";

/** The furniture the screen editors are built from. */

export function Section({ title, icon, note, children, tools }: {
  title: string; icon: string; note?: string; children: React.ReactNode; tools?: React.ReactNode;
}) {
  return (
    <section style={{
      background: C.white, borderRadius: R.hero, boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
      padding: "24px 26px", marginBottom: "20px",
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: note ? "6px" : "16px", flexWrap: "wrap" }}>
        <span aria-hidden="true" className="material-symbols-rounded" style={{
          width: "40px", height: "40px", borderRadius: "12px", background: C.blueTint, color: C.blue,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
          fontVariationSettings: '"FILL" 1, "wght" 600, "GRAD" 0, "opsz" 24',
        }}>{icon}</span>
        <h2 style={{ ...T.section, margin: 0, color: C.ink }}>{title}</h2>
        <span style={{ flex: 1 }} />
        {tools}
      </header>
      {note ? <p style={{ ...T.small, color: C.muted, margin: "0 0 16px", maxWidth: "70ch" }}>{note}</p> : null}
      {children}
    </section>
  );
}

/**
 * What each state is called to the person looking at it.
 *
 * Worded as where the thing has got to, not as what was done to it: somebody
 * glancing at a list wants to know whether their flyer is going up, and
 * "Endorsed" on its own does not answer that.
 */
const STATUS: Record<EditorStatus, [string, string, string]> = {
  PENDING: ["Waiting for an ambassador", C.orangeTint, C.orangeText],
  ENDORSED: ["Waiting for the school", C.blueTint, C.blue],
  APPROVED: ["On the screen", C.greenTint, C.green],
  SET_ASIDE: ["Set aside by an ambassador", C.panel, C.muted],
  REJECTED: ["Not approved", C.panel, C.muted],
};

export function StatusChip({ status, label }: { status: EditorStatus; label?: string }) {
  const [text, bg, fg] = STATUS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", borderRadius: "999px", padding: "4px 10px",
      background: bg, color: fg, fontFamily: F.data, fontSize: "11px", fontWeight: 600,
      letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{label ?? text}</span>
  );
}

export function Btn({ children, onClick, tone = "blue", disabled, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; tone?: "blue" | "quiet" | "danger" | "green";
  disabled?: boolean; type?: "button" | "submit";
}) {
  const look = {
    blue: { background: C.blue, color: C.white },
    green: { background: C.green, color: C.white },
    quiet: { background: C.blueTint, color: C.blue },
    danger: { background: "transparent", color: C.destructive },
  }[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...look, minHeight: HIT, padding: "0 16px", border: 0, borderRadius: R.button,
        fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "12px" }}>
      {/* The hint drops to its own line rather than squeezing the label into
          two. Half-width on a phone — "Last name" beside "or just an initial
          — up to you" — is where this showed. */}
      <span style={{ display: "flex", flexWrap: "wrap", gap: "2px 6px", alignItems: "baseline", marginBottom: "5px" }}>
        <span style={{ ...T.meta, color: C.ink, whiteSpace: "nowrap" }}>{label}</span>
        {hint ? <span style={{ ...T.small, color: C.faint, fontSize: "12.5px" }}>{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", minHeight: HIT, padding: "9px 12px",
  border: `1px solid ${C.hairline}`, borderRadius: R.form, background: C.white,
  fontFamily: F.ui, fontSize: "15px", color: C.ink,
};

export function Note({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: React.ReactNode }) {
  const look = {
    info: [C.blueTint, C.ink],
    warn: [C.orangeTint, C.orangeText],
    error: ["#FDECEA", C.destructive],
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} style={{
      background: look[0], color: look[1], borderRadius: R.form, padding: "10px 14px",
      ...T.small, margin: "8px 0",
    }}>{children}</div>
  );
}

/**
 * Shrink a picture in the browser before it is uploaded.
 *
 * Phone photos are 4–12 MB; the TV draws a 745-pixel panel. Sending the
 * original costs the student's data plan and the server's upload limit for
 * pixels nobody will ever see. 1600 on the long side is twice what the
 * screen needs and comes out well under a megabyte.
 */
export async function shrinkImage(file: File, max = 1600): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
