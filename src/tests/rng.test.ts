import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/probability/rng';

describe('seeded RNG', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(123);
    const b = createRng(123);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('can be resumed from its stored state', () => {
    const a = createRng(99);
    a.next();
    a.next();
    const resumed = createRng(a.state);
    expect(resumed.next()).toBe(a.next());
  });
  it('produces values within bounds', () => {
    const r = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const v = r.int(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });
  it('weighted pick respects zero weights', () => {
    const r = createRng(5);
    for (let i = 0; i < 500; i++) expect(r.weighted(['a', 'b', 'c'], (x) => (x === 'b' ? 0 : 1))).not.toBe('b');
    expect(r.weighted(['a'], () => 0)).toBeUndefined();
  });
  it('is roughly uniform', () => {
    const r = createRng(2024);
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 40000; i++) buckets[Math.floor(r.next() * 4)]++;
    for (const b of buckets) expect(Math.abs(b - 10000)).toBeLessThan(500);
  });
});
