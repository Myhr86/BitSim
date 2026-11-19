import type { CareerState, CrimeState, EducationState, FinanceState, HealthState } from '@/types/game';

export function initialFinances(): FinanceState {
  return {
    cash: 0,
    savingsAccount: 0,
    funds: 0,
    stocks: 0,
    pensionSavings: 0,
    debts: [],
    transactions: [],
    history: [],
    lifetimeEarnings: 0,
    lifestyle: 'normal',
    bankruptcies: 0,
    inheritanceReceived: 0,
    pensionEntitlement: 0,
    pensionAnnual: 0,
    peakNetWorth: 0,
  };
}

export function initialEducation(): EducationState {
  return { current: null, credentials: [], droppedOut: 0, scholarships: 0 };
}

export function initialCareer(): CareerState {
  return {
    job: null,
    experience: {},
    totalYearsWorked: 0,
    unemployedYears: 0,
    unemploymentBenefitYears: 0,
    lastSalary: 0,
    retired: false,
    firedCount: 0,
    promotions: 0,
    pastJobs: [],
    applicationsThisYear: 0,
    militaryDone: false,
    offer: null,
  };
}

export function initialHealth(): HealthState {
  return { conditions: [], addictions: {}, survivedSerious: 0, doctorVisitsThisYear: 0 };
}

export function initialCrime(): CrimeState {
  return { records: [], prisonYearsLeft: 0, timesCaught: 0, successfulCrimes: 0, totalPrisonYears: 0 };
}
