// Server-only. Never import from browser code.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption key for stored OAuth tokens.
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// Set APP_CONNECTION_ENCRYPTION_KEY in your .env.local file.
function key(): Buffer {
  const raw =
    process.env["APP_CONNECTION_ENCRYPTION_KEY"] ||
    process.env["APP_USER_CONNECTION_KEY_SECRET"]; // legacy compat
  if (!raw) throw new Error("APP_CONNECTION_ENCRYPTION_KEY is not set in .env.local");
  return Buffer.from(raw, "base64");
}

export function encryptConnectionKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptConnectionKey(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
