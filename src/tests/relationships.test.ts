import { describe, expect, it } from 'vitest';
import { interact, availableInteractions } from '@/engine/relationships/interactions';
import { processRelationships, marry, divorce, haveChild, createRomanticInterest, startDating } from '@/engine/relationships/relationships';
import { beginSim, endSim, relsOf } from '@/engine/simulation/helpers';
import { validateState } from '@/engine/simulation/validate';
import { newGame } from './helpers';

function adultSim(seed: number) {
  const sim = beginSim(newGame(seed));
  sim.s.people[sim.s.playerId].birthYear = sim.s.year - 28;
  sim.s.livingWithParents = false;
  sim.s.finances.cash = 500_000;
  return sim;
}

describe('relationships', () => {
  it('spending time increases closeness with diminishing returns', () => {
    const sim = adultSim(40);
    const mom = relsOf(sim.s, 'mother')[0];
    mom.strength = 40;
    const gains: number[] = [];
    for (let i = 0; i < 4; i++) {
      const before = mom.strength;
      interact(sim, mom.personId, 'conversation');
      gains.push(mom.strength - before);
    }
    expect(gains[0]).toBeGreaterThan(0);
    expect(gains[3]).toBeLessThanOrEqual(gains[0]);
  });

  it('limits interactions per person per year', () => {
    const sim = adultSim(41);
    const mom = relsOf(sim.s, 'mother')[0];
    for (let i = 0; i < 6; i++) interact(sim, mom.personId, 'compliment');
    expect(interact(sim, mom.personId, 'compliment').ok).toBe(false);
  });

  it('neglected friendships fade over the years', () => {
    const sim = adultSim(42);
    const f = createRomanticInterest(sim);
    sim.s.relationships[f.id] = { personId: f.id, kind: 'friend', strength: 30, trust: 30, attraction: 0, loyalty: 50, since: sim.s.year, status: 'active', interactions: 0, owes: 0 };
    for (let i = 0; i < 12; i++) processRelationships(sim);
    expect(sim.s.relationships[f.id]?.strength ?? 0).toBeLessThan(30);
  });

  it('marriage and divorce keep the family consistent', () => {
    const sim = adultSim(43);
    const p = createRomanticInterest(sim);
    startDating(sim, p);
    marry(sim, p.id, 0);
    expect(sim.s.people[sim.s.playerId].spouseId).toBe(p.id);
    expect(relsOf(sim.s, 'spouse')).toHaveLength(1);
    divorce(sim, p.id);
    expect(sim.s.people[sim.s.playerId].spouseId).toBeUndefined();
    expect(sim.s.relationships[p.id].kind).toBe('ex');
    expect(validateState(endSim(sim))).toEqual([]);
  });

  it('children get correct parents and the player as a parent', () => {
    const sim = adultSim(44);
    const p = createRomanticInterest(sim);
    startDating(sim, p);
    const baby = haveChild(sim);
    expect(baby).not.toBeNull();
    if (!baby) return;
    expect(sim.s.people[sim.s.playerId].childrenIds).toContain(baby.id);
    expect(baby.birthYear).toBe(sim.s.year);
    const parents = [baby.motherId, baby.fatherId];
    expect(parents).toContain(sim.s.playerId);
    expect(validateState(endSim(sim))).toEqual([]);
  });

  it('offers romance actions only to suitable people', () => {
    const sim = adultSim(45);
    const mom = relsOf(sim.s, 'mother')[0];
    const ids = availableInteractions(sim.s, mom).map((x) => x.id);
    expect(ids).not.toContain('askOut');
    expect(ids).not.toContain('propose');
    expect(ids).toContain('conversation');
  });
});
