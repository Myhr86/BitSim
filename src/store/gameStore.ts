import { create } from 'zustand';
import type { GameState, Milestone } from '@/types/game';
import type { MilestoneKind } from '@/types/core';
import { createGame, type NewLifeOptions } from '@/engine/simulation/createGame';
import { ageUp, AgeUpBlocked } from '@/engine/simulation/ageUp';
import { dismissEvent, resolveChoice, GameError } from '@/engine/events/resolve';
import { continueAsHeir } from '@/engine/legacy/legacy';
import type { ActionResult } from '@/engine/simulation/actions';
import { evaluateAchievements, getAchievement } from '@/engine/achievements/definitions';
import { deleteSlot, lastSlot, listSlots, loadFromSlot, saveToSlot, type SlotInfo } from '@/services/saves';
import { DEFAULT_META, loadMeta, saveMeta, type MetaSettings, type MetaState } from '@/services/meta';
import { parseSave, serializeSave, InvalidSaveError } from '@/services/saveFormat';
import { configureFeedback, haptic, playSound } from '@/services/feedback';
import { t } from '@/i18n';

export type Screen = 'loading' | 'menu' | 'create' | 'game';
export type Tab = 'life' | 'career' | 'relations' | 'finance' | 'activities';

export interface Toast {
  id: number;
  text: string;
  tone: 'positive' | 'negative' | 'neutral' | 'achievement';
  title?: string;
}

const CELEBRATED: MilestoneKind[] = ['childBorn', 'wedding', 'graduation', 'firstHome', 'firstMillion', 'careerPeak', 'retirement', 'grandchild', 'business'];

interface GameStore {
  screen: Screen;
  tab: Tab;
  state: GameState | null;
  slot: number;
  slots: SlotInfo[];
  meta: MetaState;
  toasts: Toast[];
  celebration: Milestone | null;
  busy: boolean;

  init: () => Promise<void>;
  setScreen: (s: Screen) => void;
  setTab: (t: Tab) => void;
  refreshSlots: () => Promise<void>;
  newGame: (opts: NewLifeOptions, slot: number) => Promise<void>;
  loadSlot: (slot: number) => Promise<void>;
  removeSlot: (slot: number) => Promise<void>;
  exportCurrent: () => string | null;
  exportSlot: (slot: number) => Promise<string | null>;
  importSave: (json: string, slot: number) => Promise<boolean>;
  ageUp: () => void;
  choose: (instanceId: string, choiceIndex: number) => void;
  dismiss: (instanceId: string) => void;
  act: (fn: (s: GameState) => ActionResult) => ActionResult | null;
  continueAs: (heirId: string) => void;
  toast: (text: string, tone?: Toast['tone'], title?: string) => void;
  dropToast: (id: number) => void;
  closeCelebration: () => void;
  updateSettings: (patch: Partial<MetaSettings>) => void;
  quitToMenu: () => void;
}

let toastId = 0;
let saveQueue: Promise<void> = Promise.resolve();

