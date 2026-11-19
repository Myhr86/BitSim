import { SAVE_VERSION } from '@/engine/simulation/version';

type RawSave = Record<string, unknown>;
type Migration = (raw: RawSave) => RawSave;

/**
 * Save-file migrations keyed by the version they upgrade *from*.
 * Version 0 was the pre-release format that lacked dating preference,
 * pension fields and job offers.
 */
export const MIGRATIONS: Record<number, Migration> = {
  0: (raw) => {
    const finances = (raw.finances ?? {}) as Record<string, unknown>;
    const career = (raw.career ?? {}) as Record<string, unknown>;
    return {
      ...raw,
      datingPreference: raw.datingPreference ?? 'any',
      finances: {
        pensionEntitlement: 0,
        pensionAnnual: 0,
        peakNetWorth: 0,
        ...finances,
      },
      career: { offer: null, ...career },
      version: 1,
    };
  },
};

export class SaveVersionError extends Error {}

export function migrate(raw: RawSave): RawSave {
  let current = raw;
  let v = typeof current.version === 'number' ? current.version : 0;
  if (v > SAVE_VERSION) throw new SaveVersionError(`Save version ${v} is newer than supported ${SAVE_VERSION}`);
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new SaveVersionError(`No migration from version ${v}`);
    current = m(current);
    v = typeof current.version === 'number' ? current.version : v + 1;
  }
  return current;
}
