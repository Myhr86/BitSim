import { idb, STORE_META } from './db';

export type ThemePref = 'system' | 'light' | 'dark';

export interface MetaSettings {
  theme: ThemePref;
  haptics: boolean;
  sound: boolean;
  reducedMotion: boolean;
}

/** Persistent cross-life progression and preferences. */
export interface MetaState {
  achievements: Record<string, number>; // id -> unlocked timestamp
  livesLived: number;
  bestLegacy: number;
  settings: MetaSettings;
}

export const DEFAULT_META: MetaState = {
  achievements: {},
  livesLived: 0,
  bestLegacy: 0,
  settings: { theme: 'system', haptics: true, sound: true, reducedMotion: false },
};

export async function loadMeta(): Promise<MetaState> {
  try {
    const m = await idb.get<MetaState>(STORE_META, 'meta');
    if (!m) return structuredClone(DEFAULT_META);
    return { ...DEFAULT_META, ...m, settings: { ...DEFAULT_META.settings, ...m.settings } };
  } catch {
    return structuredClone(DEFAULT_META);
  }
}

export async function saveMeta(meta: MetaState): Promise<void> {
  try {
    await idb.put(STORE_META, 'meta', meta);
  } catch {
    // Persisting meta is best-effort; gameplay must continue without storage.
  }
}
