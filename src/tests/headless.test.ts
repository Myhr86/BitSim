import { describe, expect, it } from 'vitest';
import { simulateLife } from '@/engine/simulation/headless';

describe('headless full-life simulation', () => {
  it('plays complete lives without invalid states', () => {
    for (let i = 0; i < 12; i++) {
      const r = simulateLife(1000 + i * 31, { recklessness: i % 4 === 0 ? 0.9 : 0.2 });
      expect(r.problems, `seed ${r.seed}`).toEqual([]);
      expect(r.ageAtDeath).toBeGreaterThanOrEqual(0);
      expect(r.ageAtDeath).toBeLessThan(125);
      expect(r.state.death).not.toBeNull();
    }
  }, 120_000);

  it('remains playable over multiple generations', () => {
    let generationsReached = 1;
    for (let i = 0; i < 6; i++) {
      const r = simulateLife(5000 + i * 17, { recklessness: 0.2 }, 3);
      expect(r.problems, `seed ${r.seed}`).toEqual([]);
      generationsReached = Math.max(generationsReached, r.generation);
    }
    expect(generationsReached).toBeGreaterThanOrEqual(2);
  }, 180_000);
});
