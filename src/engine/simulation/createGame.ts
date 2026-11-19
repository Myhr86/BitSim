import type { Appearance, Difficulty, FamilyBackground, Gender, TraitId } from '@/types/core';
import type { GameState, Person } from '@/types/game';
import { getCity, getCountry } from '@/data/countries';
import { getOccupation } from '@/data/occupations';
import { clamp } from '@/utils/math';
import { createRng, randomSeed, type Rng } from '../probability/rng';
import { addRelationship, changeStat, endSim, log, type Sim } from './helpers';
import { createPerson, inheritGenetics, npcOccupationFor, randomFirstName, randomLastName, randomLook, randomTraits } from '../npcs/factory';
import { initialEconomy } from '../economy/market';
import { initialCareer, initialCrime, initialEducation, initialFinances, initialHealth } from './initialState';
import { SAVE_VERSION } from './version';
import { getTrait } from '@/data/traits';

export interface NewLifeOptions {
  firstName: string;
  lastName: string;
  gender: Gender;
  cityId: string;
  startYear: number;
  look: Appearance;
  background: FamilyBackground;
  traits: TraitId[];
  datingPreference: 'male' | 'female' | 'any';
  difficulty: Difficulty;
  scenario: string;
  seed?: number;
  countryId?: string;
}

export function randomLifeOptions(seed = randomSeed()): NewLifeOptions {
  const rng = createRng(seed);
  const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
  const country = getCountry('no');
  const bgRoll = rng.next();
  const background: FamilyBackground =
    bgRoll < 0.1 ? 'wealthy' : bgRoll < 0.55 ? 'middle' : bgRoll < 0.8 ? 'working' : bgRoll < 0.93 ? 'single' : 'difficult';
  return {
    firstName: randomFirstName(rng, gender),
    lastName: randomLastName(rng),
    gender,
    cityId: rng.pick(country.cities).id,
    startYear: country.playableEras[0].startYear,
    look: randomLook(rng),
    background,
    traits: randomTraits(rng, 2),
    datingPreference: gender === 'male' ? 'female' : 'male',
    difficulty: 'normal',
    scenario: 'standard',
  };
}

interface ParentProfile {
  education: [number, number];
  wealth: [number, number];
  statBias: number;
}

const PROFILES: Record<FamilyBackground, ParentProfile> = {
  wealthy: { education: [0.55, 1], wealth: [8_000_000, 28_000_000], statBias: 6 },
  middle: { education: [0.3, 0.85], wealth: [1_200_000, 4_500_000], statBias: 0 },
  working: { education: [0.05, 0.55], wealth: [200_000, 1_400_000], statBias: -2 },
  single: { education: [0.05, 0.7], wealth: [80_000, 900_000], statBias: -3 },
  difficult: { education: [0, 0.35], wealth: [0, 200_000], statBias: -8 },
};

function eduFromRoll(r: number) {
  if (r < 0.15) return 'lowerSecondary' as const;
  if (r < 0.4) return 'vocational' as const;
  if (r < 0.55) return 'upperSecondary' as const;
  if (r < 0.82) return 'bachelor' as const;
  if (r < 0.97) return 'master' as const;
  return 'phd' as const;
}

function makeParent(s: GameState, rng: Rng, gender: Gender, birthYear: number, city: string, lastName: string, prof: ParentProfile, scenario: string): Person {
  const edu = eduFromRoll(rng.range(prof.education[0], prof.education[1]));
  const age = s.year - birthYear;
  const occ = npcOccupationFor(rng, edu, age);
  const wealth = Math.round(rng.range(prof.wealth[0], prof.wealth[1]) * (scenario === 'heir' ? 3 : 1));
  const p = createPerson(s, rng, {
    gender,
    birthYear,
    city,
    lastName,
    education: edu,
    occupationId: occ,
    wealth,
    genetics: scenario === 'dynasty' ? rng.int(75, 95) : undefined,
    stats: { intelligence: clamp(Math.round(rng.normal(50 + prof.statBias, 12))) },
  });
  return p;
}

