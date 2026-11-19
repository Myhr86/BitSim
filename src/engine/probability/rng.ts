/**
 * Seeded deterministic RNG (mulberry32). The state is a single uint32 stored in
 * GameState.rngState so a saved game always continues with the same random stream.
 */
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  range(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T | undefined;
  normal(mean: number, sd: number): number;
  shuffle<T>(items: readonly T[]): T[];
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => next() * (max - min) + min,
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('rng.pick on empty list');
      return items[Math.floor(next() * items.length)];
    },
    weighted: (items, weight) => {
      let total = 0;
      const ws = items.map((i) => {
        const w = Math.max(0, weight(i));
        total += w;
        return w;
      });
      if (total <= 0) return undefined;
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= ws[i];
        if (r <= 0 && ws[i] > 0) return items[i];
      }
      return items[items.length - 1];
    },
    normal: (mean, sd) => {
      const u = Math.max(1e-9, next());
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    shuffle: (items) => {
      const a = [...items];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    get state() {
      return s;
    },
  };
  return rng;
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
