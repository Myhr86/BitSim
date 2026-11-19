import type { LifeStage, StatKey, Tone } from '@/types/core';
import type { GameState, Person, Relationship, RelKind, TxCategory } from '@/types/game';
import { clamp } from '@/utils/math';
import { createRng, type Rng } from '../probability/rng';

/** A mutable working copy of the game state plus its RNG, used inside one engine operation. */
export interface Sim {
  s: GameState;
  rng: Rng;
}

export function beginSim(state: GameState): Sim {
  const s = structuredClone(state);
  return { s, rng: createRng(s.rngState) };
}

export function endSim(sim: Sim): GameState {
  sim.s.rngState = sim.rng.state;
  return sim.s;
}

export function newId(s: GameState, prefix: string): string {
  s.idCounter += 1;
  return `${prefix}_${s.idCounter.toString(36)}`;
}

export function player(s: GameState): Person {
  return s.people[s.playerId];
}

export function ageOf(s: GameState, p: Person): number {
  const end = p.alive ? s.year : (p.deathYear ?? s.year);
  return Math.max(0, end - p.birthYear);
}

export function playerAge(s: GameState): number {
  return ageOf(s, player(s));
}

export function lifeStage(age: number): LifeStage {
  if (age <= 5) return 'baby';
  if (age <= 12) return 'child';
  if (age <= 17) return 'teen';
  if (age <= 29) return 'youngAdult';
  if (age <= 64) return 'adult';
  return 'senior';
}

export function changeStat(p: Person, key: StatKey, delta: number): void {
  p.stats[key] = clamp(Math.round((p.stats[key] + delta) * 10) / 10);
}

export function log(s: GameState, text: string, tone: Tone = 'neutral', title?: string, icon?: string): void {
  s.timeline.push({
    id: newId(s, 'tl'),
    age: playerAge(s),
    year: s.year,
    text,
    tone,
    title,
    icon,
  });
  // Keep the timeline bounded for save size; older entries are summarised by year in LifeSummary.
  if (s.timeline.length > 1500) s.timeline.splice(0, s.timeline.length - 1500);
}

export function addTx(s: GameState, amount: number, category: TxCategory, label: string): void {
  const rounded = Math.round(amount);
  if (rounded === 0) return;
  s.finances.cash += rounded;
  s.finances.transactions.push({
    id: newId(s, 'tx'),
    year: s.year,
    age: playerAge(s),
    amount: rounded,
    category,
    label,
  });
  if (s.finances.transactions.length > 400) s.finances.transactions.splice(0, s.finances.transactions.length - 400);
}

export function rel(s: GameState, personId: string): Relationship | undefined {
  return s.relationships[personId];
}

export function relsOf(s: GameState, kinds: RelKind | RelKind[], includeInactive = false): Relationship[] {
  const ks = Array.isArray(kinds) ? kinds : [kinds];
  return Object.values(s.relationships).filter(
    (r) =>
      ks.includes(r.kind) &&
      (includeInactive || r.status === 'active') &&
      (includeInactive || s.people[r.personId]?.alive),
  );
}

export function firstRel(s: GameState, kind: RelKind): Relationship | undefined {
  const list = relsOf(s, kind);
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => b.strength - a.strength)[0];
}

export function partnerRel(s: GameState): Relationship | undefined {
  return firstRel(s, 'spouse') ?? firstRel(s, 'partner');
}

export function addRelationship(
  s: GameState,
  personId: string,
  kind: RelKind,
  init: Partial<Omit<Relationship, 'personId' | 'kind'>> = {},
): Relationship {
  const r: Relationship = {
    personId,
    kind,
    strength: init.strength ?? 50,
    trust: init.trust ?? 50,
    attraction: init.attraction ?? 0,
    loyalty: init.loyalty ?? 50,
    since: init.since ?? s.year,
    status: init.status ?? 'active',
    interactions: 0,
    owes: init.owes ?? 0,
  };
  s.relationships[personId] = r;
  return r;
}

export function priceLevel(s: GameState): number {
  return s.economy.priceIndex;
}

export function flag(s: GameState, key: string): boolean {
  return (s.flags[key] ?? 0) > 0;
}

export function stageOf(s: GameState): LifeStage {
  return lifeStage(playerAge(s));
}
