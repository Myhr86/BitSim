export interface ConditionDef {
  id: string;
  name: string;
  chronic: boolean;
  /** Health lost per year while untreated (scaled by severity/100). */
  yearlyDamage: number;
  /** Additional annual mortality probability at severity 100. */
  mortality: number;
  /** Probability treatment cures (acute) or controls (chronic) the condition. */
  treatChance: number;
  treatCost: number;
  /** Natural recovery chance per year. */
  recoverChance: number;
  mental?: boolean;
  serious?: boolean;
  minAge: number;
  /** Base annual onset probability before lifestyle modifiers. */
  onset: number;
}

export const CONDITIONS: ConditionDef[] = [
  { id: 'flu', name: 'Influensa', chronic: false, yearlyDamage: 4, mortality: 0.0005, treatChance: 0.95, treatCost: 0, recoverChance: 0.95, minAge: 0, onset: 0.08 },
  { id: 'pneumonia', name: 'Lungebetennelse', chronic: false, yearlyDamage: 12, mortality: 0.02, treatChance: 0.9, treatCost: 0, recoverChance: 0.5, minAge: 0, onset: 0.008 },
  { id: 'asthma', name: 'Astma', chronic: true, yearlyDamage: 3, mortality: 0.001, treatChance: 0.85, treatCost: 3_000, recoverChance: 0.04, minAge: 2, onset: 0.006 },
  { id: 'broken_bone', name: 'Benbrudd', chronic: false, yearlyDamage: 8, mortality: 0, treatChance: 0.98, treatCost: 0, recoverChance: 0.9, minAge: 3, onset: 0.012 },
  { id: 'concussion', name: 'Hjernerystelse', chronic: false, yearlyDamage: 8, mortality: 0.002, treatChance: 0.9, treatCost: 0, recoverChance: 0.85, minAge: 3, onset: 0.006 },
  { id: 'depression', name: 'Depresjon', chronic: true, yearlyDamage: 5, mortality: 0.004, treatChance: 0.6, treatCost: 9_000, recoverChance: 0.18, mental: true, minAge: 12, onset: 0.012 },
  { id: 'anxiety', name: 'Angstlidelse', chronic: true, yearlyDamage: 3, mortality: 0.001, treatChance: 0.6, treatCost: 9_000, recoverChance: 0.18, mental: true, minAge: 10, onset: 0.012 },
  { id: 'burnout', name: 'Utbrenthet', chronic: false, yearlyDamage: 6, mortality: 0.001, treatChance: 0.7, treatCost: 6_000, recoverChance: 0.4, mental: true, minAge: 20, onset: 0 },
  { id: 'back_pain', name: 'Ryggplager', chronic: true, yearlyDamage: 2, mortality: 0, treatChance: 0.55, treatCost: 8_000, recoverChance: 0.15, minAge: 25, onset: 0.012 },
  { id: 'hypertension', name: 'Høyt blodtrykk', chronic: true, yearlyDamage: 3, mortality: 0.006, treatChance: 0.85, treatCost: 3_000, recoverChance: 0.02, minAge: 35, onset: 0.012 },
  { id: 'diabetes', name: 'Diabetes type 2', chronic: true, yearlyDamage: 4, mortality: 0.008, treatChance: 0.8, treatCost: 4_000, recoverChance: 0.02, minAge: 30, onset: 0.006 },
  { id: 'heart_disease', name: 'Hjertesykdom', chronic: true, yearlyDamage: 7, mortality: 0.03, treatChance: 0.65, treatCost: 15_000, recoverChance: 0.01, serious: true, minAge: 40, onset: 0.005 },
  { id: 'cancer', name: 'Kreft', chronic: false, yearlyDamage: 18, mortality: 0.12, treatChance: 0.6, treatCost: 0, recoverChance: 0.04, serious: true, minAge: 20, onset: 0.002 },
  { id: 'stroke', name: 'Hjerneslag', chronic: false, yearlyDamage: 16, mortality: 0.08, treatChance: 0.6, treatCost: 0, recoverChance: 0.3, serious: true, minAge: 50, onset: 0.003 },
  { id: 'arthritis', name: 'Leddgikt', chronic: true, yearlyDamage: 2, mortality: 0, treatChance: 0.5, treatCost: 5_000, recoverChance: 0.01, minAge: 45, onset: 0.008 },
  { id: 'dementia', name: 'Demens', chronic: true, yearlyDamage: 6, mortality: 0.04, treatChance: 0.2, treatCost: 20_000, recoverChance: 0, serious: true, minAge: 65, onset: 0.006 },
  { id: 'migraine', name: 'Migrene', chronic: true, yearlyDamage: 1, mortality: 0, treatChance: 0.65, treatCost: 3_000, recoverChance: 0.08, minAge: 10, onset: 0.006 },
  { id: 'liver_disease', name: 'Leversykdom', chronic: true, yearlyDamage: 8, mortality: 0.03, treatChance: 0.45, treatCost: 10_000, recoverChance: 0.02, serious: true, minAge: 25, onset: 0 },
  { id: 'lung_disease', name: 'KOLS', chronic: true, yearlyDamage: 6, mortality: 0.025, treatChance: 0.4, treatCost: 8_000, recoverChance: 0, serious: true, minAge: 40, onset: 0 },
  { id: 'injury', name: 'Alvorlig skade', chronic: false, yearlyDamage: 14, mortality: 0.01, treatChance: 0.85, treatCost: 0, recoverChance: 0.6, minAge: 5, onset: 0 },
];

export interface AddictionDef {
  id: string;
  name: string;
  healthDamage: number;
  happinessDamage: number;
  yearlyCost: number;
  /** Health condition the addiction may cause at high severity. */
  causes?: string;
}

export const ADDICTIONS: AddictionDef[] = [
  { id: 'alcohol', name: 'Alkohol', healthDamage: 5, happinessDamage: 3, yearlyCost: 30_000, causes: 'liver_disease' },
  { id: 'smoking', name: 'Røyking', healthDamage: 4, happinessDamage: 0, yearlyCost: 40_000, causes: 'lung_disease' },
  { id: 'gambling', name: 'Spill', healthDamage: 1, happinessDamage: 4, yearlyCost: 60_000 },
  { id: 'gaming', name: 'Dataspill', healthDamage: 1, happinessDamage: 1, yearlyCost: 5_000 },
];

const COND = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));
const ADD = Object.fromEntries(ADDICTIONS.map((a) => [a.id, a]));

export function getConditionDef(id: string): ConditionDef | undefined {
  return COND[id];
}
export function getAddictionDef(id: string): AddictionDef | undefined {
  return ADD[id];
}
