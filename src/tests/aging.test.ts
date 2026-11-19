import { describe, expect, it } from 'vitest';
import { ageUp, AgeUpBlocked } from '@/engine/simulation/ageUp';
import { playerAge, lifeStage } from '@/engine/simulation/helpers';
import { validateState } from '@/engine/simulation/validate';
import { serializeSave, parseSave } from '@/services/saveFormat';
import { advance, newGame, resolveAllFirst } from './helpers';

describe('aging pipeline', () => {
  it('starts a newborn with a valid family', () => {
    const s = newGame(1);
    expect(playerAge(s)).toBe(0);
    expect(validateState(s)).toEqual([]);
    const kinds = Object.values(s.relationships).map((r) => r.kind);
    expect(kinds).toContain('mother');
    expect(kinds).toContain('father');
    expect(s.timeline.length).toBeGreaterThan(0);
  });

  it('advances age and calendar year by exactly one', () => {
    const s0 = resolveAllFirst(newGame(2));
    const s1 = ageUp(s0);
    expect(s1.year).toBe(s0.year + 1);
    expect(playerAge(s1)).toBe(1);
  });

  it('does not mutate the input state', () => {
    const s0 = resolveAllFirst(newGame(3));
    const snapshot = JSON.stringify(s0);
    ageUp(s0);
    expect(JSON.stringify(s0)).toBe(snapshot);
  });

  it('blocks aging while an event is unresolved', () => {
    let s = newGame(4);
    for (let i = 0; i < 30; i++) {
      s = ageUp(resolveAllFirst(s));
      if (s.pendingEvents.some((p) => !p.resolved)) break;
    }
    expect(s.pendingEvents.some((p) => !p.resolved)).toBe(true);
    expect(() => ageUp(s)).toThrow(AgeUpBlocked);
  });

  it('is deterministic: same seed and choices give the same life', () => {
    const a = advance(newGame(55), 25);
    const b = advance(newGame(55), 25);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('save/reload in the middle of a year never duplicates income', () => {
    let s = advance(newGame(6), 30);
    const reloaded = parseSave(serializeSave(s));
    // Aging from the reloaded copy yields exactly the same result as from the original.
    s = resolveAllFirst(s);
    const r = resolveAllFirst(reloaded);
    expect(JSON.stringify(ageUp(r).finances)).toBe(JSON.stringify(ageUp(s).finances));
    expect(ageUp(r).finances.history.length).toBe(ageUp(s).finances.history.length);
  });

  it('moves through life stages', () => {
    expect(lifeStage(3)).toBe('baby');
    expect(lifeStage(10)).toBe('child');
    expect(lifeStage(15)).toBe('teen');
    expect(lifeStage(22)).toBe('youngAdult');
    expect(lifeStage(45)).toBe('adult');
    expect(lifeStage(80)).toBe('senior');
  });

  it('enrols children in school automatically', () => {
    const s = advance(newGame(8), 7);
    if (!s.death) expect(s.education.current?.programId ?? s.education.credentials[0]?.programId).toBeDefined();
  });

  it('keeps NPC ages in sync with the calendar', () => {
    const s0 = newGame(9);
    const mother = Object.values(s0.relationships).find((r) => r.kind === 'mother');
    const s = advance(s0, 10);
    const m = s.people[mother?.personId ?? ''];
    expect(s.year - m.birthYear).toBe(s0.year - s0.people[m.id].birthYear + (s.year - s0.year));
  });
});
