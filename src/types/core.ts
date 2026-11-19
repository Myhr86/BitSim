/** Core shared primitive types for the LifePath simulation. */

export const STAT_KEYS = [
  'happiness',
  'health',
  'intelligence',
  'appearance',
  'fitness',
  'stress',
  'reputation',
  'discipline',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Gender = 'male' | 'female';

export type TraitId =
  | 'ambitious'
  | 'lazy'
  | 'kind'
  | 'hotheaded'
  | 'creative'
  | 'shy'
  | 'charismatic'
  | 'anxious'
  | 'adventurous'
  | 'frugal'
  | 'impulsive'
  | 'honest'
  | 'athletic'
  | 'bookish';

export type FamilyBackground = 'wealthy' | 'middle' | 'working' | 'single' | 'difficult';

export type LifeStage = 'baby' | 'child' | 'teen' | 'youngAdult' | 'adult' | 'senior';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Appearance {
  skin: number; // index into palette
  hair: number; // hair colour index
  hairStyle: number; // style index
  eyes: number;
}

export type EduLevel =
  | 'none'
  | 'primary'
  | 'lowerSecondary'
  | 'upperSecondary'
  | 'vocational'
  | 'bachelor'
  | 'master'
  | 'phd';

export const EDU_RANK: Record<EduLevel, number> = {
  none: 0,
  primary: 1,
  lowerSecondary: 2,
  upperSecondary: 3,
  vocational: 3,
  bachelor: 4,
  master: 5,
  phd: 6,
};

export type FieldId =
  | 'general'
  | 'health'
  | 'medicine'
  | 'law'
  | 'engineering'
  | 'it'
  | 'business'
  | 'education'
  | 'social'
  | 'arts'
  | 'science'
  | 'psychology'
  | 'electrician'
  | 'carpenter'
  | 'plumber'
  | 'chef'
  | 'mechanic'
  | 'healthworker'
  | 'hairdresser'
  | 'police'
  | 'military';

export type Tone = 'positive' | 'negative' | 'neutral' | 'financial' | 'relationship' | 'milestone';

export type MilestoneKind =
  | 'birth'
  | 'childBorn'
  | 'wedding'
  | 'graduation'
  | 'firstHome'
  | 'firstMillion'
  | 'careerPeak'
  | 'retirement'
  | 'license'
  | 'newJob'
  | 'grandchild'
  | 'business';
