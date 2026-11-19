/**
 * Mass headless simulation. Run with `npm run sim` (default 300 lives) or
 * `SIM_LIVES=2000 npm run sim` for a larger sample. Prints a balance report and
 * fails on impossible states, crashes or out-of-band statistics.
 */
import { describe, expect, it } from 'vitest';
import { simulateLife, type LifeReport } from '@/engine/simulation/headless';

const LIVES = Number(process.env.SIM_LIVES ?? 300);
const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

describe(`mass simulation of ${LIVES} lives`, () => {
  const reports: LifeReport[] = [];
  const crashes: string[] = [];
  it('simulates without crashes', () => {
    for (let i = 0; i < LIVES; i++) {
      const seed = 100_000 + i * 7_919;
      try {
        const r = simulateLife(seed, { recklessness: i % 5 === 0 ? 0.9 : 0.25 }, i % 10 === 0 ? 2 : 0);
        reports.push({ ...r, state: undefined as never });
      } catch (e) {
        crashes.push(`${seed}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    expect(crashes).toEqual([]);
  });

  it('never produces impossible states', () => {
    const bad = reports.filter((r) => r.problems.length > 0).map((r) => `${r.seed}: ${r.problems[0]}`);
    expect(bad).toEqual([]);
  });

  it('has a plausible life expectancy and no excessive early mortality', () => {
    const ages = reports.map((r) => r.ageAtDeath);
    const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
    const under40 = ages.filter((a) => a < 40).length / ages.length;
    const over100 = ages.filter((a) => a >= 100).length / ages.length;
    console.log(`Life expectancy: mean ${mean.toFixed(1)}, median ${pct(ages, 50)}, p10 ${pct(ages, 10)}, p90 ${pct(ages, 90)}; <40: ${(under40 * 100).toFixed(1)} %, 100+: ${(over100 * 100).toFixed(2)} %`);
    expect(mean).toBeGreaterThan(65);
    expect(mean).toBeLessThan(92);
    expect(under40).toBeLessThan(0.12);
  });

  it('keeps wealth accumulation within realistic bounds', () => {
    const nw = reports.map((r) => r.netWorthReal);
    const peak = reports.map((r) => r.peakNetWorthReal);
    console.log(`Net worth at death (real NOK): p10 ${Math.round(pct(nw, 10))}, median ${Math.round(pct(nw, 50))}, p90 ${Math.round(pct(nw, 90))}, p99 ${Math.round(pct(nw, 99))}, max peak ${Math.round(Math.max(...peak))}`);
    expect(pct(nw, 50)).toBeLessThan(60_000_000);
    expect(Math.max(...peak)).toBeLessThan(5_000_000_000);
  });

  it('does not repeat events excessively', () => {
    const repeats = reports.map((r) => r.maxRepeats);
    const unique = reports.map((r) => r.uniqueEvents);
    console.log(`Events per life: median unique ${pct(unique, 50)}, max repeats of one event ${Math.max(...repeats)}`);
    expect(Math.max(...repeats)).toBeLessThanOrEqual(6);
    expect(pct(unique, 50)).toBeGreaterThan(40);
  });

  it('supports multiple generations', () => {
    const multi = reports.filter((r) => r.generation > 1).length;
    console.log(`Lives continued into later generations: ${multi}`);
    expect(multi).toBeGreaterThan(0);
  });
});
