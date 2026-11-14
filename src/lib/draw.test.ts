import { describe, expect, it } from "vitest";
import { draw, ImpossibleDrawError, NotEnoughPeopleError, seededRng } from "./draw";

const people = ["ana", "bruno", "carla", "davi", "eva"];

function check(ids: string[], result: Map<string, string>) {
  expect(result.size).toBe(ids.length);
  expect(new Set(result.keys())).toEqual(new Set(ids));
  expect(new Set(result.values())).toEqual(new Set(ids));
  for (const [giver, receiver] of result) expect(giver).not.toBe(receiver);
}

describe("draw", () => {
  it("todos dão e recebem uma vez, ninguém tira a si mesmo", () => {
    for (let seed = 1; seed <= 200; seed++) {
      check(people, draw(people, [], seededRng(seed)));
    }
  });

  it("respeita exclusões", () => {
    const exclusions: [string, string][] = [
      ["ana", "bruno"],
      ["bruno", "ana"],
      ["carla", "davi"],
    ];
    for (let seed = 1; seed <= 200; seed++) {
      const r = draw(people, exclusions, seededRng(seed));
      check(people, r);
      expect(r.get("ana")).not.toBe("bruno");
      expect(r.get("bruno")).not.toBe("ana");
      expect(r.get("carla")).not.toBe("davi");
    }
  });

  it("acha a única solução possível", () => {
    // ana só pode tirar bruno, bruno só carla, carla só ana
    const ids = ["ana", "bruno", "carla"];
    const r = draw(ids, [["ana", "carla"], ["bruno", "ana"], ["carla", "bruno"]], seededRng(7));
    expect(Object.fromEntries(r)).toEqual({ ana: "bruno", bruno: "carla", carla: "ana" });
  });

  it("erro quando é impossível", () => {
    const ids = ["ana", "bruno", "carla"];
    expect(() => draw(ids, [["ana", "bruno"], ["ana", "carla"]], seededRng(1))).toThrow(
      ImpossibleDrawError,
    );
  });

  it("erro com menos de 3 pessoas", () => {
    expect(() => draw(["ana", "bruno"], [])).toThrow(NotEnoughPeopleError);
  });

  it("erro com ids repetidos", () => {
    expect(() => draw(["ana", "ana", "bruno"], [])).toThrow();
  });

  it("resultado varia (é aleatório)", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      seen.add(JSON.stringify([...draw(people, [], seededRng(seed))]));
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it("aguenta grupo grande", () => {
    const ids = Array.from({ length: 200 }, (_, i) => `p${i}`);
    check(ids, draw(ids, []));
  });
});
