import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { serializeSave, parseSave, InvalidSaveError } from '@/services/saveFormat';
import { migrate, SaveVersionError } from '@/services/migrations';
import { saveToSlot, loadFromSlot, listSlots, deleteSlot } from '@/services/saves';
import { loadMeta, saveMeta } from '@/services/meta';
import { resetDbConnection } from '@/services/db';
import { SAVE_VERSION } from '@/engine/simulation/version';
import { advance, newGame } from './helpers';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetDbConnection();
});

describe('save format', () => {
  it('round-trips a game state', () => {
    const s = advance(newGame(70), 20);
    expect(parseSave(serializeSave(s))).toEqual(s);
  });

  it('rejects garbage and incomplete saves', () => {
    expect(() => parseSave('not json')).toThrow(InvalidSaveError);
    expect(() => parseSave('{}')).toThrow(InvalidSaveError);
    expect(() => parseSave(JSON.stringify({ magic: 'lifepath-save', state: { version: 1 } }))).toThrow(InvalidSaveError);
  });

  it('rejects states that violate invariants', () => {
    const s = newGame(71);
    s.people[s.playerId].stats.health = 250;
    expect(() => parseSave(serializeSave(s))).toThrow(InvalidSaveError);
  });

  it('migrates a version 0 save', () => {
    const s = newGame(72) as unknown as Record<string, unknown>;
    const old: Record<string, unknown> = { ...s, version: 0 };
    delete old.datingPreference;
    const fin = { ...(old.finances as Record<string, unknown>) };
    delete fin.pensionAnnual;
    delete fin.pensionEntitlement;
    old.finances = fin;
    const m = migrate(old);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.datingPreference).toBe('any');
    expect((m.finances as Record<string, unknown>).pensionAnnual).toBe(0);
    expect(() => parseSave(JSON.stringify(old))).not.toThrow();
  });

  it('refuses saves from a newer version', () => {
    expect(() => migrate({ version: SAVE_VERSION + 5 })).toThrow(SaveVersionError);
  });

  it('persists unresolved events so decisions cannot be rerolled', () => {
    const s = advance(newGame(73), 15);
    const withPending = { ...s, pendingEvents: [{ instanceId: 'e1', eventId: 'teen_fight', title: 'x', text: 'y', vars: {}, choiceIds: [0, 1] }] };
    const back = parseSave(serializeSave(withPending));
    expect(back.pendingEvents).toHaveLength(1);
    expect(back.rngState).toBe(withPending.rngState);
  });
});

describe('IndexedDB slots', () => {
  it('saves, lists, loads and deletes', async () => {
    const s = advance(newGame(74), 5);
    await saveToSlot(1, s);
    const slots = await listSlots();
    expect(slots[1].empty).toBe(false);
    expect(slots[0].empty).toBe(true);
    const loaded = await loadFromSlot(1);
    expect(loaded.year).toBe(s.year);
    await deleteSlot(1);
    expect((await listSlots())[1].empty).toBe(true);
  });

  it('persists achievements in meta storage', async () => {
    const meta = await loadMeta();
    meta.achievements.millionaire = 123;
    await saveMeta(meta);
    expect((await loadMeta()).achievements.millionaire).toBe(123);
  });
});
