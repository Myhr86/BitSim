import type { GameState } from '@/types/game';
import { validateState } from '@/engine/simulation/validate';
import { migrate } from './migrations';
import { SAVE_VERSION } from '@/engine/simulation/version';

export const SAVE_MAGIC = 'lifepath-save';

export interface SaveEnvelope {
  magic: typeof SAVE_MAGIC;
  version: number;
  exportedAt: number;
  state: GameState;
}

export class InvalidSaveError extends Error {}

const REQUIRED_KEYS: (keyof GameState)[] = [
  'saveId', 'seed', 'rngState', 'year', 'playerId', 'people', 'relationships', 'timeline', 'pendingEvents',
  'economy', 'finances', 'assets', 'education', 'career', 'health', 'crime', 'flags', 'eventHistory',
];

export function serializeSave(state: GameState): string {
  const env: SaveEnvelope = { magic: SAVE_MAGIC, version: SAVE_VERSION, exportedAt: Date.now(), state };
  return JSON.stringify(env);
}

/** Parses, migrates and validates a save. Throws InvalidSaveError on anything suspicious. */
export function parseSave(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new InvalidSaveError('Filen er ikke gyldig JSON.');
  }
  if (!parsed || typeof parsed !== 'object') throw new InvalidSaveError('Tom eller ugyldig fil.');
  const env = parsed as Partial<SaveEnvelope> & Record<string, unknown>;
  const rawState = (env.magic === SAVE_MAGIC ? env.state : env) as Record<string, unknown> | undefined;
  if (!rawState || typeof rawState !== 'object') throw new InvalidSaveError('Fant ingen spilldata i filen.');
  return normalizeState(rawState);
}

export function normalizeState(rawState: Record<string, unknown>): GameState {
  let migrated: Record<string, unknown>;
  try {
    migrated = migrate(rawState);
  } catch (e) {
    throw new InvalidSaveError(e instanceof Error ? e.message : 'Kunne ikke oppgradere lagringen.');
  }
  for (const k of REQUIRED_KEYS) {
    if (!(k in migrated)) throw new InvalidSaveError(`Lagringen mangler feltet «${k}».`);
  }
  const state = migrated as unknown as GameState;
  if (typeof state.people !== 'object' || !state.people[state.playerId]) throw new InvalidSaveError('Lagringen mangler spillerkarakteren.');
  const problems = validateState(state);
  if (problems.length > 0) throw new InvalidSaveError(`Lagringen er skadet: ${problems[0]}`);
  return state;
}
