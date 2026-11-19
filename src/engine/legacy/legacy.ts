import type { GameState, LifeSummary, Person } from '@/types/game';
import { EDU_RANK } from '@/types/core';
import { getCity } from '@/data/countries';
import { getOccupation } from '@/data/occupations';
import { avg } from '@/utils/math';
import { formatNOK } from '@/utils/format';
import { ageOf, beginSim, endSim, log, player, playerAge, relsOf, type Sim } from '../simulation/helpers';
import { netWorth } from '../assets/assets';
import { highestEducation, levelName } from '../education/education';
import { initialCareer, initialCrime, initialEducation, initialFinances, initialHealth } from '../simulation/initialState';

export function legacyScore(s: GameState, nw: number, avgHappiness: number): number {
  const real = Math.max(0, nw) / s.economy.priceIndex;
  const children = relsOf(s, 'child', true).length;
  const grandchildren = relsOf(s, 'grandchild', true).length;
  const age = playerAge(s);
  let score = 0;
  score += Math.min(250, Math.sqrt(real) / 6);
  score += Math.min(150, age * 1.5);
  score += avgHappiness * 2;
  score += children * 25 + grandchildren * 10;
  score += EDU_RANK[highestEducation(s)] * 15;
  score += (s.flags.peakScore ?? 0) * 1.2;
  score += player(s).stats.reputation;
  score -= s.crime.totalPrisonYears * 15;
  score += (s.flags.marriages ?? 0) > 0 ? 30 : 0;
  return Math.max(0, Math.round(score));
}

export function buildSummary(s: GameState, cause: string): LifeSummary {
  const p = player(s);
  const nw = netWorth(s);
  const avgHappiness = Math.round(avg(s.happinessLog.length ? s.happinessLog : [p.stats.happiness]));
  const highlights = s.milestones.filter((m) => m.text).map((m) => m.text).slice(-12);
  const summary: LifeSummary = {
    personId: p.id,
    generation: s.generation,
    name: `${p.firstName} ${p.lastName}`,
    birthYear: p.birthYear,
    deathYear: s.year,
    ageAtDeath: playerAge(s),
    cause,
    netWorth: Math.round(nw),
    lifetimeEarnings: Math.round(s.finances.lifetimeEarnings),
    peakTitle: s.career.peakTitle,
    highestEducation: highestEducation(s),
    children: relsOf(s, 'child', true).length,
    grandchildren: relsOf(s, 'grandchild', true).length,
    marriages: s.flags.marriages ?? 0,
    avgHappiness,
    legacyScore: legacyScore(s, nw, avgHappiness),
    obituary: '',
    highlights,
  };
  summary.obituary = writeObituary(s, summary);
  return summary;
}

