import type { EventDef, OutcomeDef, VarSpec } from '@/types/events';
import type { GameState, PendingEvent } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { EVENTS, getEvent } from '@/data/events';
import { round } from '@/utils/math';
import type { Rng } from '../probability/rng';
import { ageOf, lifeStage, log, newId, playerAge, type Sim } from '../simulation/helpers';
import { evalAll, evalCondition } from './conditions';
import { applyEffects, type EffectContext } from './effects';
import { buildContext, renderTemplate } from './template';

export function maxOccurrences(ev: EventDef): number {
  return ev.maxOccurrences ?? (ev.priority || ev.category === 'milestone' ? 1 : BALANCE.events.defaultMaxOccurrences);
}

/** Finds an NPC that satisfies the event's target spec. Deterministic given the RNG. */
export function findTarget(s: GameState, ev: EventDef, rng: Rng | null): string | undefined | null {
  if (!ev.target) return undefined;
  const t = ev.target;
  const cands = Object.values(s.relationships).filter((r) => {
    const npc = s.people[r.personId];
    if (!npc || !npc.alive || r.status !== 'active') return false;
    if (!t.kinds.includes(r.kind)) return false;
    if (t.minStrength !== undefined && r.strength < t.minStrength) return false;
    if (t.maxStrength !== undefined && r.strength > t.maxStrength) return false;
    const a = ageOf(s, npc);
    if (t.minAge !== undefined && a < t.minAge) return false;
    if (t.maxAge !== undefined && a > t.maxAge) return false;
    return true;
  });
  if (cands.length === 0) return null;
  if (!rng) return cands[0].personId;
  return rng.pick(cands).personId;
}

/** Whether an event may be raised right now (ignoring target binding). */
export function isEligible(s: GameState, ev: EventDef): boolean {
  const age = playerAge(s);
  if (age < ev.minAge || age > ev.maxAge) return false;
  const h = s.eventHistory[ev.id];
  if (h) {
    if (h.count >= maxOccurrences(ev)) return false;
    if (s.year - h.lastYear < (ev.cooldown ?? BALANCE.events.defaultCooldown)) return false;
  }
  const inPrison = s.crime.prisonYearsLeft > 0;
  const prisonEvent = ev.conditions?.some((c) => c.t === 'inPrison' && c.value) ?? false;
  if (inPrison !== prisonEvent) return false;
  if (!evalAll(s, ev.conditions)) return false;
  if (ev.target && findTarget(s, ev, null) === null) return false;
  return true;
}

function eventWeight(s: GameState, ev: EventDef, pickedCategories: string[]): number {
  let w = ev.weight;
  for (const m of ev.mods ?? []) if (evalCondition(s, m.when)) w *= m.mult;
  if (pickedCategories.includes(ev.category)) w *= BALANCE.events.sameCategoryPenalty;
  const h = s.eventHistory[ev.id];
  if (h) w *= 0.5; // already seen: rarer
  return w;
}

function computeVars(s: GameState, rng: Rng, specs?: Record<string, VarSpec>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(specs ?? {})) {
    if (v.t === 'range') {
      const raw = rng.range(v.min, v.max) * s.economy.priceIndex;
      out[k] = round(raw, v.step ?? 500);
    } else {
      const base = s.career.job ? s.career.job.salary * v.pct : v.fallback * s.economy.priceIndex;
      out[k] = round(base, 500);
    }
  }
  return out;
}

export function pickOutcome(s: GameState, rng: Rng, outcomes: OutcomeDef[]): OutcomeDef {
  const picked = rng.weighted(outcomes, (o) => {
    let w = o.weight ?? 1;
    for (const m of o.mods ?? []) if (evalCondition(s, m.when)) w *= m.mult;
    for (const b of o.bias ?? []) {
      const stat = s.people[s.playerId].stats[b.key];
      w *= Math.max(0.05, 1 + (b.factor * (stat - 50)) / 50);
    }
    return w;
  });
  return picked ?? outcomes[0];
}

