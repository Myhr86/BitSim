import type { Appearance, EduLevel, Gender, Stats, TraitId } from '@/types/core';
import type { GameState, Person } from '@/types/game';
import { NO_FEMALE_NAMES, NO_LAST_NAMES, NO_MALE_NAMES, NO_OLD_FEMALE_NAMES, NO_OLD_MALE_NAMES } from '@/data/names/norway';
import { TRAITS } from '@/data/traits';
import { OCCUPATIONS, occupationExists } from '@/data/occupations';
import { EDU_RANK } from '@/types/core';
import { clamp } from '@/utils/math';
import type { Rng } from '../probability/rng';
import { newId } from '../simulation/helpers';

/** First names follow fashion: people born before ~1960 get traditional names. */
export function randomFirstName(rng: Rng, gender: Gender, birthYear = 2026): string {
  const oldShare = birthYear < 1940 ? 0.9 : birthYear < 1960 ? 0.6 : birthYear < 1980 ? 0.25 : 0;
  const old = rng.chance(oldShare);
  if (gender === 'male') return rng.pick(old ? NO_OLD_MALE_NAMES : NO_MALE_NAMES);
  return rng.pick(old ? NO_OLD_FEMALE_NAMES : NO_FEMALE_NAMES);
}

export function randomLastName(rng: Rng): string {
  return rng.pick(NO_LAST_NAMES);
}

export function randomLook(rng: Rng): Appearance {
  return { skin: rng.int(0, 5), hair: rng.int(0, 6), hairStyle: rng.int(0, 4), eyes: rng.int(0, 3) };
}

export function randomTraits(rng: Rng, count: number): TraitId[] {
  const out: TraitId[] = [];
  const pool = rng.shuffle(TRAITS);
  for (const t of pool) {
    if (out.length >= count) break;
    if (t.opposite && out.includes(t.opposite)) continue;
    out.push(t.id);
  }
  return out;
}

export function randomStats(rng: Rng, base: Partial<Stats> = {}): Stats {
  const n = (m: number, sd = 14) => clamp(Math.round(rng.normal(m, sd)), 5, 95);
  return {
    happiness: base.happiness ?? n(70, 10),
    health: base.health ?? n(85, 8),
    intelligence: base.intelligence ?? n(50),
    appearance: base.appearance ?? n(50),
    fitness: base.fitness ?? n(50, 12),
    stress: base.stress ?? n(20, 8),
    reputation: base.reputation ?? n(45, 10),
    discipline: base.discipline ?? n(50),
  };
}

export interface PersonOptions {
  gender?: Gender;
  firstName?: string;
  lastName?: string;
  birthYear: number;
  city: string;
  motherId?: string;
  fatherId?: string;
  education?: EduLevel;
  occupationId?: string;
  wealth?: number;
  stats?: Partial<Stats>;
  genetics?: number;
  traits?: TraitId[];
}

export function createPerson(s: GameState, rng: Rng, opts: PersonOptions): Person {
  const gender = opts.gender ?? (rng.chance(0.5) ? 'male' : 'female');
  const traits = opts.traits ?? randomTraits(rng, rng.int(1, 2));
  const stats = randomStats(rng, opts.stats);
  for (const tid of traits) {
    const t = TRAITS.find((x) => x.id === tid);
    if (!t) continue;
    for (const [k, v] of Object.entries(t.statBonus)) {
      const key = k as keyof Stats;
      stats[key] = clamp(stats[key] + (v ?? 0));
    }
  }
  const p: Person = {
    id: newId(s, 'p'),
    firstName: opts.firstName ?? randomFirstName(rng, gender, opts.birthYear),
    lastName: opts.lastName ?? randomLastName(rng),
    gender,
    birthYear: opts.birthYear,
    alive: true,
    city: opts.city,
    traits,
    stats,
    genetics: opts.genetics ?? clamp(Math.round(rng.normal(60, 15)), 10, 100),
    appearanceLook: randomLook(rng),
    motherId: opts.motherId,
    fatherId: opts.fatherId,
    childrenIds: [],
    wealth: opts.wealth ?? 0,
    occupationId: opts.occupationId,
    occupationStatus: opts.occupationId ? 'employed' : 'none',
    educationLevel: opts.education ?? 'none',
  };
  s.people[p.id] = p;
  return p;
}

/** Pick a plausible occupation for an adult NPC with a given education level. */
export function npcOccupationFor(rng: Rng, edu: EduLevel, age: number, year: number): string | undefined {
  const fits = OCCUPATIONS.filter(
    (o) =>
      !o.partTime &&
      occupationExists(o, year) &&
      EDU_RANK[o.education] <= EDU_RANK[edu] &&
      EDU_RANK[o.education] >= EDU_RANK[edu] - 2 &&
      age >= o.minAge &&
      (o.maxAge === undefined || age <= o.maxAge) &&
      (o.rarity ?? 1) >= 0.5,
  );
  if (fits.length === 0) return undefined;
  return rng.pick(fits).id;
}

export function randomEducationLevel(rng: Rng, bias = 0): EduLevel {
  const r = rng.next() + bias;
  if (r < 0.12) return 'lowerSecondary';
  if (r < 0.35) return 'vocational';
  if (r < 0.55) return 'upperSecondary';
  if (r < 0.82) return 'bachelor';
  if (r < 0.98) return 'master';
  return 'phd';
}

/** Child genetics: average of parents plus mutation. */
export function inheritGenetics(rng: Rng, a?: Person, b?: Person): number {
  const base = ((a?.genetics ?? 60) + (b?.genetics ?? 60)) / 2;
  return clamp(Math.round(rng.normal(base, 8)), 5, 100);
}
