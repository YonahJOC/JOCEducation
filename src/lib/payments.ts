/**
 * Taking money.
 *
 * Stripe over `fetch`, with no SDK — the same choice as src/lib/email.ts. The
 * two calls this needs are a form POST and a signature check; a dependency
 * would be a hundred times the size of the code it replaces, and one more
 * thing to keep patched.
 *
 * Nothing here works until STRIPE_SECRET_KEY is set. That is deliberate and
 * visible: `isPaymentConfigured` is false, the checkout button says so, and a
 * paid form refuses to publish rather than taking somebody's registration and
 * quietly never charging them.
 */

export const isPaymentConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

/** Set once the webhook endpoint exists. Without it, webhooks are refused. */
export const isWebhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

const API = "https://api.stripe.com/v1";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://education.justonechesed.org"
  );
}

/** Stripe wants form encoding, including for nested keys like line_items[0][price_data][currency]. */
function encode(obj: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      out.push(...encode(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          out.push(...encode(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return out;
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * One payment, one thing. Returns the Stripe-hosted page to send them to.
 *
 * Deliberately Checkout rather than card fields on our own pages: JOC never
 * touches a card number, which is the difference between a short PCI
 * questionnaire and a long one.
 */
export async function createCheckout(input: {
  amountCents: number;
  /** What they are paying for, shown on the Stripe page and the receipt. */
  description: string;
  /** Where to send them afterwards, relative to the site. */
  successPath: string;
  cancelPath: string;
  email?: string | null;
  /** Carried through the webhook so the payment can be matched back. */
  metadata?: Record<string, string>;
}): Promise<CheckoutResult> {
  if (!isPaymentConfigured) {
    return { ok: false, error: "Card payment is not switched on yet." };
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents < 50) {
    return { ok: false, error: "That amount is too small to charge." };
  }

  const base = siteUrl();
  const body = encode({
    mode: "payment",
    // Stripe appends the session id; the success page uses it to confirm.
    success_url: `${base}${input.successPath}?paid=1&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${input.cancelPath}?cancelled=1`,
    customer_email: input.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: { name: input.description.slice(0, 250) },
        },
      },
    ],
    metadata: input.metadata ?? {},
  }).join("&");

  try {
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      return { ok: false, error: json.error?.message ?? "Stripe refused that payment." };
    }
    return { ok: true, url: json.url };
  } catch {
    return { ok: false, error: "Could not reach Stripe." };
  }
}

/**
 * Is this webhook really from Stripe?
 *
 * Without this check the endpoint is an open invitation to mark anything
 * paid. Stripe signs each delivery with a timestamp and an HMAC over
 * "timestamp.body"; both have to match, and the timestamp has to be recent,
 * or somebody can replay yesterday's genuine payment forever.
 */
export async function verifyWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: "No webhook secret set." };
  if (!signatureHeader) return { ok: false, error: "Unsigned." };

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=").map((x) => x.trim()) as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return { ok: false, error: "Malformed signature." };

  // Five minutes, matching Stripe's own tolerance.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return { ok: false, error: "Too old." };

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  // Constant time: a fast "wrong" leaks where the first wrong byte is.
  if (expected.length !== signature.length) return { ok: false, error: "Bad signature." };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, error: "Bad signature." };
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
