import type { GameState } from '@/types/game';
import { idb, STORE_META, STORE_SAVES } from './db';
import { normalizeState, InvalidSaveError } from './saveFormat';
import { playerAge } from '@/engine/simulation/helpers';

export const SLOT_COUNT = 3;

export interface SlotInfo {
  slot: number;
  empty: boolean;
  name?: string;
  age?: number;
  generation?: number;
  dead?: boolean;
  updatedAt?: number;
  year?: number;
  corrupt?: boolean;
  look?: GameState['people'][string]['appearanceLook'];
  gender?: 'male' | 'female';
}

interface StoredSave {
  updatedAt: number;
  state: GameState;
}

export async function saveToSlot(slot: number, state: GameState): Promise<void> {
  const record: StoredSave = { updatedAt: Date.now(), state };
  await idb.put(STORE_SAVES, slot, record);
  await idb.put(STORE_META, 'lastSlot', slot);
}

export async function loadFromSlot(slot: number): Promise<GameState> {
  const rec = await idb.get<StoredSave>(STORE_SAVES, slot);
  if (!rec) throw new InvalidSaveError('Tom lagringsplass.');
  return normalizeState(rec.state as unknown as Record<string, unknown>);
}

export async function deleteSlot(slot: number): Promise<void> {
  await idb.delete(STORE_SAVES, slot);
}

export async function lastSlot(): Promise<number | undefined> {
  return idb.get<number>(STORE_META, 'lastSlot');
}

export async function listSlots(): Promise<SlotInfo[]> {
  const out: SlotInfo[] = [];
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    try {
      const rec = await idb.get<StoredSave>(STORE_SAVES, slot);
      if (!rec) {
        out.push({ slot, empty: true });
        continue;
      }
      const s = rec.state;
      const p = s.people?.[s.playerId];
      if (!p) {
        out.push({ slot, empty: false, corrupt: true });
        continue;
      }
      out.push({
        slot,
        empty: false,
        name: `${p.firstName} ${p.lastName}`,
        age: playerAge(s),
        generation: s.generation,
        dead: !!s.death,
        updatedAt: rec.updatedAt,
        year: s.year,
        look: p.appearanceLook,
        gender: p.gender,
      });
    } catch {
      out.push({ slot, empty: false, corrupt: true });
    }
  }
  return out;
}
