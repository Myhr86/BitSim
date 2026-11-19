import type { EconomyPhase, EconomyState } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { clamp } from '@/utils/math';
import type { Rng } from '../probability/rng';

export function initialEconomy(): EconomyState {
  return {
    phase: 'normal',
    yearsInPhase: 2,
    inflation: 0.025,
    priceIndex: 1,
    interestRate: 0.035,
    housingIndex: 1,
    stockIndex: 1,
    lastStockReturn: 0,
    lastHousingReturn: 0,
    unemploymentRate: BALANCE.economy.unemployment.normal,
  };
}

function nextPhase(rng: Rng, e: EconomyState): EconomyPhase {
  const p = BALANCE.economy.phaseSwitchBase + e.yearsInPhase * 0.04;
  if (!rng.chance(p)) return e.phase;
  switch (e.phase) {
    case 'boom':
      return rng.chance(0.65) ? 'normal' : 'recession';
    case 'recession':
      return rng.chance(0.8) ? 'normal' : 'boom';
    default:
      return rng.chance(0.55) ? 'boom' : 'recession';
  }
}

/** Advances the macro economy one year. Returns a new object; bounded so it never explodes. */
export function advanceEconomy(rng: Rng, prev: EconomyState): EconomyState {
  const e = { ...prev };
  const phase = nextPhase(rng, e);
  e.yearsInPhase = phase === e.phase ? e.yearsInPhase + 1 : 0;
  e.phase = phase;
  const [iMin, iMax] = BALANCE.economy.inflation[phase];
  e.inflation = rng.range(iMin, iMax);
  e.priceIndex = e.priceIndex * (1 + e.inflation);
  const target = e.inflation + 0.012 + (phase === 'boom' ? 0.01 : phase === 'recession' ? -0.012 : 0);
  e.interestRate = clamp(
    e.interestRate * 0.55 + target * 0.45 + rng.range(-0.004, 0.004),
    BALANCE.economy.interest.min,
    BALANCE.economy.interest.max,
  );
  const [sMin, sMax] = BALANCE.economy.stockReturn[phase];
  e.lastStockReturn = rng.range(sMin, sMax);
  e.stockIndex *= 1 + e.lastStockReturn;
  const [hMin, hMax] = BALANCE.economy.housingReturn[phase];
  // Housing loosely tracks inflation in the long run.
  e.lastHousingReturn = rng.range(hMin, hMax) + e.inflation * 0.4;
  e.housingIndex *= 1 + e.lastHousingReturn;
  e.unemploymentRate = BALANCE.economy.unemployment[phase] + rng.range(-0.005, 0.005);
  return e;
}
