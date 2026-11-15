import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("celular BR com DDD vira 55 + número", () => {
    expect(normalizePhone("(11) 98765-4321")).toBe("5511987654321");
    expect(normalizePhone("11 98765 4321")).toBe("5511987654321");
  });
  it("fixo BR com DDD", () => {
    expect(normalizePhone("1133334444")).toBe("551133334444");
  });
  it("já com +55 ou 55", () => {
    expect(normalizePhone("+55 11 98765-4321")).toBe("5511987654321");
    expect(normalizePhone("5511987654321")).toBe("5511987654321");
  });
  it("internacional com +", () => {
    expect(normalizePhone("+1 415 555 2671")).toBe("14155552671");
    expect(normalizePhone("+351 912 345 678")).toBe("351912345678");
  });
  it("vazio → null", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
  });
  it("inválido → erro", () => {
    expect(() => normalizePhone("123")).toThrow();
    expect(() => normalizePhone("abc")).toThrow();
    expect(() => normalizePhone("98765-4321")).toThrow(); // sem DDD
    expect(() => normalizePhone("+1234567890123456")).toThrow();
  });
});

describe("formatPhone", () => {
  it("formata BR", () => {
    expect(formatPhone("5511987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("551133334444")).toBe("(11) 3333-4444");
  });
  it("outros países com +", () => {
    expect(formatPhone("14155552671")).toBe("+14155552671");
  });
});