/** Generates an obituary from the character's actual life facts. */
export function writeObituary(s: GameState, sum: LifeSummary): string {
  const p = player(s);
  const city = getCity(s.countryId, p.city).name;
  const parts: string[] = [];
  parts.push(`${sum.name} sovnet inn i ${city} ${sum.ageAtDeath} år gammel${sum.cause ? ` (${sum.cause})` : ''}.`);
  const traitsTxt: Record<string, string> = {
    kind: 'en varm og omtenksom sjel',
    charismatic: 'en som fylte ethvert rom',
    ambitious: 'drevet av store ambisjoner',
    creative: 'et kreativt menneske',
    adventurous: 'alltid på jakt etter nye eventyr',
    honest: 'kjent for sin ærlighet',
    bookish: 'en ivrig leser',
    athletic: 'aktiv til det siste',
    hotheaded: 'et temperamentsfullt menneske',
    frugal: 'nøktern og fornuftig',
    impulsive: 'spontan og uforutsigbar',
    shy: 'stille, men dypt lojal',
    anxious: 'omsorgsfull og forsiktig',
    lazy: 'en mester i å nyte livet',
  };
  const t = p.traits.map((x) => traitsTxt[x]).filter(Boolean);
  if (t.length) parts.push(`Hen huskes som ${t.join(' og ')}.`);
  if (sum.peakTitle) parts.push(`I arbeidslivet nådde hen stillingen som ${sum.peakTitle.toLowerCase()}.`);
  else if (sum.ageAtDeath > 25) parts.push('Arbeidslivet ble aldri det store, men livet hadde andre gleder.');
  if (EDU_RANK[sum.highestEducation] >= 4) parts.push(`Utdannelsen – ${levelName(sum.highestEducation)} – var en kilde til stolthet.`);
  const spouse = relsOf(s, 'spouse', true)[0];
  if (spouse) {
    const sp = s.people[spouse.personId];
    parts.push(sp.alive ? `Hen etterlater seg ektefellen ${sp.firstName}.` : `Hen gjenforenes nå med sin avdøde ektefelle ${sp.firstName}.`);
  } else if ((s.flags.divorces ?? 0) > 0) {
    parts.push('Kjærligheten gikk ikke alltid på skinner.');
  }
  if (sum.children > 0) {
    const names = relsOf(s, 'child', true).map((r) => s.people[r.personId]?.firstName).filter(Boolean);
    parts.push(`Hen var en stolt forelder til ${names.join(', ')}${sum.grandchildren ? ` og ${sum.grandchildren} barnebarn` : ''}.`);
  }
  if (s.crime.totalPrisonYears > 0) parts.push(`Livet hadde også mørke kapitler, blant annet ${s.crime.totalPrisonYears} år bak murene.`);
  if (s.finances.bankruptcies > 0) parts.push('Hen kjente økonomisk motgang på kroppen, men reiste seg igjen.');
  if (s.health.survivedSerious > 0) parts.push('Hen overvant alvorlig sykdom med stort mot.');
  if (sum.netWorth > 10_000_000 * s.economy.priceIndex) parts.push(`Hen etterlater seg en betydelig formue på ${formatNOK(sum.netWorth)}.`);
  else if (sum.netWorth < 0) parts.push('Boet var dessverre preget av gjeld.');
  if (sum.avgHappiness >= 70) parts.push('Et liv levd med glede.');
  else if (sum.avgHappiness < 40) parts.push('Livet var ikke alltid lett, men hen gjorde sitt beste.');
  parts.push('Hvil i fred.');
  return parts.join(' ').replace(/\bhen\b/g, p.gender === 'male' ? 'han' : 'hun').replace(/\bHen\b/g, p.gender === 'male' ? 'Han' : 'Hun');
}

/** Marks the player as dead and records the life summary. */
export function die(sim: Sim, cause: string): void {
  const { s } = sim;
  if (s.death) return;
  const p = player(s);
  p.alive = false;
  p.deathYear = s.year;
  p.deathCause = cause;
  s.pendingEvents = [];
  const summary = buildSummary(s, cause);
  s.lineage.push(summary);
  s.death = { age: playerAge(s), year: s.year, cause, summary, estate: Math.max(0, Math.round(netWorth(s))) };
  log(s, `Du døde ${playerAge(s)} år gammel. Dødsårsak: ${cause}.`, 'milestone', 'Livets slutt', 'flower');
}

/** Living children who can continue the lineage. */
export function heirs(s: GameState): Person[] {
  const me = player(s);
  return me.childrenIds.map((id) => s.people[id]).filter((c): c is Person => !!c && c.alive);
}

/**
 * Continue playing as one of the deceased player's children. Inheritance is the estate
 * (liquidated assets minus debts) split between surviving spouse and children.
 */
