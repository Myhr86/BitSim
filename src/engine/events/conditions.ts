import type { Condition } from '@/types/events';
import type { GameState } from '@/types/game';
import { EDU_RANK } from '@/types/core';
import { getOccupation } from '@/data/occupations';
import { flag, player, playerAge, relsOf } from '../simulation/helpers';
import { netWorth } from '../assets/assets';
import { highestEducation } from '../education/education';
import { getProgram } from '@/data/education';

const inRange = (v: number, min?: number, max?: number) => (min === undefined || v >= min) && (max === undefined || v <= max);

/** Evaluates one data-driven condition against the game state. Pure. */
export function evalCondition(s: GameState, c: Condition): boolean {
  const p = player(s);
  switch (c.t) {
    case 'stat':
      return inRange(p.stats[c.key], c.min, c.max);
    case 'money':
      return inRange(s.finances.cash + s.finances.savingsAccount, scale(s, c.min), scale(s, c.max));
    case 'netWorth':
      return inRange(netWorth(s), scale(s, c.min), scale(s, c.max));
    case 'flag':
      return flag(s, c.key) === (c.value ?? true);
    case 'rel':
      return inRange(relsOf(s, c.kind).length, c.min ?? 1, c.max);
    case 'employed':
      return (s.career.job !== null && !s.career.job.partTime) === c.value;
    case 'student':
      return (s.education.current != null) === c.value;
    case 'enrolledLevel': {
      const lv = s.education.current ? getProgram(s.education.current.programId)?.level : undefined;
      const want = Array.isArray(c.level) ? c.level : [c.level];
      return lv !== undefined && want.includes(lv);
    }
    case 'eduLevel': {
      const r = EDU_RANK[highestEducation(s)];
      return inRange(r, c.min ? EDU_RANK[c.min] : undefined, c.max ? EDU_RANK[c.max] : undefined);
    }
    case 'occupationCategory': {
      const occ = s.career.job ? getOccupation(s.career.job.occupationId) : undefined;
      const cats = Array.isArray(c.cat) ? c.cat : [c.cat];
      return !!occ && cats.includes(occ.category);
    }
    case 'gender':
      return p.gender === c.value;
    case 'trait':
      return p.traits.includes(c.id) === (c.value ?? true);
    case 'seen':
      return (s.eventHistory[c.id] !== undefined) === (c.value ?? true);
    case 'married':
      return relsOf(s, 'spouse').length > 0 === c.value;
    case 'homeowner':
      return s.assets.some((a) => a.residence) === c.value;
    case 'hasAsset': {
      const kinds = Array.isArray(c.kind) ? c.kind : [c.kind];
      return s.assets.some((a) => kinds.includes(a.kind)) === (c.value ?? true);
    }
    case 'inPrison':
      return s.crime.prisonYearsLeft > 0 === c.value;
    case 'condition':
      return s.health.conditions.some((x) => x.id === c.id) === (c.value ?? true);
    case 'record':
      return s.crime.records.length > 0 === c.value;
    case 'livingWithParents':
      return s.livingWithParents === c.value;
    case 'retired':
      return s.career.retired === c.value;
    case 'children':
      return inRange(relsOf(s, 'child').length, c.min, c.max);
    case 'economy':
      return s.economy.phase === c.phase;
    case 'background': {
      const v = Array.isArray(c.value) ? c.value : [c.value];
      return v.includes(s.background);
    }
    case 'debt': {
      const total = s.finances.debts.filter((d) => !c.kind || d.kind === c.kind).reduce((a, d) => a + d.principal, 0);
      return inRange(total, scale(s, c.min), scale(s, c.max));
    }
    case 'salary':
      return inRange(s.career.job?.salary ?? 0, scale(s, c.min), scale(s, c.max));
    case 'any':
      return c.of.some((x) => evalCondition(s, x));
    case 'not':
      return !evalCondition(s, c.c);
  }
}

/** Money thresholds in data are expressed at start-of-save prices. */
function scale(s: GameState, v?: number): number | undefined {
  return v === undefined ? undefined : v * s.economy.priceIndex;
}

export function evalAll(s: GameState, cs?: Condition[]): boolean {
  return !cs || cs.every((c) => evalCondition(s, c));
}

export function isAgeBetween(s: GameState, min: number, max: number): boolean {
  const a = playerAge(s);
  return a >= min && a <= max;
}
