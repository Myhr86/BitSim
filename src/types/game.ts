import type {
  Appearance,
  Difficulty,
  EduLevel,
  FamilyBackground,
  FieldId,
  Gender,
  MilestoneKind,
  Stats,
  Tone,
  TraitId,
} from './core';

/** A person in the world: the player character or any NPC. */
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  alive: boolean;
  deathYear?: number;
  deathCause?: string;
  city: string;
  traits: TraitId[];
  stats: Stats;
  /** Genetic health baseline 0-100, inherited from parents. */
  genetics: number;
  appearanceLook: Appearance;
  motherId?: string;
  fatherId?: string;
  spouseId?: string;
  childrenIds: string[];
  /** Abstract NPC finances (net worth in NOK). Player finances live in GameState.finances. */
  wealth: number;
  /** Occupation id from the occupation catalogue, or a status keyword. */
  occupationId?: string;
  occupationStatus: 'none' | 'student' | 'employed' | 'unemployed' | 'retired';
  educationLevel: EduLevel;
  /** Generation index of the player lineage this person was the protagonist of (if any). */
  playedGeneration?: number;
}

export type RelKind =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'friend'
  | 'bestFriend'
  | 'partner'
  | 'spouse'
  | 'ex'
  | 'child'
  | 'grandchild'
  | 'grandparent'
  | 'coworker'
  | 'boss'
  | 'enemy';

export type RelStatus = 'active' | 'estranged' | 'deceased';

export interface Relationship {
  personId: string;
  kind: RelKind;
  strength: number; // 0-100 closeness
  trust: number; // 0-100
  attraction: number; // 0-100 (romantic only)
  loyalty: number; // 0-100
  since: number; // year
  status: RelStatus;
  /** Number of interactions in the current year (diminishing returns). */
  interactions: number;
  /** Money owed by this NPC to the player. */
  owes: number;
}

export interface TimelineEntry {
  id: string;
  age: number;
  year: number;
  text: string;
  tone: Tone;
  icon?: string;
  title?: string;
}

export interface PendingEvent {
  instanceId: string;
  eventId: string;
  title: string;
  text: string;
  boundPersonId?: string;
  vars: Record<string, number>;
  /** Indexes of choices available when the event was raised. */
  choiceIds: number[];
  /** Once resolved, the outcome is stored here until the player dismisses it. */
  resolved?: { choiceIndex: number; text: string; tone: Tone };
}

export interface ScheduledItem {
  id: string;
  dueYear: number;
  eventId?: string;
  boundPersonId?: string;
  /** Delayed consequence applied directly (no player decision). */
  effectsJson?: string;
  text?: string;
  tone?: Tone;
}

export interface EventHistoryEntry {
  count: number;
  lastYear: number;
}

export type EconomyPhase = 'boom' | 'normal' | 'recession';

export interface EconomyState {
  phase: EconomyPhase;
  yearsInPhase: number;
  inflation: number; // last year's inflation rate e.g. 0.025
  priceIndex: number; // cumulative, 1.0 at the start of the save
  interestRate: number; // policy rate
  housingIndex: number; // relative to start
  stockIndex: number; // relative to start
  lastStockReturn: number;
  lastHousingReturn: number;
  unemploymentRate: number;
}

export type TxCategory =
  | 'salary'
  | 'tax'
  | 'living'
  | 'rent'
  | 'mortgage'
  | 'debt'
  | 'asset'
  | 'investment'
  | 'gift'
  | 'benefit'
  | 'pension'
  | 'education'
  | 'activity'
  | 'event'
  | 'business'
  | 'inheritance'
  | 'crime'
  | 'fine'
  | 'health';

export interface Transaction {
  id: string;
  year: number;
  age: number;
  amount: number;
  category: TxCategory;
  label: string;
}

export interface YearSummary {
  year: number;
  age: number;
  income: number;
  taxes: number;
  expenses: number;
  debtPayments: number;
  investmentReturn: number;
  netChange: number;
  netWorth: number;
  happiness: number;
}

export type DebtKind = 'student' | 'consumer' | 'mortgage' | 'business';

export interface Debt {
  id: string;
  kind: DebtKind;
  label: string;
  principal: number;
  rate: number; // annual interest premium over policy rate (mortgage) or absolute (others)
  termYears: number;
  assetId?: string;
}

export type Lifestyle = 'frugal' | 'normal' | 'comfortable' | 'luxury';

export interface FinanceState {
  cash: number;
  savingsAccount: number;
  funds: number; // index-fund holdings (market value)
  stocks: number; // single-stock holdings (higher variance)
  pensionSavings: number;
  debts: Debt[];
  transactions: Transaction[];
  history: YearSummary[];
  lifetimeEarnings: number;
  lifestyle: Lifestyle;
  bankruptcies: number;
  inheritanceReceived: number;
  /** Accrued public pension entitlement (sum of yearly accruals). */
  pensionEntitlement: number;
  /** Annual pension paid once retired. */
  pensionAnnual: number;
  /** Highest net worth reached (real terms), used for achievements. */
  peakNetWorth: number;
}

