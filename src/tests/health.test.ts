import { describe, expect, it } from 'vitest';
import { playerMortality } from '@/engine/health/mortality';
import { healthTarget, processHealth, treatCondition, addCondition } from '@/engine/health/health';
import { beginSim, endSim } from '@/engine/simulation/helpers';
import { newGame } from './helpers';

function at(age: number, seed = 60) {
  const sim = beginSim(newGame(seed));
  sim.s.people[sim.s.playerId].birthYear = sim.s.year - age;
  return sim;
}

describe('health and mortality', () => {
  it('mortality rises steeply with age', () => {
    const q = [5, 30, 60, 80, 95].map((a) => playerMortality(endSim(at(a))));
    for (let i = 1; i < q.length; i++) expect(q[i]).toBeGreaterThan(q[i - 1]);
    expect(q[1]).toBeLessThan(0.003);
    expect(q[4]).toBeGreaterThan(0.1);
  });

  it('poor health and serious illness increase mortality', () => {
    const a = at(50);
    const base = playerMortality(a.s);
    a.s.people[a.s.playerId].stats.health = 20;
    const sick = playerMortality(a.s);
    expect(sick).toBeGreaterThan(base * 2);
    addCondition(a, 'cancer', 90);
    expect(playerMortality(a.s)).toBeGreaterThan(sick);
  });

  it('health target declines with age and improves with fitness', () => {
    const young = at(25);
    const old = at(85);
    expect(healthTarget(young.s)).toBeGreaterThan(healthTarget(old.s));
    const fit = at(50);
    fit.s.people[fit.s.playerId].stats.fitness = 95;
    const unfit = at(50);
    unfit.s.people[unfit.s.playerId].stats.fitness = 5;
    expect(healthTarget(fit.s)).toBeGreaterThan(healthTarget(unfit.s));
  });

  it('keeps stats inside 0–100 over many years', () => {
    const sim = at(20);
    for (let y = 0; y < 80; y++) {
      sim.s.year += 1;
      processHealth(sim);
      for (const v of Object.values(sim.s.people[sim.s.playerId].stats)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('treatment can cure or control conditions and costs money', () => {
    const sim = at(40);
    sim.s.finances.cash = 200_000;
    addCondition(sim, 'pneumonia', 60);
    let cured = false;
    for (let i = 0; i < 3 && !cured; i++) {
      treatCondition(sim, 'pneumonia', true);
      cured = !sim.s.health.conditions.some((c) => c.id === 'pneumonia');
    }
    expect(sim.s.finances.cash).toBeLessThan(200_000);
    expect(sim.s.health.doctorVisitsThisYear).toBeGreaterThan(0);
  });
});
