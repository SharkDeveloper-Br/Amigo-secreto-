export type Rng = () => number;

export class NotEnoughPeopleError extends Error {
  constructor() {
    super("Precisa de pelo menos 3 pessoas para sortear.");
    this.name = "NotEnoughPeopleError";
  }
}

export class ImpossibleDrawError extends Error {
  constructor() {
    super("Com essas regras não dá pra sortear. Tira alguma exclusão e tenta de novo.");
    this.name = "ImpossibleDrawError";
  }
}

/** RNG determinístico (mulberry32) para testes. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** RNG seguro padrão (crypto). */
export function cryptoRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sorteia quem tira quem.
 * Emparelhamento bipartido (Kuhn) com ordem embaralhada:
 * sempre acha solução se existir e é aleatório.
 *
 * @param ids participantes
 * @param exclusions pares [quemDá, quemNãoPodeReceber]
 * @returns Map quemDá → quemRecebe
 */
export function draw(
  ids: string[],
  exclusions: ReadonlyArray<readonly [string, string]>,
  rng: Rng = cryptoRng,
): Map<string, string> {
  if (new Set(ids).size !== ids.length) throw new Error("Participantes repetidos.");
  if (ids.length < 3) throw new NotEnoughPeopleError();

  const blocked = new Set(exclusions.map(([g, r]) => `${g}\u0000${r}`));
  const givers = shuffle(ids, rng);
  const options = new Map<string, string[]>();
  for (const g of givers) {
    options.set(
      g,
      shuffle(
        ids.filter((r) => r !== g && !blocked.has(`${g}\u0000${r}`)),
        rng,
      ),
    );
  }

  const receiverOf = new Map<string, string>(); // receiver → giver

  const tryAssign = (giver: string, seen: Set<string>): boolean => {
    for (const r of options.get(giver)!) {
      if (seen.has(r)) continue;
      seen.add(r);
      const current = receiverOf.get(r);
      if (current === undefined || tryAssign(current, seen)) {
        receiverOf.set(r, giver);
        return true;
      }
    }
    return false;
  };

  for (const g of givers) {
    if (!tryAssign(g, new Set())) throw new ImpossibleDrawError();
  }

  const result = new Map<string, string>();
  for (const g of ids) result.set(g, "");
  for (const [r, g] of receiverOf) result.set(g, r);
  return result;
}
