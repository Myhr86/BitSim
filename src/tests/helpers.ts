import { createGame, randomLifeOptions, type NewLifeOptions } from '@/engine/simulation/createGame';
import type { GameState } from '@/types/game';
import { resolveChoice, dismissEvent } from '@/engine/events/resolve';
import { ageUp } from '@/engine/simulation/ageUp';

export function newGame(seed = 42, patch: Partial<NewLifeOptions> = {}): GameState {
  return createGame({ ...randomLifeOptions(seed), seed, ...patch });
}

/** Resolves every pending event with its first available choice. */
export function resolveAllFirst(s: GameState): GameState {
  let st = s;
  for (let guard = 0; guard < 20 && st.pendingEvents.length; guard++) {
    const p = st.pendingEvents[0];
    if (!p.resolved) {
      const choice = p.choiceIds.find((c) => {
        try {
          resolveChoice(st, p.instanceId, c);
          return true;
        } catch {
          return false;
        }
      });
      st = resolveChoice(st, p.instanceId, choice ?? p.choiceIds[0]);
    }
    st = dismissEvent(st, p.instanceId);
    if (st.death) break;
  }
  return st;
}

/** Ages the character N years, resolving events with the first choice. */
export function advance(s: GameState, years: number): GameState {
  let st = s;
  for (let i = 0; i < years && !st.death; i++) {
    st = resolveAllFirst(st);
    if (st.death) break;
    st = ageUp(st);
  }
  return resolveAllFirst(st);
}
