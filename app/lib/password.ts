import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/* Passwords, stored so that reading the database tells an attacker nothing.

   scrypt is deliberately slow and memory-hard, which is what makes guessing
   expensive; it ships with Node, so there is no dependency to keep patched.
   Each password gets its own salt, so two people choosing the same one still
   store different bytes. */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

/** Constant-time, and false rather than a throw for anything malformed. */
export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(keyHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    KEY_LENGTH,
  );
  return timingSafeEqual(actual, expected);
}

/* What a password has to clear. Length does more for safety than a character
   zoo, so that is what is asked for, and the message says the rule plainly. */
export const PASSWORD_MIN = 8;
export const passwordProblem = (password: string) =>
  password.length < PASSWORD_MIN ? "short" : null;
