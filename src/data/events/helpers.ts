import type { StatKey, Tone } from '@/types/core';
import type { ChoiceDef, Condition, Effect, EventDef, OutcomeDef, RelTarget, StatBias, WeightMod } from '@/types/events';

/** Compact builders used by the event content files. */
export const ev = (def: EventDef): EventDef => def;

export const st = (key: StatKey, delta: number): Effect => ({ t: 'stat', key, delta });
export const happy = (d: number) => st('happiness', d);
export const health = (d: number) => st('health', d);
export const smart = (d: number) => st('intelligence', d);
export const looks = (d: number) => st('appearance', d);
export const fit = (d: number) => st('fitness', d);
export const stress = (d: number) => st('stress', d);
export const rep = (d: number) => st('reputation', d);
export const disc = (d: number) => st('discipline', d);
export const money = (amount: number, label?: string): Effect => ({ t: 'money', amount, label });
export const pay = (v: string, label?: string): Effect => ({ t: 'moneyVar', v, mult: -1, label });
export const gain = (v: string, label?: string): Effect => ({ t: 'moneyVar', v, mult: 1, label });
export const flag = (key: string): Effect => ({ t: 'flag', key });
export const rel = (target: RelTarget, strength: number, trust = 0): Effect => ({ t: 'rel', target, strength, trust });
export const later = (eventId: string, years: number): Effect => ({ t: 'schedule', eventId, years });
export const delayed = (years: number, text: string, tone: Tone, effects: Effect[]): Effect => ({ t: 'delayed', years, text, tone, effects });
export const cond = (id: string, severity?: number): Effect => ({ t: 'addCondition', id, severity });
export const perf = (d: number): Effect => ({ t: 'performance', delta: d });
export const school = (d: number): Effect => ({ t: 'schoolPerf', delta: d });

interface OutOpts {
  w?: number;
  tone?: Tone;
  bias?: StatBias[];
  mods?: WeightMod[];
}

export const out = (text: string, effects: Effect[], o: OutOpts = {}): OutcomeDef => ({
  text,
  effects,
  weight: o.w ?? 1,
  tone: o.tone,
  bias: o.bias,
  mods: o.mods,
});
export const good = (text: string, effects: Effect[], o: OutOpts = {}) => out(text, effects, { tone: 'positive', ...o });
export const bad = (text: string, effects: Effect[], o: OutOpts = {}) => out(text, effects, { tone: 'negative', ...o });

export const choice = (label: string, outcomes: OutcomeDef[], o: { cond?: Condition[]; cost?: number | string } = {}): ChoiceDef => ({
  label,
  outcomes,
  conditions: o.cond,
  requiresMoney: o.cost,
});

/** Shorthand for a single-outcome choice. */
export const pick = (label: string, text: string, effects: Effect[], tone?: Tone, o: { cond?: Condition[]; cost?: number | string } = {}): ChoiceDef =>
  choice(label, [out(text, effects, { tone })], o);

export const bias = (key: StatKey, factor: number): StatBias => ({ key, factor });
export const C = {
  stat: (key: StatKey, min?: number, max?: number): Condition => ({ t: 'stat', key, min, max }),
  flag: (key: string, value = true): Condition => ({ t: 'flag', key, value }),
  seen: (id: string, value = true): Condition => ({ t: 'seen', id, value }),
  employed: (value = true): Condition => ({ t: 'employed', value }),
  student: (value = true): Condition => ({ t: 'student', value }),
  married: (value = true): Condition => ({ t: 'married', value }),
  homeowner: (value = true): Condition => ({ t: 'homeowner', value }),
  money: (min?: number, max?: number): Condition => ({ t: 'money', min, max }),
  rel: (kind: Parameters<typeof relCond>[0], min = 1, max?: number): Condition => relCond(kind, min, max),
  noPartner: (): Condition => ({ t: 'rel', kind: ['partner', 'spouse'], min: 0, max: 0 }),
  trait: (id: Parameters<typeof traitCond>[0], value = true): Condition => traitCond(id, value),
  children: (min?: number, max?: number): Condition => ({ t: 'children', min, max }),
  retired: (value = true): Condition => ({ t: 'retired', value }),
  home: (value = true): Condition => ({ t: 'livingWithParents', value }),
  record: (value = true): Condition => ({ t: 'record', value }),
  bg: (value: string | string[]): Condition => ({ t: 'background', value }),
  occ: (cat: string | string[]): Condition => ({ t: 'occupationCategory', cat }),
  enrolled: (level: Parameters<typeof enrolledCond>[0]): Condition => enrolledCond(level),
  gender: (value: 'male' | 'female'): Condition => ({ t: 'gender', value }),
  economy: (phase: 'boom' | 'normal' | 'recession'): Condition => ({ t: 'economy', phase }),
  asset: (kind: Parameters<typeof assetCond>[0], value = true): Condition => assetCond(kind, value),
  condition: (id: string, value = true): Condition => ({ t: 'condition', id, value }),
  edu: (min?: Parameters<typeof eduCond>[0], max?: Parameters<typeof eduCond>[0]): Condition => eduCond(min, max),
  debt: (min?: number, max?: number, kind?: 'student' | 'consumer' | 'mortgage' | 'business'): Condition => ({ t: 'debt', min, max, kind }),
  not: (c: Condition): Condition => ({ t: 'not', c }),
  any: (...of: Condition[]): Condition => ({ t: 'any', of }),
  prison: (value = true): Condition => ({ t: 'inPrison', value }),
};

function relCond(kind: import('@/types/game').RelKind | import('@/types/game').RelKind[], min?: number, max?: number): Condition {
  return { t: 'rel', kind, min, max };
}
function traitCond(id: import('@/types/core').TraitId, value: boolean): Condition {
  return { t: 'trait', id, value };
}
function enrolledCond(level: import('@/types/core').EduLevel | import('@/types/core').EduLevel[]): Condition {
  return { t: 'enrolledLevel', level };
}
function assetCond(kind: import('@/types/game').AssetKind | import('@/types/game').AssetKind[], value: boolean): Condition {
  return { t: 'hasAsset', kind, value };
}
function eduCond(min?: import('@/types/core').EduLevel, max?: import('@/types/core').EduLevel): Condition {
  return { t: 'eduLevel', min, max };
}

export const mod = (when: Condition, mult: number): WeightMod => ({ when, mult });