export type AssetKind =
  | 'apartment'
  | 'house'
  | 'cabin'
  | 'rental'
  | 'farm'
  | 'commercial'
  | 'car'
  | 'motorcycle'
  | 'boat'
  | 'luxury'
  | 'business';

export interface Asset {
  id: string;
  catalogId: string;
  kind: AssetKind;
  name: string;
  purchasePrice: number;
  purchaseYear: number;
  value: number;
  condition: number; // 0-100
  /** True when the player lives in this property. */
  residence: boolean;
  /** Annual net income (rent/business profit) from last year. */
  lastIncome: number;
  /** Business-only performance level. */
  businessLevel?: number;
  employees?: number;
  rented?: boolean;
}

export interface EducationEnrollment {
  programId: string;
  stageLevel: EduLevel;
  field: FieldId;
  yearsCompleted: number;
  yearsRequired: number;
  performance: number; // 0-100
  effort: 'low' | 'normal' | 'high';
  attendance: number; // 0-100
  loanTaken: number;
}

export interface Credential {
  programId: string;
  level: EduLevel;
  field: FieldId;
  grade: number; // 1-6 Norwegian scale (decimal)
  year: number;
}

export interface EducationState {
  current?: EnrollmentOrNull;
  credentials: Credential[];
  droppedOut: number;
  scholarships: number;
}
export type EnrollmentOrNull = EducationEnrollment | null;

export interface JobState {
  occupationId: string;
  level: number; // index into ladder
  salary: number; // annual at current price level
  performance: number; // 0-100
  yearsInRole: number;
  yearsAtCompany: number;
  effort: 'low' | 'normal' | 'high';
  company: string;
  bossId?: string;
  partTime: boolean;
}

export interface CareerState {
  job: JobState | null;
  experience: Record<string, number>; // years per occupation category
  totalYearsWorked: number;
  unemployedYears: number;
  unemploymentBenefitYears: number;
  lastSalary: number;
  retired: boolean;
  firedCount: number;
  promotions: number;
  peakTitle?: string;
  pastJobs: { occupationId: string; level: number; years: number; endYear: number }[];
  /** Year in which the last job application was made, to pace applications. */
  applicationsThisYear: number;
  militaryDone: boolean;
  offer: JobOffer | null;
}

export interface JobOffer {
  occupationId: string;
  salary: number;
  company: string;
  negotiated: boolean;
}

export interface HealthCondition {
  id: string;
  since: number;
  severity: number; // 0-100
  treated: boolean;
}

export interface HealthState {
  conditions: HealthCondition[];
  addictions: Record<string, number>; // addiction id -> severity 0-100
  survivedSerious: number;
  doctorVisitsThisYear: number;
}

export interface CrimeRecord {
  crime: string;
  year: number;
  sentence: string;
}

export interface CrimeState {
  records: CrimeRecord[];
  prisonYearsLeft: number;
  timesCaught: number;
  successfulCrimes: number;
  totalPrisonYears: number;
}

export interface LifeSummary {
  personId: string;
  generation: number;
  name: string;
  birthYear: number;
  deathYear: number;
  ageAtDeath: number;
  cause: string;
  netWorth: number;
  lifetimeEarnings: number;
  peakTitle?: string;
  highestEducation: EduLevel;
  children: number;
  grandchildren: number;
  marriages: number;
  avgHappiness: number;
  legacyScore: number;
  obituary: string;
  highlights: string[];
}

export interface DeathInfo {
  age: number;
  year: number;
  cause: string;
  summary: LifeSummary;
  estate: number;
}

export interface Milestone {
  kind: MilestoneKind;
  text: string;
}

export interface GameSettings {
  difficulty: Difficulty;
}

export interface GameState {
  version: number;
  saveId: string;
  seed: number;
  rngState: number;
  countryId: string;
  createdAt: number;
  updatedAt: number;
  settings: GameSettings;
  year: number;
  startYear: number;
  playerId: string;
  generation: number;
  background: FamilyBackground;
  people: Record<string, Person>;
  relationships: Record<string, Relationship>;
  timeline: TimelineEntry[];
  pendingEvents: PendingEvent[];
  scheduled: ScheduledItem[];
  eventHistory: Record<string, EventHistoryEntry>;
  economy: EconomyState;
  finances: FinanceState;
  assets: Asset[];
  education: EducationState;
  career: CareerState;
  health: HealthState;
  crime: CrimeState;
  /** Activity usage this year: id -> count. */
  activityUses: Record<string, number>;
  /** Last year an activity was used (cooldowns). */
  activityLastYear: Record<string, number>;
  flags: Record<string, number>;
  happinessLog: number[];
  livingWithParents: boolean;
  datingPreference: 'male' | 'female' | 'any';
  lineage: LifeSummary[];
  death: DeathInfo | null;
  milestones: Milestone[];
  /** Achievement ids unlocked during this save (persisted globally as well). */
  unlockedThisSave: string[];
  idCounter: number;
}