/** Creates a brand-new game state with the player born this year. */
export function createGame(opts: NewLifeOptions): GameState {
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(seed);
  const country = getCountry(opts.countryId ?? 'no');
  const s: GameState = {
    version: SAVE_VERSION,
    saveId: `save_${seed.toString(36)}`,
    seed,
    rngState: seed,
    countryId: country.id,
    createdAt: 0,
    updatedAt: 0,
    settings: { difficulty: opts.difficulty },
    year: opts.startYear,
    startYear: opts.startYear,
    playerId: '',
    generation: 1,
    background: opts.scenario === 'heir' ? 'wealthy' : opts.background,
    people: {},
    relationships: {},
    timeline: [],
    pendingEvents: [],
    scheduled: [],
    eventHistory: {},
    economy: initialEconomy(),
    finances: initialFinances(),
    assets: [],
    education: initialEducation(),
    career: initialCareer(),
    health: initialHealth(),
    crime: initialCrime(),
    activityUses: {},
    activityLastYear: {},
    flags: {},
    happinessLog: [],
    livingWithParents: true,
    datingPreference: opts.datingPreference,
    lineage: [],
    death: null,
    milestones: [],
    unlockedThisSave: [],
    idCounter: 0,
  };
  const sim: Sim = { s, rng };
  const prof = PROFILES[s.background];
  const city = getCity(country.id, opts.cityId).id;

  // Parents
  const motherAge = rng.int(23, 38);
  const fatherAge = clamp(motherAge + rng.int(-3, 6), 20, 50);
  const mother = makeParent(s, rng, 'female', s.year - motherAge, city, opts.lastName, prof, opts.scenario);
  const father = makeParent(s, rng, 'male', s.year - fatherAge, city, rng.chance(0.8) ? opts.lastName : randomLastName(rng), prof, opts.scenario);
  mother.spouseId = s.background === 'single' ? undefined : father.id;
  father.spouseId = s.background === 'single' ? undefined : mother.id;

  // Player
  const statBase = 50 + prof.statBias;
  const me = createPerson(s, rng, {
    gender: opts.gender,
    firstName: opts.firstName.trim() || randomFirstName(rng, opts.gender),
    lastName: opts.lastName.trim() || randomLastName(rng),
    birthYear: s.year,
    city,
    motherId: mother.id,
    fatherId: father.id,
    traits: opts.traits.slice(0, 3),
    genetics: inheritGenetics(rng, mother, father),
    stats: {
      happiness: clamp(Math.round(rng.normal(80 + prof.statBias, 6))),
      health: clamp(Math.round(rng.normal(88, 6))),
      intelligence: clamp(Math.round((mother.stats.intelligence + father.stats.intelligence) / 2 + rng.normal(statBase - 50, 12))),
      appearance: clamp(Math.round(rng.normal(50, 15))),
      fitness: clamp(Math.round(rng.normal(30, 8))),
      stress: clamp(Math.round(rng.normal(8 - prof.statBias, 4))),
      reputation: clamp(Math.round(rng.normal(45 + prof.statBias / 2, 6))),
      discipline: clamp(Math.round(rng.normal(30, 10))),
    },
  });
  // createPerson applies trait bonuses once.
  me.appearanceLook = opts.look;
  s.playerId = me.id;
  mother.childrenIds.push(me.id);
  father.childrenIds.push(me.id);

  // Scenario bonuses
  if (opts.scenario === 'prodigy') {
    me.stats.intelligence = Math.max(me.stats.intelligence, 88);
    if (!me.traits.includes('bookish')) me.traits.push('bookish');
  } else if (opts.scenario === 'talent') {
    me.stats.appearance = Math.max(me.stats.appearance, 85);
    if (!me.traits.includes('charismatic') && !me.traits.includes('shy')) me.traits.push('charismatic');
  } else if (opts.scenario === 'dynasty') {
    me.genetics = Math.max(me.genetics, 85);
  }
  if (s.background === 'difficult') {
    changeStat(me, 'discipline', 6); // resilience
    s.flags.difficultHome = 1;
    s.flags[rng.chance(0.5) ? 'parentAddiction' : 'parentConflict'] = 1;
  }

  const parentStrength = s.background === 'difficult' ? 45 : 75;
  addRelationship(s, mother.id, 'mother', { strength: parentStrength + rng.int(-10, 10), trust: 70, loyalty: 80 });
  if (s.background === 'single') {
    addRelationship(s, father.id, 'father', { strength: 15, trust: 20, loyalty: 20, status: 'estranged' });
  } else {
    addRelationship(s, father.id, 'father', { strength: parentStrength + rng.int(-10, 10), trust: 70, loyalty: 80 });
  }

  // Older siblings
  const siblingCount = rng.weighted([0, 1, 2, 3], (n) => [0.35, 0.4, 0.18, 0.07][n]) ?? 0;
  for (let i = 0; i < siblingCount; i++) {
    const sAge = rng.int(1, Math.max(1, Math.min(14, motherAge - 19)));
    const sib = createPerson(s, rng, {
      birthYear: s.year - sAge,
      city,
      lastName: me.lastName,
      motherId: mother.id,
      fatherId: father.id,
      genetics: inheritGenetics(rng, mother, father),
    });
    mother.childrenIds.push(sib.id);
    father.childrenIds.push(sib.id);
    addRelationship(s, sib.id, 'sibling', { strength: rng.int(50, 75), trust: 60 });
  }

  // Grandparents
  for (const parent of [mother, father]) {
    if (s.background === 'single' && parent === father) continue;
    for (const g of ['female', 'male'] as Gender[]) {
      if (!rng.chance(0.7)) continue;
      const gAge = s.year - parent.birthYear + rng.int(22, 35);
      if (gAge > 92) continue;
      const gp = createPerson(s, rng, {
        gender: g,
        birthYear: s.year - gAge,
        city: rng.chance(0.6) ? city : rng.pick(country.cities).id,
        lastName: parent.lastName,
        education: eduFromRoll(rng.range(0, 0.7)),
        wealth: Math.round(rng.range(prof.wealth[0], prof.wealth[1]) * 0.8),
      });
      gp.occupationStatus = gAge >= 67 ? 'retired' : 'employed';
      gp.childrenIds.push(parent.id);
      if (g === 'female') parent.motherId = gp.id;
      else parent.fatherId = gp.id;
      addRelationship(s, gp.id, 'grandparent', { strength: rng.int(45, 80), trust: 60 });
    }
  }

  // Birth log
  const cityName = getCity(country.id, city).name;
  const jobOf = (p: Person) => (p.occupationId ? getOccupation(p.occupationId)?.title.toLowerCase() : undefined);
  const mJob = jobOf(mother);
  const fJob = jobOf(father);
  const parentsTxt =
    s.background === 'single'
      ? `Moren din, ${mother.firstName}${mJob ? ` (${mJob})` : ''}, skal oppdra deg alene.`
      : `Foreldrene dine er ${mother.firstName}${mJob ? ` (${mJob})` : ''} og ${father.firstName}${fJob ? ` (${fJob})` : ''}.`;
  const bgTxt: Record<FamilyBackground, string> = {
    wealthy: 'Familien har god råd, og barnerommet er større enn mange leiligheter.',
    middle: 'Du er født inn i en helt vanlig, trygg familie.',
    working: 'Familien jobber hardt for å få endene til å møte.',
    single: 'Det blir tøft, men kjærligheten mangler ikke.',
    difficult: 'Hjemmet ditt er preget av uro og bekymringer.',
  };
  const traitTxt = me.traits.map((t) => getTrait(t)?.name.toLowerCase()).join(' og ');
  log(
    s,
    `Du ble født i ${cityName} i ${s.year}. ${parentsTxt} ${bgTxt[s.background]}${traitTxt ? ` Allerede fra start virker du ${traitTxt}.` : ''}`,
    'milestone',
    `Velkommen, ${me.firstName}!`,
    'baby',
  );
  s.milestones.push({ kind: 'birth', text: `Født i ${cityName} i ${s.year}.` });
  return endSim(sim);
}