/** Raises one event: choice events become pending, automatic ones resolve immediately. */
export function raiseEvent(sim: Sim, ev: EventDef, boundPersonId?: string): PendingEvent | null {
  const { s, rng } = sim;
  const vars = computeVars(s, rng, ev.vars);
  const tpl = buildContext(s, boundPersonId, vars);
  const h = s.eventHistory[ev.id] ?? { count: 0, lastYear: s.year };
  s.eventHistory[ev.id] = { count: h.count + 1, lastYear: s.year };
  const title = renderTemplate(ev.title, tpl);
  const text = renderTemplate(ev.text, tpl);
  if (ev.choices && ev.choices.length > 0) {
    const choiceIds = ev.choices.map((_c, i) => i).filter((i) => evalAll(s, ev.choices?.[i].conditions));
    const pending: PendingEvent = { instanceId: newId(s, 'ev'), eventId: ev.id, title, text, boundPersonId, vars, choiceIds };
    s.pendingEvents.push(pending);
    return pending;
  }
  if (ev.outcomes && ev.outcomes.length > 0) {
    const outcome = pickOutcome(s, rng, ev.outcomes);
    const ctx: EffectContext = { boundPersonId, vars, tpl, notes: [] };
    applyEffects(sim, outcome.effects, ctx);
    const body = [text, renderTemplate(outcome.text, ctx.tpl), ...ctx.notes].filter(Boolean).join(' ');
    log(s, body, outcome.tone ?? ev.tone, title, ev.icon);
  }
  return null;
}

/**
 * Selects and raises this year's events: due follow-ups first, then priority
 * events (school choice, conscription …), then weighted random life events.
 */
export function raiseYearEvents(sim: Sim): void {
  const { s, rng } = sim;
  const age = playerAge(s);
  const picked: string[] = [];
  let choiceCount = 0;

  // 1. Scheduled follow-ups and delayed consequences.
  const due = s.scheduled.filter((x) => x.dueYear <= s.year);
  s.scheduled = s.scheduled.filter((x) => x.dueYear > s.year);
  for (const item of due) {
    if (item.effectsJson) {
      const ctx: EffectContext = { boundPersonId: item.boundPersonId, vars: {}, tpl: buildContext(s, item.boundPersonId, {}), notes: [] };
      try {
        applyEffects(sim, JSON.parse(item.effectsJson), ctx);
      } catch {
        // Corrupt delayed effect: skip rather than crash the year.
      }
      if (item.text) log(s, item.text, item.tone ?? 'neutral', 'Konsekvens', 'hourglass');
      continue;
    }
    const ev = item.eventId ? getEvent(item.eventId) : undefined;
    if (!ev) continue;
    if (ev.conditions && !evalAll(s, ev.conditions)) continue;
    if (age < ev.minAge || age > ev.maxAge) continue;
    if (item.boundPersonId) {
      const npc = s.people[item.boundPersonId];
      const r = s.relationships[item.boundPersonId];
      if (!npc?.alive || !r || r.status !== 'active') continue;
    }
    const bound = item.boundPersonId ?? (ev.target ? findTarget(s, ev, rng) ?? undefined : undefined);
    if (ev.target && !bound) continue;
    const pending = raiseEvent(sim, ev, bound);
    picked.push(ev.category);
    if (pending) choiceCount++;
  }

  // 2. Priority events.
  for (const ev of EVENTS) {
    if (!ev.priority || ev.scheduledOnly) continue;
    if (!isEligible(s, ev)) continue;
    const bound = ev.target ? findTarget(s, ev, rng) ?? undefined : undefined;
    const pending = raiseEvent(sim, ev, bound);
    picked.push(ev.category);
    if (pending) choiceCount++;
  }

  // 3. Random events.
  const [lo, hi] = BALANCE.events.perYear[lifeStage(age)];
  const count = rng.int(lo, hi);
  const pool = EVENTS.filter((ev) => !ev.priority && !ev.scheduledOnly && isEligible(s, ev));
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const options = pool.filter((ev) => !used.has(ev.id) && (choiceCount < BALANCE.events.maxChoiceEventsPerYear || !ev.choices));
    const ev = rng.weighted(options, (e) => eventWeight(s, e, picked));
    if (!ev) break;
    used.add(ev.id);
    // Re-check: an earlier event this year may have changed eligibility.
    if (!isEligible(s, ev)) continue;
    const bound = ev.target ? findTarget(s, ev, rng) ?? undefined : undefined;
    if (ev.target && !bound) continue;
    const pending = raiseEvent(sim, ev, bound);
    picked.push(ev.category);
    if (pending) choiceCount++;
  }
}
