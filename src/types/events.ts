import type { EduLevel, Gender, MilestoneKind, StatKey, Tone, TraitId } from './core';
import type { AssetKind, DebtKind, EconomyPhase, RelKind } from './game';

/** Data-driven condition DSL evaluated against the game state. */
export type Condition =
  | { t: 'stat'; key: StatKey; min?: number; max?: number }
  | { t: 'money'; min?: number; max?: number }
  | { t: 'netWorth'; min?: number; max?: number }
  | { t: 'flag'; key: string; value?: boolean }
  | { t: 'rel'; kind: RelKind | RelKind[]; min?: number; max?: number }
  | { t: 'employed'; value: boolean }
  | { t: 'student'; value: boolean }
  | { t: 'enrolledLevel'; level: EduLevel | EduLevel[] }
  | { t: 'eduLevel'; min?: EduLevel; max?: EduLevel }
  | { t: 'occupationCategory'; cat: string | string[] }
  | { t: 'gender'; value: Gender }
  | { t: 'trait'; id: TraitId; value?: boolean }
  | { t: 'seen'; id: string; value?: boolean }
  | { t: 'married'; value: boolean }
  | { t: 'homeowner'; value: boolean }
  | { t: 'hasAsset'; kind: AssetKind | AssetKind[]; value?: boolean }
  | { t: 'inPrison'; value: boolean }
  | { t: 'condition'; id: string; value?: boolean }
  | { t: 'record'; value: boolean }
  | { t: 'livingWithParents'; value: boolean }
  | { t: 'retired'; value: boolean }
  | { t: 'children'; min?: number; max?: number }
  | { t: 'economy'; phase: EconomyPhase }
  | { t: 'background'; value: string | string[] }
  | { t: 'debt'; kind?: DebtKind; min?: number; max?: number }
  | { t: 'salary'; min?: number; max?: number }
  /** Calendar year window (historical events, technology availability). */
  | { t: 'year'; min?: number; max?: number }
  | { t: 'any'; of: Condition[] }
  | { t: 'not'; c: Condition };

/** Who an effect targets: the NPC bound to the event, or the first NPC of a relationship kind. */
export type RelTarget = 'bound' | RelKind;

export type Effect =
  | { t: 'stat'; key: StatKey; delta: number }
  | { t: 'money'; amount: number; label?: string }
  /** Money from an event variable, multiplied by `mult` (negative to pay). */
  | { t: 'moneyVar'; v: string; mult: number; label?: string }
  /** Money as a fraction of annual salary (or a fallback amount if unemployed). */
  | { t: 'salaryPct'; pct: number; fallback: number; label?: string }
  | { t: 'flag'; key: string; value?: number }
  | { t: 'unflag'; key: string }
  /** Increments a numeric flag (counter). */
  | { t: 'count'; key: string }
  | { t: 'rel'; target: RelTarget; strength?: number; trust?: number; attraction?: number; loyalty?: number }
  | { t: 'newRel'; kind: 'friend' | 'bestFriend' | 'partner' | 'enemy' | 'coworker'; ageOffset?: number }
  | { t: 'promoteRel'; target: RelTarget; kind: RelKind }
  | { t: 'endRel'; target: RelTarget; to: 'ex' | 'estranged' | 'remove' }
  | { t: 'lend'; target: RelTarget; v: string; mult: number }
  | { t: 'npcStat'; target: RelTarget; key: StatKey; delta: number }
  | { t: 'npcWealth'; target: RelTarget; amount: number }
  | { t: 'npcDie'; target: RelTarget; cause: string }
  | { t: 'addCondition'; id: string; severity?: number }
  | { t: 'removeCondition'; id: string }
  | { t: 'addiction'; id: string; delta: number }
  /** Adds a loan. `financesAsset` = the loan paid for something received in the same outcome (no cash payout). */
  | { t: 'debt'; kind: DebtKind; amount: number; label: string; financesAsset?: boolean }
  | { t: 'crime'; crime: string; severity: number }
  | { t: 'loseJob'; reason: 'fired' | 'laidOff' }
  | { t: 'performance'; delta: number }
  | { t: 'schoolPerf'; delta: number }
  | { t: 'schedule'; eventId: string; years: number }
  | { t: 'delayed'; years: number; effects: Effect[]; text: string; tone: Tone }
  | { t: 'milestone'; kind: MilestoneKind }
  | { t: 'baby' }
  | { t: 'marry' }
  | { t: 'divorce' }
  | { t: 'moveOut' }
  | { t: 'gainAsset'; catalogId: string }
  | { t: 'death'; cause: string }
  | { t: 'military'; serve: boolean }
  | { t: 'retire' }
  | { t: 'enroll'; programId: string }
  | { t: 'trial'; mode: 'plead' | 'defend' | 'lawyer' }
  | { t: 'prisonTime'; delta: number }
  | { t: 'license' }
  | { t: 'adoptPet' }
  | { t: 'sibling' }
  | { t: 'inheritance'; v: string };

export interface WeightMod {
  when: Condition;
  mult: number;
}

/** Scales an outcome weight by a stat: mult = 1 + factor * (stat - 50) / 50. */
export interface StatBias {
  key: StatKey;
  factor: number;
}

export interface OutcomeDef {
  weight?: number;
  mods?: WeightMod[];
  bias?: StatBias[];
  text: string;
  tone?: Tone;
  effects: Effect[];
}

export interface ChoiceDef {
  label: string;
  /** Hidden unless all conditions hold. */
  conditions?: Condition[];
  /** Cash the player must have to pick this choice (shown on the button). */
  requiresMoney?: number | string;
  outcomes: OutcomeDef[];
}

export type VarSpec =
  | { t: 'range'; min: number; max: number; step?: number; nok?: boolean }
  | { t: 'salaryPct'; pct: number; fallback: number };

export type EventCategory =
  | 'family'
  | 'school'
  | 'social'
  | 'love'
  | 'career'
  | 'money'
  | 'health'
  | 'crime'
  | 'random'
  | 'milestone'
  | 'world'
  | 'senior';

export interface TargetSpec {
  kinds: RelKind[];
  minStrength?: number;
  maxStrength?: number;
  /** NPC must be at least this old. */
  minAge?: number;
  maxAge?: number;
}

export interface EventDef {
  id: string;
  category: EventCategory;
  title: string;
  text: string;
  minAge: number;
  maxAge: number;
  weight: number;
  mods?: WeightMod[];
  conditions?: Condition[];
  target?: TargetSpec;
  cooldown?: number;
  maxOccurrences?: number;
  vars?: Record<string, VarSpec>;
  choices?: ChoiceDef[];
  /** Auto-resolved outcomes when the event has no choices. */
  outcomes?: OutcomeDef[];
  /** Only triggered through `schedule` effects, never by random selection. */
  scheduledOnly?: boolean;
  /** Priority events are raised before random ones whenever eligible (e.g. school choice). */
  priority?: boolean;
  tone: Tone;
  icon?: string;
}
