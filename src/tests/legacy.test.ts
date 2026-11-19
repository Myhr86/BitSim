import { describe, expect, it } from 'vitest';
import { die, continueAsHeir, heirs, buildSummary } from '@/engine/legacy/legacy';
import { haveChild, createRomanticInterest, startDating, marry } from '@/engine/relationships/relationships';
import { beginSim, endSim, playerAge, relsOf } from '@/engine/simulation/helpers';
import { validateState } from '@/engine/simulation/validate';
import { ageUp } from '@/engine/simulation/ageUp';
import { evaluateAchievements } from '@/engine/achievements/definitions';
import { advance, newGame } from './helpers';

function familySim(seed: number) {
  const sim = beginSim(newGame(seed));
  sim.s.people[sim.s.playerId].birthYear = sim.s.year - 30;
  sim.s.livingWithParents = false;
  const partner = createRomanticInterest(sim);
  startDating(sim, partner);
  marry(sim, partner.id, 0);
  haveChild(sim);
  sim.s.year += 2;
  haveChild(sim);
  sim.s.year += 40;
  sim.s.finances.cash = 3_000_000;
  return sim;
}

describe('death and legacy', () => {
  it('produces a life summary and obituary from real facts', () => {
    const sim = familySim(80);
    die(sim, 'alderdom');
    const s = endSim(sim);
    expect(s.death).not.toBeNull();
    expect(s.death?.summary.children).toBe(2);
    expect(s.death?.summary.obituary).toContain(s.people[s.playerId].firstName);
    expect(s.lineage).toHaveLength(1);
    expect(s.pendingEvents).toHaveLength(0);
    expect(buildSummary(s, 'x').legacyScore).toBeGreaterThan(0);
  });

  it('cannot age after death', () => {
    const sim = familySim(81);
    die(sim, 'alderdom');
    expect(() => ageUp(endSim(sim))).toThrow();
  });

  it('continues as a child with inheritance and a consistent family', () => {
    const sim = familySim(82);
    die(sim, 'hjertesvikt');
    const s = endSim(sim);
    const kids = heirs(s);
    expect(kids).toHaveLength(2);
    const next = continueAsHeir(s, kids[0].id);
    expect(next.playerId).toBe(kids[0].id);
    expect(next.generation).toBe(2);
    expect(next.death).toBeNull();
    expect(next.finances.cash).toBeGreaterThan(0);
    expect(next.finances.cash).toBeLessThan(3_000_000);
    expect(validateState(next)).toEqual([]);
    // The deceased parent is recorded as deceased, the sibling as a sibling.
    const parentRel = Object.values(next.relationships).find((r) => r.personId === s.playerId);
    expect(parentRel?.status).toBe('deceased');
    expect(relsOf(next, 'sibling')).toHaveLength(1);
    expect(playerAge(next)).toBeGreaterThan(30);
    expect(evaluateAchievements(next, new Set())).toContain('legacy2');
    // And the new life is playable.
    const later = advance(next, 3);
    expect(validateState(later)).toEqual([]);
  });

  it('rejects an invalid heir', () => {
    const sim = familySim(83);
    die(sim, 'x');
    const s = endSim(sim);
    const mother = relsOf(s, 'mother', true)[0];
    expect(() => continueAsHeir(s, mother.personId)).toThrow();
  });
});
