/**
 * Headless simulation: plays complete lives without any UI using a randomised but
 * plausible player policy. Used by tests and the mass-simulation runner to find
 * impossible states, balance issues and crashes.
 */
import type { GameState } from '@/types/game';
import { createRng, type Rng } from '../probability/rng';
import { createGame, randomLifeOptions } from './createGame';
import { ageUp } from './ageUp';
import { actions } from './actions';
import { choiceCost, dismissEvent, resolveChoice } from '../events/resolve';
import { playerAge, relsOf } from './helpers';
import { jobListings, qualification } from '../careers/careers';
import { availablePrograms } from '../education/education';
import { ACTIVITIES } from '@/data/activities';
import { activityAvailability } from '../activities/activities';
import { availableInteractions } from '../relationships/interactions';
import { canAffordProperty, assetPrice } from '../assets/assets';
import { getAssetDef } from '@/data/assets';
import { heirs, continueAsHeir } from '../legacy/legacy';
import { validateState } from './validate';

export interface PolicyOptions {
  /** 0 = cautious, 1 = reckless (more crime, gambling and risky choices). */
  recklessness: number;
  /** Start year of the life (historical era). Defaults to the present. */
  startYear?: number;
}

export interface LifeReport {
  seed: number;
  ageAtDeath: number;
  years: number;
  netWorthReal: number;
  peakNetWorthReal: number;
  events: number;
  uniqueEvents: number;
  maxRepeats: number;
  problems: string[];
  generation: number;
  cause: string;
  state: GameState;
}

function resolveAll(state: GameState, rng: Rng): GameState {
  let s = state;
  let guard = 0;
  while (s.pendingEvents.some((p) => !p.resolved) && guard++ < 20) {
    const p = s.pendingEvents.find((x) => !x.resolved);
    if (!p) break;
    const affordable = p.choiceIds.filter((c) => { const cost = choiceCost(s, p.eventId, c, p.vars); return cost === 0 || cost <= s.finances.cash; });
    const options = affordable.length ? affordable : p.choiceIds;
    const choice = rng.pick(options);
    try {
      s = resolveChoice(s, p.instanceId, choice);
    } catch (err) {
      if (!(err instanceof Error) || err.message !== 'Not enough money') throw err;
      // Unaffordable fallback: try any other choice.
      const alt = p.choiceIds.find((c) => c !== choice && choiceCost(s, p.eventId, c, p.vars) === 0);
      if (alt === undefined) throw new Error(`Stuck on event ${p.eventId}`, { cause: err });
      s = resolveChoice(s, p.instanceId, alt);
    }
    if (s.death) return s;
  }
  for (const p of [...s.pendingEvents]) s = dismissEvent(s, p.instanceId);
  return s;
}

