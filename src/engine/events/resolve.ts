import type { GameState } from '@/types/game';
import { getEvent } from '@/data/events';
import { beginSim, endSim, log } from '../simulation/helpers';
import { applyEffects, type EffectContext } from './effects';
import { pickOutcome } from './selector';
import { buildContext, renderTemplate } from './template';
import { postActionChecks } from '../simulation/checks';

export class GameError extends Error {}

export function choiceCost(state: GameState, eventId: string, choiceIndex: number, vars: Record<string, number>): number {
  const ev = getEvent(eventId);
  const c = ev?.choices?.[choiceIndex];
  if (!c || c.requiresMoney === undefined) return 0;
  if (typeof c.requiresMoney === 'number') return Math.round(c.requiresMoney * state.economy.priceIndex);
  return vars[c.requiresMoney] ?? 0;
}

/**
 * Resolves a pending event choice. The outcome is drawn from the persisted RNG state, so
 * reloading the game and choosing again yields the same result (no save-scumming).
 */
export function resolveChoice(state: GameState, instanceId: string, choiceIndex: number): GameState {
  const pending = state.pendingEvents.find((p) => p.instanceId === instanceId);
  if (!pending) throw new GameError('Event not found');
  if (pending.resolved) throw new GameError('Event already resolved');
  if (!pending.choiceIds.includes(choiceIndex)) throw new GameError('Choice not available');
  const ev = getEvent(pending.eventId);
  const choice = ev?.choices?.[choiceIndex];
  if (!ev || !choice) throw new GameError('Unknown event');
  const cost = choiceCost(state, ev.id, choiceIndex, pending.vars);
  if (cost > 0 && state.finances.cash < cost) throw new GameError('Not enough money');

  const sim = beginSim(state);
  const { s, rng } = sim;
  const outcome = pickOutcome(s, rng, choice.outcomes);
  const ctx: EffectContext = {
    boundPersonId: pending.boundPersonId,
    vars: pending.vars,
    tpl: buildContext(s, pending.boundPersonId, pending.vars),
    notes: [],
  };
  applyEffects(sim, outcome.effects, ctx);
  const text = [renderTemplate(outcome.text, ctx.tpl), ...ctx.notes].filter(Boolean).join(' ');
  const tone = outcome.tone ?? ev.tone;
  const target = s.pendingEvents.find((p) => p.instanceId === instanceId);
  if (target) target.resolved = { choiceIndex, text, tone };
  log(s, `«${choice.label}» ${text}`, tone, pending.title, ev.icon);
  postActionChecks(sim);
  return endSim(sim);
}

/** Removes a resolved event from the queue (after the player has read the outcome). */
export function dismissEvent(state: GameState, instanceId: string): GameState {
  const p = state.pendingEvents.find((x) => x.instanceId === instanceId);
  if (!p || !p.resolved) return state;
  return { ...state, pendingEvents: state.pendingEvents.filter((x) => x.instanceId !== instanceId) };
}

export function unresolvedCount(state: GameState): number {
  return state.pendingEvents.filter((p) => !p.resolved).length;
}