export function continueAsHeir(state: GameState, heirId: string): GameState {
  if (!state.death) throw new Error('Player is not dead');
  const sim = beginSim(state);
  const { s, rng } = sim;
  const parent = player(s);
  const heir = s.people[heirId];
  if (!heir || !heir.alive || !parent.childrenIds.includes(heirId)) throw new Error('Invalid heir');
  const estate = s.death?.estate ?? 0;
  const kids = heirs(s);
  const spouse = parent.spouseId ? s.people[parent.spouseId] : undefined;
  const spouseShare = spouse?.alive ? 0.25 : 0;
  const perChild = Math.round((estate * (1 - spouseShare)) / Math.max(1, kids.length));
  if (spouse?.alive) spouse.wealth += Math.round(estate * spouseShare);
  for (const k of kids) if (k.id !== heirId) k.wealth += perChild;

  // New protagonist
  s.playerId = heir.id;
  s.generation += 1;
  heir.playedGeneration = s.generation;
  const age = ageOf(s, heir);
  const prevRelationships = s.relationships;
  s.relationships = {};
  const addRel = (id: string | undefined, kind: Parameters<typeof relKind>[0], strength = 60) => {
    if (!id || id === heir.id || !s.people[id]) return;
    const pe = s.people[id];
    s.relationships[id] = {
      personId: id,
      kind: relKind(kind),
      strength,
      trust: strength,
      attraction: 0,
      loyalty: 60,
      since: s.year,
      status: pe.alive ? 'active' : 'deceased',
      interactions: 0,
      owes: 0,
    };
  };
  // Parents
  if (heir.motherId) addRel(heir.motherId, 'mother', prevRelationships[heirId]?.strength ?? 70);
  if (heir.fatherId) addRel(heir.fatherId, 'father', prevRelationships[heirId]?.strength ?? 70);
  // Siblings (children of either parent)
  const parentIds = [heir.motherId, heir.fatherId].filter(Boolean) as string[];
  const siblingIds = new Set<string>();
  for (const pid of parentIds) for (const c of s.people[pid]?.childrenIds ?? []) if (c !== heir.id) siblingIds.add(c);
  for (const sid of siblingIds) addRel(sid, 'sibling', 55);
  // Grandparents = parents of the deceased player and of the other parent.
  for (const pid of parentIds) {
    const pp = s.people[pid];
    if (pp?.motherId && s.people[pp.motherId]?.alive) addRel(pp.motherId, 'grandparent', 55);
    if (pp?.fatherId && s.people[pp.fatherId]?.alive) addRel(pp.fatherId, 'grandparent', 55);
  }
  // Own family
  if (heir.spouseId && s.people[heir.spouseId]?.alive) {
    addRel(heir.spouseId, 'spouse', 70);
    s.relationships[heir.spouseId].attraction = 60;
  }
  for (const cid of heir.childrenIds) {
    addRel(cid, 'child', 75);
    for (const gc of s.people[cid]?.childrenIds ?? []) addRel(gc, 'grandchild', 60);
  }

  // Fresh personal state
  s.finances = initialFinances();
  s.finances.cash = perChild;
  s.finances.inheritanceReceived = perChild;
  s.assets = [];
  s.education = initialEducation();
  if (age >= 16 && heir.educationLevel !== 'none') {
    const levels = ['primary', 'lowerSecondary', heir.educationLevel] as const;
    for (const lv of levels) {
      if (s.education.credentials.some((c) => c.level === lv)) continue;
      s.education.credentials.push({ programId: lv === 'primary' ? 'primary' : lv === 'lowerSecondary' ? 'lower_secondary' : `inherited_${lv}`, level: lv, field: 'general', grade: 4, year: s.year });
    }
  } else if (age >= 13) {
    s.education.credentials.push({ programId: 'primary', level: 'primary', field: 'general', grade: 4, year: s.year });
  }
  s.career = initialCareer();
  s.health = initialHealth();
  s.crime = initialCrime();
  s.flags = { generationStart: s.year };
  s.eventHistory = {};
  s.scheduled = [];
  s.pendingEvents = [];
  s.milestones = [];
  s.timeline = [];
  s.happinessLog = [];
  s.activityUses = {};
  s.activityLastYear = {};
  s.unlockedThisSave = [...s.unlockedThisSave];
  s.livingWithParents = age < 18;
  s.background = perChild > 10_000_000 * s.economy.priceIndex ? 'wealthy' : perChild > 1_000_000 * s.economy.priceIndex ? 'middle' : 'working';
  s.death = null;
  heir.wealth = 0;
  if (age >= 20 && heir.occupationId) {
    const occ = getOccupation(heir.occupationId);
    if (occ) {
      s.career.job = {
        occupationId: occ.id,
        level: age > 40 ? 1 : 0,
        salary: Math.round(((occ.salary[0] + occ.salary[1]) / 2) * s.economy.priceIndex),
        performance: 55,
        yearsInRole: 1,
        yearsAtCompany: 2,
        effort: 'normal',
        company: 'Familiebedriften',
        partTime: false,
      };
      heir.occupationStatus = 'employed';
    }
  }
  if (age >= 67) {
    s.career.retired = true;
    s.finances.pensionAnnual = Math.round(230_000 * s.economy.priceIndex);
  }
  // Fill in a minimal stat profile if the NPC had little simulation.
  heir.stats.health = Math.max(heir.stats.health, 55);
  heir.stats.happiness = Math.max(30, heir.stats.happiness - 10);
  const pName = `${parent.firstName} ${parent.lastName}`;
  log(s, `${pName} er borte. Du er ${heir.firstName} ${heir.lastName}, ${age} år, og arver ${formatNOK(perChild)}. Slekten lever videre – generasjon ${s.generation}.`, 'milestone', 'En ny generasjon', 'git-branch');
  void rng;
  return endSim(sim);
}

function relKind(k: 'mother' | 'father' | 'sibling' | 'grandparent' | 'spouse' | 'child' | 'grandchild') {
  return k;
}
