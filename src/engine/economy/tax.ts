import { BALANCE } from '@/data/balance';

export interface TaxBreakdown {
  trygdeavgift: number;
  general: number;
  bracket: number;
  capital: number;
  wealth: number;
  total: number;
}

/**
 * Simplified Norwegian income tax. All thresholds are scaled with the price index
 * so tax brackets follow inflation (as they do in practice via yearly adjustments).
 */
export function calculateTax(wageIncome: number, capitalIncome: number, wealth: number, priceIndex: number): TaxBreakdown {
  const t = BALANCE.tax;
  const wage = Math.max(0, wageIncome);
  const trygdeavgift = wage > 69_650 * priceIndex ? wage * t.trygdeavgift : 0;
  const standardDeduction = Math.min(wage * t.minimumStandardDeduction, t.standardDeductionCap * priceIndex);
  const ordinary = Math.max(0, wage - standardDeduction + Math.max(0, capitalIncome) - t.personalAllowance * priceIndex);
  const general = ordinary * t.generalRate;
  let bracket = 0;
  for (let i = 0; i < t.brackets.length; i++) {
    const [threshold, rate] = t.brackets[i];
    const lower = threshold * priceIndex;
    const upper = i + 1 < t.brackets.length ? t.brackets[i + 1][0] * priceIndex : Infinity;
    if (wage > lower) bracket += (Math.min(wage, upper) - lower) * rate;
  }
  const capital = 0; // capital income is already inside the ordinary base above
  const wealthBase = Math.max(0, wealth - t.wealthTaxThreshold * priceIndex);
  const wealthTax = wealthBase * t.wealthTaxRate;
  const total = Math.round(trygdeavgift + general + bracket + capital + wealthTax);
  return { trygdeavgift, general, bracket, capital, wealth: wealthTax, total };
}

/** Annuity payment for a loan. */
export function annuityPayment(principal: number, rate: number, years: number): number {
  if (principal <= 0) return 0;
  if (years <= 1) return principal * (1 + rate);
  if (rate <= 0) return principal / years;
  return (principal * rate) / (1 - Math.pow(1 + rate, -years));
}
