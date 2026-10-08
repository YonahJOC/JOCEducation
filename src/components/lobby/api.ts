import { sanitizeDoc } from "@/lib/lobby/config";
import type { LobbyDoc } from "@/lib/lobby/types";

/**
 * Talking to the server.
 *
 * The standalone project sent a shared team passcode in a header. Here the
 * session cookie does it and the server checks the `lobby` permission, so
 * there is no secret for the panel to hold, remember or leak — and the one
 * error that used to need explaining ("that passcode didn't work") is now
 * simply not being allowed in.
 */

export class ApiError extends Error {
  constructor(public code: string, public status: number, public doc?: LobbyDoc) {
    super(code);
  }
}

async function call(path: string, init: RequestInit = {}): Promise<unknown> {
  let r: Response;
  try {
    r = await fetch("/api/lobby/" + path, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: { "content-type": "application/json", ...(init.headers || {}) },
    });
  } catch {
    throw new ApiError("offline", 0);
  }

  let body: { error?: string; doc?: unknown } | null = null;
  try {
    body = (await r.json()) as { error?: string; doc?: unknown };
  } catch {
    /* empty body */
  }

  if (!r.ok) {
    throw new ApiError(
      body?.error || "http-" + r.status,
      r.status,
      body?.doc ? sanitizeDoc(body.doc) : undefined,
    );
  }
  return body;
}

export const api = {
  getDoc: async () => sanitizeDoc(await call("doc")),
  putDoc: async (baseVersion: number, doc: LobbyDoc) =>
    sanitizeDoc(await call("doc", { method: "PUT", body: JSON.stringify({ baseVersion, doc }) })),
};

export function errorText(err: unknown): string {
  const code = err instanceof ApiError ? err.code : "";
  switch (code) {
    case "offline":
      return "No connection. Check the internet and try again.";
    case "not-allowed":
      return "Your account can't change the lobby screen. Ask a super admin for the lobby permission.";
    default:
      return "Something went wrong on the server. Try again in a moment.";
  }
}
