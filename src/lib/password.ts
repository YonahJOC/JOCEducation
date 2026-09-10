import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing for the interim email+password sign-in, using Node's
 * built-in scrypt — no third-party dependency, and scrypt is deliberately
 * memory-hard, which is what makes it a sound choice for passwords.
 *
 * Stored format:  scrypt$<N>$<salthex>$<keyhex>
 */

const scrypt = promisify(_scrypt) as (
  password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }
) => Promise<Buffer>;

const N = 16384; // CPU/memory cost
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (!Number.isFinite(n) || salt.length === 0 || expected.length === 0) return false;

  try {
    const actual = await scrypt(password, salt, expected.length, { N: n, r: R, p: P });
    // Constant-time comparison — never a plain ===
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Minimum bar for a password. Returns null when acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (/^\d+$/.test(password)) return "Use more than just numbers.";
  if (/^(.)\1+$/.test(password)) return "That is the same character repeated.";
  const common = ["password", "12345678", "qwerty", "letmein", "welcome", "justonechesed"];
  if (common.some((c) => password.toLowerCase().includes(c))) return "That is too easy to guess.";
  return null;
}

/** Readable one-time password for an admin to hand over. */
export function generateTempPassword(): string {
  const words = [
    "chesed", "torah", "shalom", "kindness", "mitzvah", "tzedakah",
    "simcha", "emes", "rachamim", "achdus", "hakaras", "middos",
  ];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const n = 100 + Math.floor(Math.random() * 900);
  return `${w1}-${w2}-${n}`;
}
