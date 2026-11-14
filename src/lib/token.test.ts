import { describe, expect, it } from "vitest";
import { looksLikeToken, newToken } from "./token";

describe("token", () => {
  it("gera token de 32 chars url-safe e único", () => {
    const set = new Set(Array.from({ length: 1000 }, newToken));
    expect(set.size).toBe(1000);
    for (const t of set) expect(looksLikeToken(t)).toBe(true);
  });
  it("recusa lixo", () => {
    expect(looksLikeToken("abc")).toBe(false);
    expect(looksLikeToken("../../etc/passwd/aaaaaaaaaaaaaaaaaaaa")).toBe(false);
  });
});
