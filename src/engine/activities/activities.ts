import type { Effect } from '@/types/events';
import type { GameState } from '@/types/game';
import type { Tone } from '@/types/core';
import { ACTIVITIES, ACTIVITY_CATEGORIES, getActivity, type ActivityDef } from '@/data/activities';
import { BALANCE } from '@/data/balance';
import { addTx, log, playerAge, type Sim } from '../simulation/helpers';
import { evalAll } from '../events/conditions';
import { pickOutcome } from '../events/selector';
import { applyEffects, type EffectContext } from '../events/effects';
import { buildContext, renderTemplate } from '../events/template';

export interface ActivityAvailability {
  ok: boolean;
  reason?: string;
  usesLeft: number;
  cost: number;
}

export function activityCost(s: GameState, a: ActivityDef): number {
  return Math.round(a.cost * s.economy.priceIndex);
}

export function activityAvailability(s: GameState, a: ActivityDef): ActivityAvailability {
  const age = playerAge(s);
  const used = s.activityUses[a.id] ?? 0;
  const cost = activityCost(s, a);
  const base = { usesLeft: Math.max(0, a.limit - used), cost };
  if (s.death) return { ok: false, reason: 'Død', ...base };
  if (age < a.minAge) return { ok: false, reason: `Fra ${a.minAge} år`, ...base };
  if (a.maxAge !== undefined && age > a.maxAge) return { ok: false, reason: `Til og med ${a.maxAge} år`, ...base };
  const inPrison = s.crime.prisonYearsLeft > 0;
  if (inPrison && a.category !== 'prison') return { ok: false, reason: 'Ikke mulig i fengsel', ...base };
  if (!inPrison && a.category === 'prison') return { ok: false, reason: 'Kun i fengsel', ...base };
  if (!evalAll(s, a.conditions)) return { ok: false, reason: 'Krav ikke oppfylt', ...base };
  if (used >= a.limit) return { ok: false, reason: 'Brukt opp i år', ...base };
  if (a.cooldown) {
    const last = s.activityLastYear[a.id];
    if (last !== undefined && s.year - last < a.cooldown) return { ok: false, reason: `Vent ${a.cooldown - (s.year - last)} år`, ...base };
  }
  if (cost > 0 && s.finances.cash < cost) return { ok: false, reason: 'Ikke råd', ...base };
  // Very young children depend on their parents.
  if (age < 6 && !['health', 'entertainment', 'medical', 'hobbies', 'sports'].includes(a.category)) return { ok: false, reason: 'For ung', ...base };
  return { ok: true, ...base };
}

export function visibleCategories(s: GameState): typeof ACTIVITY_CATEGORIES {
  const age = playerAge(s);
  const inPrison = s.crime.prisonYearsLeft > 0;
  return ACTIVITY_CATEGORIES.filter((c) => (inPrison ? c.id === 'prison' : c.id !== 'prison') && age >= c.minAge);
}

export function activitiesIn(category: string): ActivityDef[] {
  return ACTIVITIES.filter((a) => a.category === category);
}

/** Scales stat effects by diminishing returns: each repeat this year is less effective. */
function diminish(effects: Effect[], uses: number): Effect[] {
  const f = Math.pow(BALANCE.activities.diminishingFactor, uses);
  return effects.map((e) => (e.t === 'stat' ? { ...e, delta: Math.round(e.delta * f * 10) / 10 } : e));
}

export interface ActivityResult {
  ok: boolean;
  text: string;
  tone: Tone;
}

export function doActivity(sim: Sim, id: string): ActivityResult {
  const { s, rng } = sim;
  const a = getActivity(id);
  if (!a) return { ok: false, text: 'Ukjent aktivitet', tone: 'neutral' };
  const av = activityAvailability(s, a);
  if (!av.ok) return { ok: false, text: av.reason ?? 'Ikke tilgjengelig', tone: 'neutral' };
  const uses = s.activityUses[a.id] ?? 0;
  if (av.cost > 0) addTx(s, -av.cost, a.category === 'crime' ? 'crime' : 'activity', a.name);
  s.activityUses[a.id] = uses + 1;
  s.activityLastYear[a.id] = s.year;
  const outcome = pickOutcome(s, rng, a.outcomes);
  const ctx: EffectContext = { vars: {}, tpl: buildContext(s, undefined, {}), notes: [] };
  applyEffects(sim, diminish(outcome.effects, uses), ctx);
  const text = renderTemplate(outcome.text, ctx.tpl);
  const tone = outcome.tone ?? 'neutral';
  log(s, text, tone, a.name, undefined);
  return { ok: true, text, tone };
}
