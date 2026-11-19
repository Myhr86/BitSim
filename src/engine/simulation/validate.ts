import type { GameState } from '@/types/game';
import { STAT_KEYS } from '@/types/core';

/**
 * Structural invariants of a game state. Used before simulating a year, when loading a
 * save, and by the headless mass-simulation tests. Returns human-readable problems.
 */
export function validateState(s: GameState): string[] {
  const problems: string[] = [];
  const p = s.people[s.playerId];
  if (!p) return ['Missing player'];
  if (s.year - p.birthYear < 0) problems.push('Negative player age');
  for (const k of STAT_KEYS) {
    const v = p.stats[k];
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 100) problems.push(`Invalid stat ${k}=${v}`);
  }
  if (!Number.isFinite(s.finances.cash)) problems.push('Non-finite cash');
  for (const key of ['savingsAccount', 'funds', 'stocks', 'pensionSavings'] as const) {
    if (!Number.isFinite(s.finances[key]) || s.finances[key] < -1) problems.push(`Invalid ${key}`);
  }
  for (const d of s.finances.debts) if (!Number.isFinite(d.principal) || d.principal < 0) problems.push(`Invalid debt ${d.id}`);
  for (const a of s.assets) if (!Number.isFinite(a.value) || a.value < 0) problems.push(`Invalid asset ${a.id}`);
  for (const r of Object.values(s.relationships)) {
    if (!s.people[r.personId]) problems.push(`Relationship to missing person ${r.personId}`);
    if (r.personId === s.playerId) problems.push('Relationship with self');
  }
  // Family consistency: a parent must be older than their child.
  for (const person of Object.values(s.people)) {
    for (const pid of [person.motherId, person.fatherId]) {
      if (!pid) continue;
      const parent = s.people[pid];
      if (!parent) continue;
      if (parent.birthYear >= person.birthYear) problems.push(`Parent ${pid} not older than child ${person.id}`);
    }
    if (person.birthYear > s.year) problems.push(`Unborn person ${person.id}`);
  }
  if (s.crime.prisonYearsLeft < 0) problems.push('Negative prison time');
  return problems;
}
