import type { GameState } from '@/types/game';

/** Estimated recurring annual income (for loan approval and UI). */
export function annualIncomeEstimate(s: GameState): number {
  let income = 0;
  if (s.career.job) income += s.career.job.salary;
  if (s.career.retired) income += s.finances.pensionAnnual;
  for (const a of s.assets) income += Math.max(0, a.lastIncome);
  return income;
}
