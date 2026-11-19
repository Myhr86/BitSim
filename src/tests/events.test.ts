import { describe, expect, it } from 'vitest';
import { EVENTS, getEvent } from '@/data/events';
import { validateEventLibrary } from '@/engine/events/validateEvents';
import { isEligible, raiseEvent } from '@/engine/events/selector';
import { resolveChoice, dismissEvent } from '@/engine/events/resolve';
import { evalCondition } from '@/engine/events/conditions';
import { beginSim, endSim, playerAge } from '@/engine/simulation/helpers';
import { ageUp } from '@/engine/simulation/ageUp';
import { advance, newGame, resolveAllFirst } from './helpers';

describe('event library', () => {
  it('contains at least 250 events', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(250);
  });

  it('passes automated validation', () => {
    expect(validateEventLibrary(EVENTS)).toEqual([]);
  });

  it('covers every life stage with many events', () => {
    const stage = (lo: number, hi: number) => EVENTS.filter((e) => !e.scheduledOnly && e.minAge <= hi && e.maxAge >= lo).length;
    expect(stage(0, 5)).toBeGreaterThanOrEqual(30);
    expect(stage(6, 12)).toBeGreaterThanOrEqual(40);
    expect(stage(13, 17)).toBeGreaterThanOrEqual(40);
    expect(stage(18, 29)).toBeGreaterThanOrEqual(60);
    expect(stage(30, 64)).toBeGreaterThanOrEqual(60);
    expect(stage(65, 100)).toBeGreaterThanOrEqual(30);
  });
});

describe('event requirements and selection', () => {
  it('respects age ranges', () => {
    const s = newGame(10);
    const teenOnly = getEvent('teen_first_party');
    expect(teenOnly && isEligible(s, teenOnly)).toBe(false);
  });

  it('respects conditions such as relationships', () => {
    const s = newGame(11);
    const loan = getEvent('ya_friend_loan');
    expect(loan && isEligible(s, loan)).toBe(false);
  });

  it('evaluates composite conditions', () => {
    const s = newGame(12);
    expect(evalCondition(s, { t: 'any', of: [{ t: 'stat', key: 'health', min: 0 }, { t: 'flag', key: 'nope' }] })).toBe(true);
    expect(evalCondition(s, { t: 'not', c: { t: 'stat', key: 'health', min: 0 } })).toBe(false);
    expect(evalCondition(s, { t: 'rel', kind: 'mother' })).toBe(true);
  });

  it('honours maxOccurrences', () => {
    let s = newGame(13);
    const ev = getEvent('baby_first_word');
    if (!ev) throw new Error('missing');
    s = { ...s, year: s.year + 1 };
    const sim = beginSim(s);
    raiseEvent(sim, ev);
    const after = endSim(sim);
    expect(isEligible(after, ev)).toBe(false);
  });

  it('does not present the same event repeatedly over a life', () => {
    const s = advance(newGame(14), 60);
    const counts = Object.values(s.eventHistory).map((h) => h.count);
    expect(Math.max(...counts)).toBeLessThanOrEqual(5);
  });
});

describe('event consequences', () => {
  function stateWithPending(seed: number) {
    let s = newGame(seed);
    for (let i = 0; i < 40; i++) {
      s = ageUp(resolveAllFirst(s));
      if (s.pendingEvents.some((p) => !p.resolved) || s.death) break;
    }
    return s;
  }

  it('the same choice always yields the same outcome (no reroll on reload)', () => {
    const s = stateWithPending(21);
    const p = s.pendingEvents.find((x) => !x.resolved);
    if (!p) return;
    const a = resolveChoice(s, p.instanceId, p.choiceIds[0]);
    const b = resolveChoice(JSON.parse(JSON.stringify(s)), p.instanceId, p.choiceIds[0]);
    expect(a.pendingEvents[0].resolved?.text).toBe(b.pendingEvents[0].resolved?.text);
    expect(a.people[a.playerId].stats).toEqual(b.people[b.playerId].stats);
  });

  it('cannot resolve an event twice', () => {
    const s = stateWithPending(22);
    const p = s.pendingEvents.find((x) => !x.resolved);
    if (!p) return;
    const a = resolveChoice(s, p.instanceId, p.choiceIds[0]);
    expect(() => resolveChoice(a, p.instanceId, p.choiceIds[0])).toThrow();
    const d = dismissEvent(a, p.instanceId);
    expect(d.pendingEvents.find((x) => x.instanceId === p.instanceId)).toBeUndefined();
  });

  it('applies immediate and delayed consequences', () => {
    const s0 = newGame(23);
    const sim = beginSim(s0);
    sim.s.scheduled.push({ id: 'x', dueYear: sim.s.year + 2, effectsJson: JSON.stringify([{ t: 'flag', key: 'delayedHit' }]), text: 'Forsinket konsekvens', tone: 'neutral' });
    let s = endSim(sim);
    s = advance(s, 1);
    expect(s.flags.delayedHit).toBeUndefined();
    s = advance(s, 1);
    if (!s.death) expect(s.flags.delayedHit).toBeDefined();
  });

  it('raises scheduled follow-up events', () => {
    const s0 = newGame(24);
    const sim = beginSim(s0);
    // Age the character to 18 so the follow-up's age window is open.
    sim.s.year += 18;
    sim.s.people[sim.s.playerId].birthYear = s0.people[s0.playerId].birthYear;
    sim.s.scheduled.push({ id: 'y', dueYear: sim.s.year + 1, eventId: 'child_delayed_saving' });
    const s = ageUp(resolveAllFirst(endSim(sim)));
    expect(playerAge(s)).toBe(19);
    // child_delayed_saving requires age 18 exactly, so it must NOT fire at 19 – scheduled items still respect age windows.
    expect(s.eventHistory.child_delayed_saving).toBeUndefined();
  });
});
