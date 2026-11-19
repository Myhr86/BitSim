/**
 * Centralised game-balance configuration. Every tunable number that shapes the
 * simulation lives here so balancing does not require touching engine code.
 * See GAME_BALANCE.md for the rationale behind the values.
 */
export const BALANCE = {
  stats: {
    /** Yearly drift of happiness toward a lifestyle-dependent baseline. */
    happinessRegression: 0.12,
    /** Share of the gap to the age-based fitness baseline closed each year. */
    fitnessRegression: 0.2,
    appearanceDecayAfter: 40,
  },
  events: {
    /** Number of random events per year by life stage: [min, max]. */
    perYear: {
      baby: [1, 1],
      child: [1, 2],
      teen: [1, 3],
      youngAdult: [1, 3],
      adult: [1, 3],
      senior: [1, 2],
    } as Record<string, [number, number]>,
    maxChoiceEventsPerYear: 2,
    defaultCooldown: 4,
    defaultMaxOccurrences: 2,
    /** Weight multiplier applied to categories already picked this year. */
    sameCategoryPenalty: 0.35,
  },
  economy: {
    inflation: { boom: [0.025, 0.045], normal: [0.015, 0.03], recession: [0.0, 0.02] },
    stockReturn: { boom: [0.08, 0.22], normal: [0.0, 0.12], recession: [-0.3, 0.02] },
    housingReturn: { boom: [0.04, 0.1], normal: [0.0, 0.05], recession: [-0.08, 0.01] },
    unemployment: { boom: 0.025, normal: 0.04, recession: 0.07 },
    interest: { min: 0.005, max: 0.07 },
    /** Probability of switching phase each year, grows with phase age. */
    phaseSwitchBase: 0.12,
    savingsRateSpread: -0.01,
    consumerDebtRate: 0.19,
    studentLoanRate: 0.045,
    mortgagePremium: 0.015,
    businessLoanRate: 0.08,
  },
  tax: {
    trygdeavgift: 0.078,
    generalRate: 0.22,
    personalAllowance: 108_550,
    /** Progressive bracket tax ("trinnskatt"): [threshold, rate]. */
    brackets: [
      [217_400, 0.017],
      [306_050, 0.04],
      [697_150, 0.137],
      [942_400, 0.167],
      [1_410_750, 0.177],
    ] as [number, number][],
    capitalRate: 0.22,
    wealthTaxThreshold: 1_760_000,
    wealthTaxRate: 0.01,
    minimumStandardDeduction: 0.46,
    standardDeductionCap: 92_000,
  },
  living: {
    /** Annual living costs for a single adult, by lifestyle. */
    lifestyle: { frugal: 120_000, normal: 170_000, comfortable: 260_000, luxury: 520_000 },
    lifestyleHappiness: { frugal: -4, normal: 0, comfortable: 3, luxury: 6 },
    childCost: 60_000,
    rentByCitySize: { small: 108_000, medium: 132_000, large: 168_000, capital: 204_000 },
    partnerCostShare: 0.5,
  },
  benefits: {
    unemploymentRatio: 0.624,
    unemploymentYears: 2,
    socialAssistance: 90_000,
    childBenefitPerChild: 20_000,
    minimumPension: 230_000,
    pensionAccrualRatio: 0.181,
    pensionAge: 67,
    earliestPensionAge: 62,
  },
  education: {
    loanPerYear: 151_000,
    grantConversion: 0.4,
    scholarshipThreshold: 85,
  },
  career: {
    performanceDrift: 0.25,
    promotionPerformance: 72,
    fireBelowPerformance: 22,
    raisePerYear: 0.015,
    maxApplicationsPerYear: 4,
  },
  health: {
    agingStart: 35,
    /** Scales how fast the health target falls with age. */
    agingRate: 0.55,
    mortalityBase: 0.00003,
    mortalityGrowth: 0.098,
    difficultyMortality: { easy: 0.7, normal: 1, hard: 1.35 },
  },
  wealth: {
    /** Soft cap where investment returns start to diminish (real NOK). */
    softCap: 100_000_000,
    npcInheritanceShareToSpouse: 0.25,
  },
  activities: {
    diminishingFactor: 0.55,
  },
  crime: {
    baseDetection: 0.25,
  },
  property: {
    downPaymentRatio: 0.15,
    maxDebtToIncome: 5,
    mortgageYears: 25,
    transactionCost: 0.025,
  },
} as const;
