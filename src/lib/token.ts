import { randomBytes } from "node:crypto";

/** Token secreto para links (24 bytes → 32 chars base64url). */
export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(value);
}
