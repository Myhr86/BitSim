import type { EduLevel, FieldId, StatKey } from '@/types/core';

export type OccCategory =
  | 'health'
  | 'tech'
  | 'education'
  | 'trades'
  | 'service'
  | 'finance'
  | 'law'
  | 'public'
  | 'creative'
  | 'science'
  | 'transport'
  | 'industry'
  | 'sport'
  | 'politics'
  | 'military'
  | 'parttime';

export interface OccupationDef {
  id: string;
  title: string;
  category: OccCategory;
  education: EduLevel;
  fields?: FieldId[];
  minAge: number;
  maxAge?: number;
  /** Years of experience in the same category required. */
  experience?: number;
  salary: [number, number];
  stress: number;
  prestige: number;
  requirements?: { stat: StatKey; min: number }[];
  ladder: string[];
  /** Salary multiplier applied per ladder step. */
  ladderMult: number;
  partTime?: boolean;
  /** Typical retirement age for the occupation. */
  retirementAge: number;
  /** Rare positions that only show up occasionally in listings. */
  rarity?: number;
  /** A criminal record blocks hiring. */
  cleanRecord?: boolean;
  /** First calendar year the occupation exists (technology, institutions). */
  availableFrom?: number;
  /** Last calendar year the occupation exists. */
  availableUntil?: number;
}