export const useGame = create<GameStore>((set, get) => {
  /** Applies a new game state: persists it, unlocks achievements, triggers celebrations. */
  const commit = (next: GameState, prev: GameState | null) => {
    const s = { ...next, updatedAt: Date.now() };
    set({ state: s });
    const slot = get().slot;
    saveQueue = saveQueue.then(() => saveToSlot(slot, s)).catch(() => undefined);
    // Achievements persist globally across lives.
    const meta = get().meta;
    const fresh = evaluateAchievements(s, new Set(Object.keys(meta.achievements))).concat(
      s.unlockedThisSave.filter((id) => !meta.achievements[id]),
    );
    const unique = [...new Set(fresh)];
    if (unique.length > 0) {
      const achievements = { ...meta.achievements };
      for (const id of unique) achievements[id] = Date.now();
      const nextMeta = { ...meta, achievements };
      set({ meta: nextMeta });
      void saveMeta(nextMeta);
      for (const id of unique) {
        const a = getAchievement(id);
        if (a) get().toast(a.name, 'achievement', t('achievementUnlocked'));
      }
    }
    // Celebrations for new important milestones.
    const before = prev?.milestones.length ?? 0;
    const added = s.milestones.slice(before).filter((m) => CELEBRATED.includes(m.kind) && m.text);
    if (added.length > 0 && prev && !s.death) {
      set({ celebration: added[added.length - 1] });
      playSound('milestone');
      haptic('success');
    }
    if (s.death && !prev?.death) {
      const m = get().meta;
      const nextMeta = { ...m, livesLived: m.livesLived + 1, bestLegacy: Math.max(m.bestLegacy, s.death.summary.legacyScore) };
      set({ meta: nextMeta });
      void saveMeta(nextMeta);
    }
  };

  return {
    screen: 'loading',
    tab: 'life',
    state: null,
    slot: 0,
    slots: [],
    meta: structuredClone(DEFAULT_META),
    toasts: [],
    celebration: null,
    busy: false,

    init: async () => {
      const meta = await loadMeta();
      configureFeedback(meta.settings);
      const slots: SlotInfo[] = await listSlots().catch(() => []);
      set({ meta, slots, screen: 'menu' });
      try {
        const last = await lastSlot();
        if (last !== undefined) set({ slot: last });
      } catch {
        // ignore
      }
    },
    setScreen: (screen) => set({ screen }),
    setTab: (tab) => {
      haptic('light');
      set({ tab });
    },
    refreshSlots: async () => {
      try {
        set({ slots: await listSlots() });
      } catch {
        set({ slots: [] });
      }
    },
    newGame: async (opts, slot) => {
      const state = createGame(opts);
      set({ slot, tab: 'life', screen: 'game', celebration: null });
      commit(state, null);
      await saveQueue;
      await get().refreshSlots();
    },
    loadSlot: async (slot) => {
      try {
        const state = await loadFromSlot(slot);
        set({ state, slot, tab: 'life', screen: 'game', celebration: null });
      } catch (e) {
        get().toast(e instanceof Error ? e.message : 'Kunne ikke laste', 'negative');
      }
    },
    removeSlot: async (slot) => {
      await deleteSlot(slot);
      if (get().slot === slot && get().screen !== 'game') set({ state: null });
      await get().refreshSlots();
    },
    exportCurrent: () => {
      const s = get().state;
      return s ? serializeSave(s) : null;
    },
    exportSlot: async (slot) => {
      try {
        return serializeSave(await loadFromSlot(slot));
      } catch {
        return null;
      }
    },
    importSave: async (json, slot) => {
      try {
        const state = parseSave(json);
        await saveToSlot(slot, state);
        await get().refreshSlots();
        get().toast(t('imported'), 'positive');
        return true;
      } catch (e) {
        get().toast(e instanceof InvalidSaveError ? e.message : t('importFailed'), 'negative', t('importFailed'));
        return false;
      }
    },
    ageUp: () => {
      const prev = get().state;
      if (!prev || get().busy) return;
      try {
        set({ busy: true });
        const next = ageUp(prev);
        haptic('medium');
        playSound(next.death ? 'bad' : 'year');
        commit(next, prev);
      } catch (e) {
        if (e instanceof AgeUpBlocked) get().toast(t('resolveFirst'), 'neutral');
        else get().toast(e instanceof Error ? e.message : 'Feil', 'negative');
      } finally {
        set({ busy: false });
      }
    },
    choose: (instanceId, choiceIndex) => {
      const prev = get().state;
      if (!prev) return;
      try {
        const next = resolveChoice(prev, instanceId, choiceIndex);
        haptic('light');
        commit(next, prev);
      } catch (e) {
        get().toast(e instanceof GameError && e.message === 'Not enough money' ? 'Du har ikke råd til dette valget.' : 'Kunne ikke velge', 'negative');
      }
    },
    dismiss: (instanceId) => {
      const prev = get().state;
      if (!prev) return;
      commit(dismissEvent(prev, instanceId), prev);
    },
    act: (fn) => {
      const prev = get().state;
      if (!prev) return null;
      const r = fn(prev);
      if (r.ok) {
        commit(r.state, prev);
        haptic(r.tone === 'negative' ? 'warning' : 'light');
      }
      if (r.message) get().toast(r.message, r.ok ? (r.tone ?? 'neutral') : 'negative');
      return r;
    },
    continueAs: (heirId) => {
      const prev = get().state;
      if (!prev) return;
      const next = continueAsHeir(prev, heirId);
      set({ tab: 'life' });
      commit(next, null);
      playSound('milestone');
    },
    toast: (text, tone = 'neutral', title) => {
      const id = ++toastId;
      set({ toasts: [...get().toasts.slice(-2), { id, text, tone, title }] });
      setTimeout(() => get().dropToast(id), tone === 'achievement' ? 3800 : 2600);
    },
    dropToast: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
    closeCelebration: () => set({ celebration: null }),
    updateSettings: (patch) => {
      const meta = { ...get().meta, settings: { ...get().meta.settings, ...patch } };
      configureFeedback(meta.settings);
      set({ meta });
      void saveMeta(meta);
    },
    quitToMenu: () => {
      set({ screen: 'menu', celebration: null });
      void get().refreshSlots();
    },
  };
});