function playYear(state: GameState, rng: Rng, opts: PolicyOptions): GameState {
  let s = state;
  const age = playerAge(s);
  // Education
  if (!s.education.current && age >= 18 && age <= 30 && rng.chance(0.35)) {
    const options = availablePrograms(s).filter((p) => p.eligibility.ok);
    if (options.length) s = actions.enroll(s, rng.pick(options).program.id).state;
  }
  // Career
  if (age >= 15 && !s.career.retired && (!s.career.job || s.career.job.partTime || rng.chance(0.08))) {
    const listings = jobListings(s).filter((o) => qualification(s, o).ok);
    for (let i = 0; i < 2 && listings.length; i++) {
      const occ = rng.pick(listings);
      const r = actions.applyJob(s, occ.id);
      s = r.state;
      if (s.career.offer) {
        if (rng.chance(0.3)) s = actions.negotiateOffer(s).state;
        if (s.career.offer) s = actions.acceptOffer(s).state;
        break;
      }
    }
  }
  if (s.career.job && rng.chance(0.2)) s = actions.workEffort(s, rng.pick(['low', 'normal', 'high'] as const)).state;
  if (s.education.current && rng.chance(0.2)) s = actions.studyEffort(s, rng.pick(['low', 'normal', 'high'] as const)).state;
  if (age >= 20 && s.livingWithParents && rng.chance(0.4)) s = actions.moveOut(s).state;
  // Activities
  const n = rng.int(1, 4);
  for (let i = 0; i < n; i++) {
    const avail = ACTIVITIES.filter((a) => activityAvailability(s, a).ok && (opts.recklessness > 0.5 || (a.category !== 'crime' && a.category !== 'gambling')));
    if (!avail.length) break;
    s = actions.activity(s, rng.pick(avail).id).state;
    if (s.death || s.pendingEvents.some((p) => !p.resolved)) s = resolveAll(s, rng);
    if (s.death) return s;
  }
  // Relationships
  const rels = Object.values(s.relationships).filter((r) => r.status === 'active');
  for (let i = 0; i < 3 && rels.length; i++) {
    const r = rng.pick(rels);
    const opts2 = availableInteractions(s, r).filter((x) => !x.danger || rng.chance(0.1));
    if (opts2.length) s = actions.interact(s, r.personId, rng.pick(opts2).id).state;
  }
  if (age >= 25 && age <= 40 && relsOf(s, ['partner', 'spouse']).length && rng.chance(0.3)) {
    const pr = relsOf(s, ['partner', 'spouse'])[0];
    s = actions.interact(s, pr.personId, pr.kind === 'partner' ? 'propose' : 'tryForBaby').state;
  }
  // Money
  if (age >= 18 && s.finances.cash > 200_000 * s.economy.priceIndex && rng.chance(0.5)) {
    s = actions.deposit(s, rng.pick(['funds', 'savingsAccount', 'stocks'] as const), s.finances.cash * 0.5).state;
  }
  if (age >= 25 && !s.assets.some((a) => a.residence) && rng.chance(0.3)) {
    const def = getAssetDef(rng.pick(['studio', 'apartment', 'rowhouse', 'house']));
    if (def && canAffordProperty(s, assetPrice(s, def)).ok) s = actions.buyAsset(s, def.id, true).state;
  }
  if (s.pendingEvents.length) s = resolveAll(s, rng);
  return s;
}

export function simulateLife(seed: number, opts: PolicyOptions = { recklessness: 0.3 }, continueGenerations = 0): LifeReport {
  const rng = createRng(seed ^ 0x5bd1e995);
  let s = createGame({ ...randomLifeOptions(seed, opts.startYear ?? 2026), seed });
  const problems: string[] = [];
  let years = 0;
  let generationsLeft = continueGenerations;
  while (years < 400) {
    s = resolveAll(s, rng);
    if (s.death) {
      const kids = heirs(s);
      if (generationsLeft > 0 && kids.length) {
        generationsLeft -= 1;
        s = continueAsHeir(s, kids[0].id);
        const p = validateState(s);
        if (p.length) problems.push(...p.map((x) => `after heir: ${x}`));
        continue;
      }
      break;
    }
    s = playYear(s, rng, opts);
    if (s.death) continue;
    const p = validateState(s);
    if (p.length) {
      problems.push(...p);
      break;
    }
    s = ageUp(s);
    years++;
    if (playerAge(s) > 125) {
      problems.push('Character older than 125');
      break;
    }
  }
  const counts = Object.values(s.eventHistory).map((h) => h.count);
  return {
    seed,
    ageAtDeath: s.death?.age ?? playerAge(s),
    years,
    netWorthReal: (s.death?.summary.netWorth ?? 0) / s.economy.priceIndex,
    peakNetWorthReal: s.finances.peakNetWorth,
    events: counts.reduce((a, b) => a + b, 0),
    uniqueEvents: counts.length,
    maxRepeats: Math.max(0, ...counts),
    problems,
    generation: s.generation,
    cause: s.death?.cause ?? '',
    state: s,
  };
}
