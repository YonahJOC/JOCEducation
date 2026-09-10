/**
 * Sending mail.
 *
 * Resend over plain fetch — no dependency, and nothing to install before it
 * works. Two environment variables switch it on:
 *
 *   RESEND_API_KEY   from resend.com
 *   EMAIL_FROM       e.g. "JOC Education <education@justonechesed.org>",
 *                    on a domain verified in Resend
 *
 * Until both exist, `isEmailConfigured` is false and every caller is expected
 * to say so rather than claim a message was sent. A page that promises "check
 * your inbox" when nothing was sent leaves a locked-out teacher waiting.
 */

export const isEmailConfigured = Boolean(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM
);

/** Where links in emails point. */
export function siteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://education.justonechesed.org";
  return base.replace(/\/$/, "");
}

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; notConfigured?: true };

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  /** Plain text. Always sent — some readers never render the HTML. */
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (!isEmailConfigured) {
    return { ok: false, error: "Email is not switched on yet.", notConfigured: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      // Resend's message is useful (unverified domain, bad key) and safe to
      // keep in the server log, but never worth showing a visitor.
      const detail = await res.text().catch(() => "");
      console.error("Resend refused a message:", res.status, detail.slice(0, 400));
      return { ok: false, error: "The message could not be sent." };
    }

    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: body?.id ?? null };
  } catch (e) {
    console.error("Sending mail failed:", e);
    return { ok: false, error: "The message could not be sent." };
  }
}

const INK = "#10233F";
const BLUE = "#2D46AF";

/**
 * One plain layout for every message JOC sends. Table-based and inline-styled
 * because that is what mail clients render reliably.
 */
export function emailShell(opts: {
  heading: string;
  body: string[];
  action?: { label: string; href: string };
  footnote?: string;
}): string {
  const paras = opts.body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(p)}</p>`
    )
    .join("");

  const button = opts.action
    ? `<p style="margin:24px 0;"><a href="${escapeAttr(opts.action.href)}" style="display:inline-block;background:${BLUE};color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:9999px;padding:13px 26px;">${escapeHtml(opts.action.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:rgba(16,35,63,.55);">If the button does not work, copy this address into your browser:<br>${escapeHtml(opts.action.href)}</p>`
    : "";

  const foot = opts.footnote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(16,35,63,.55);">${escapeHtml(opts.footnote)}</p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF9F4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF9F4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(16,35,63,.1);border-radius:20px;">
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:#C96C00;">JOC EDUCATION</p>
          <h1 style="margin:0 0 20px;font-size:23px;line-height:1.2;letter-spacing:-.02em;color:${INK};">${escapeHtml(opts.heading)}</h1>
          ${paras}
          ${button}
          ${foot}
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:rgba(16,35,63,.5);">Just One Chesed, Inc. — a 501(c)(3) nonprofit organization</p>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
