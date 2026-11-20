import type { Asset, GameState } from '@/types/game';
import { getAssetDef, getBusinessDef, type AssetDef } from '@/data/assets';
import { getCity } from '@/data/countries';
import { BALANCE } from '@/data/balance';
import { clamp } from '@/utils/math';
import { addTx, changeStat, log, newId, player, playerAge, type Sim } from '../simulation/helpers';
import { annualIncomeEstimate } from '../economy/income';

export interface CashLine {
  amount: number;
  category: 'asset' | 'business';
  label: string;
}

export function assetPrice(s: GameState, def: AssetDef): number {
  const p = player(s);
  const city = getCity(s.countryId, p.city);
  if (def.property) {
    const cityFactor = def.kind === 'cabin' || def.kind === 'farm' ? 1 : city.priceFactor;
    return Math.round(def.price * cityFactor * s.economy.housingIndex);
  }
  return Math.round(def.price * s.economy.priceIndex);
}

export function hasResidence(s: GameState): boolean {
  return s.assets.some((a) => a.residence);
}

export function totalDebt(s: GameState): number {
  return s.finances.debts.reduce((a, d) => a + d.principal, 0);
}

export function netWorth(s: GameState): number {
  const f = s.finances;
  const assets = s.assets.reduce((a, x) => a + x.value, 0);
  return f.cash + f.savingsAccount + f.funds + f.stocks + f.pensionSavings + assets - totalDebt(s);
}

/** Updates asset values and conditions for the year. */
export function updateAssetValues(sim: Sim): void {
  const { s, rng } = sim;
  for (const a of s.assets) {
    if (a.kind === 'business') continue;
    const def = getAssetDef(a.catalogId);
    if (!def) continue;
    a.condition = clamp(a.condition - rng.range(1.5, 4));
    if (def.property) {
      const condFactor = a.condition < 40 ? -0.02 : 0;
      a.value = Math.max(0, Math.round(a.value * (1 + s.economy.lastHousingReturn + rng.range(-0.02, 0.02) + condFactor)));
    } else {
      a.value = Math.max(0, Math.round(a.value * (1 + def.drift + rng.range(-0.02, 0.02))));
    }
  }
}

/** Yearly running costs and income of owned assets and businesses. */
export function assetCashflows(sim: Sim): CashLine[] {
  const { s, rng } = sim;
  const lines: CashLine[] = [];
  for (const a of [...s.assets]) {
    if (a.kind === 'business') {
      lines.push(...businessYear(sim, a));
      continue;
    }
    const def = getAssetDef(a.catalogId);
    if (!def) continue;
    const upkeep = a.value * (def.maintenance + def.insurance) + (def.property ? 12_000 * s.economy.priceIndex : 0);
    lines.push({ amount: -Math.round(upkeep), category: 'asset', label: `Drift: ${a.name}` });
    const isRental = def.kind === 'rental' || def.kind === 'commercial' || (a.rented && !a.residence);
    if (isRental && def.rentYield) {
      const vacancy = rng.chance(0.1) ? 0.5 : 1;
      const income = Math.round(a.value * def.rentYield * vacancy * (0.6 + a.condition / 250));
      a.lastIncome = income;
      lines.push({ amount: income, category: 'asset', label: `Leieinntekt: ${a.name}` });
    } else {
      a.lastIncome = 0;
    }
  }
  return lines;
}

function businessYear(sim: Sim, a: Asset): CashLine[] {
  const { s, rng } = sim;
  const def = getBusinessDef(a.catalogId);
  if (!def) return [];
  const p = player(s);
  const level = a.businessLevel ?? 1;
  const skill = (p.stats[def.stat] - 50) / 100;
  const econ = s.economy.phase === 'boom' ? 0.15 : s.economy.phase === 'recession' ? -0.25 : 0;
  const base = def.startCost * s.economy.priceIndex * def.baseMargin * level;
  const shock = rng.normal(0, def.volatility);
  const profit = Math.round(base * (1 + skill + econ + shock) - (level > 1 ? 0 : def.startCost * 0.05 * s.economy.priceIndex));
  a.lastIncome = profit;
  // Growth or decline of the business.
  if (profit > base * 1.2 && rng.chance(0.25 + skill * 0.3) && level < 6) {
    a.businessLevel = level + 1;
    a.employees = (a.employees ?? 0) + rng.int(1, 4) * level;
    log(s, `${a.name} vokser! Bedriften er nå på nivå ${level + 1}.`, 'positive', 'Bedriften vokser', 'briefcase');
    if (level + 1 >= 5) s.flags.bigBusiness = 1;
  } else if (profit < -base * 0.5 && level > 1 && rng.chance(0.35)) {
    a.businessLevel = level - 1;
    a.employees = Math.max(0, (a.employees ?? 0) - rng.int(1, 3) * level);
    log(s, `${a.name} sliter og må nedbemanne.`, 'negative', 'Tøffe tider', 'briefcase');
  }
  a.value = Math.max(0, Math.round(a.value * 0.6 + Math.max(0, profit) * 3 * 0.4));
  return [{ amount: profit, category: 'business', label: `Resultat: ${a.name}` }];
}

export interface PurchaseResult {
  ok: boolean;
  error?: string;
}

export function canAffordProperty(s: GameState, price: number): { ok: boolean; reason?: string; loan: number; down: number } {
  const equity = s.finances.cash + s.finances.savingsAccount;
  const down = Math.ceil(price * BALANCE.property.downPaymentRatio);
  const loan = Math.max(0, price - Math.min(equity, price) + price * BALANCE.property.transactionCost);
  if (equity < down) return { ok: false, reason: 'notEnoughEquity', loan, down };
  const income = annualIncomeEstimate(s);
  const existing = s.finances.debts.reduce((a, d) => a + d.principal, 0);
  if (loan > 0 && existing + loan > income * BALANCE.property.maxDebtToIncome) {
    return { ok: false, reason: 'debtToIncome', loan, down };
  }
  return { ok: true, loan, down };
}

/** Buy an asset from the catalogue. Property may be financed with a mortgage. */
export function buyAsset(sim: Sim, catalogId: string, mortgage: boolean): PurchaseResult {
  const { s } = sim;
  const def = getAssetDef(catalogId);
  if (!def) return { ok: false, error: 'unknown' };
  if (playerAge(s) < def.minAge) return { ok: false, error: 'tooYoung' };
  if (s.crime.prisonYearsLeft > 0) return { ok: false, error: 'inPrison' };
  const price = assetPrice(s, def);
  const fees = def.property ? Math.round(price * BALANCE.property.transactionCost) : 0;
  const assetId = newId(s, 'a');
  if (mortgage && def.property) {
    const check = canAffordProperty(s, price);
    if (!check.ok) return { ok: false, error: check.reason };
    // Use savings first, keep a small buffer.
    const equity = Math.min(price + fees, s.finances.cash + s.finances.savingsAccount);
    const fromSavings = Math.min(s.finances.savingsAccount, equity);
    s.finances.savingsAccount -= fromSavings;
    s.finances.cash += fromSavings;
    const loan = Math.max(0, price + fees - equity);
    addTx(s, -(price + fees), 'asset', `Kjøp: ${def.name}`);
    if (loan > 0) {
      s.finances.cash += loan;
      s.finances.debts.push({
        id: newId(s, 'd'),
        kind: 'mortgage',
        label: `Boliglån: ${def.name}`,
        principal: loan,
        rate: BALANCE.economy.mortgagePremium,
        termYears: BALANCE.property.mortgageYears,
        assetId,
      });
    }
  } else {
    if (s.finances.cash < price + fees) return { ok: false, error: 'notEnoughCash' };
    addTx(s, -(price + fees), 'asset', `Kjøp: ${def.name}`);
  }
  const isHome = def.property && (def.kind === 'apartment' || def.kind === 'house' || def.kind === 'farm') && !hasResidence(s);
  s.assets.push({
    id: assetId,
    catalogId,
    kind: def.kind,
    name: def.name,
    purchasePrice: price,
    purchaseYear: s.year,
    value: price,
    condition: def.property ? 80 : 100,
    residence: isHome,
    lastIncome: 0,
  });
  const p = player(s);
  changeStat(p, 'happiness', def.happiness);
  if (def.prestige) changeStat(p, 'reputation', def.prestige);
  if (isHome) {
    s.livingWithParents = false;
    if (!s.flags.firstHome) {
      s.flags.firstHome = s.year;
      s.milestones.push({ kind: 'firstHome', text: `Du kjøpte ditt første hjem: ${def.name}.` });
      log(s, `Du kjøpte ditt første hjem – ${def.name.toLowerCase()} – for ${Math.round(price / 1000)} 000 kr. Nøklene er dine!`, 'milestone', 'Første bolig', 'home');
      return { ok: true };
    }
  }
  log(s, `Du kjøpte ${def.name.toLowerCase()} for ${Math.round(price / 1000)} 000 kr.`, 'financial', 'Nytt kjøp', 'shopping-bag');
  if (s.assets.filter((a) => getAssetDef(a.catalogId)?.property).length >= 3) s.flags.propertyMogul = 1;
  return { ok: true };
}

export function sellAsset(sim: Sim, assetId: string): PurchaseResult {
  const { s } = sim;
  const idx = s.assets.findIndex((a) => a.id === assetId);
  if (idx < 0) return { ok: false, error: 'unknown' };
  const a = s.assets[idx];
  const def = getAssetDef(a.catalogId);
  const fees = def?.property ? Math.round(a.value * BALANCE.property.transactionCost) : 0;
  const proceeds = a.value - fees;
  addTx(s, proceeds, a.kind === 'business' ? 'business' : 'asset', `Salg: ${a.name}`);
  // Repay any linked debt.
  for (const d of s.finances.debts.filter((x) => x.assetId === a.id)) {
    addTx(s, -d.principal, 'debt', `Innfrielse: ${d.label}`);
    d.principal = 0;
  }
  s.finances.debts = s.finances.debts.filter((d) => d.principal > 0.5);
  s.assets.splice(idx, 1);
  const gain = proceeds - a.purchasePrice;
  log(
    s,
    `Du solgte ${a.name.toLowerCase()} for ${Math.round(proceeds / 1000)} 000 kr (${gain >= 0 ? 'gevinst' : 'tap'} på ${Math.abs(Math.round(gain / 1000))} 000 kr).`,
    'financial',
    'Salg',
    'tag',
  );
  if (a.residence) {
    changeStat(player(s), 'happiness', -3);
  }
  return { ok: true };
}

export function startBusiness(sim: Sim, businessId: string, useLoan: boolean): PurchaseResult {
  const { s } = sim;
  const def = getBusinessDef(businessId);
  if (!def) return { ok: false, error: 'unknown' };
  if (playerAge(s) < def.minAge) return { ok: false, error: 'tooYoung' };
  if (def.availableFrom && s.year < def.availableFrom) return { ok: false, error: 'unknown' };
  if (s.crime.prisonYearsLeft > 0) return { ok: false, error: 'inPrison' };
  if (s.assets.filter((a) => a.kind === 'business').length >= 3) return { ok: false, error: 'tooMany' };
  const cost = Math.round(def.startCost * s.economy.priceIndex);
  const ownShare = useLoan ? Math.round(cost * 0.3) : cost;
  if (s.finances.cash < ownShare) return { ok: false, error: 'notEnoughCash' };
  addTx(s, -cost, 'business', `Oppstart: ${def.name}`);
  if (useLoan) {
    s.finances.cash += cost - ownShare;
    s.finances.debts.push({
      id: newId(s, 'd'),
      kind: 'business',
      label: `Bedriftslån: ${def.name}`,
      principal: cost - ownShare,
      rate: BALANCE.economy.businessLoanRate,
      termYears: 10,
    });
  }
  s.assets.push({
    id: newId(s, 'a'),
    catalogId: def.id,
    kind: 'business',
    name: def.name,
    purchasePrice: cost,
    purchaseYear: s.year,
    value: Math.round(cost * 0.6),
    condition: 100,
    residence: false,
    lastIncome: 0,
    businessLevel: 1,
    employees: 1,
  });
  s.flags.businessesStarted = (s.flags.businessesStarted ?? 0) + 1;
  s.milestones.push({ kind: 'business', text: `Du startet ${def.name.toLowerCase()}.` });
  log(s, `Du tok sjansen og startet ${def.name.toLowerCase()}. Nå er du din egen sjef!`, 'milestone', 'Gründer', 'rocket');
  return { ok: true };
}

export function toggleRent(sim: Sim, assetId: string): PurchaseResult {
  const a = sim.s.assets.find((x) => x.id === assetId);
  if (!a || a.residence) return { ok: false, error: 'invalid' };
  a.rented = !a.rented;
  return { ok: true };
}

export function repairAsset(sim: Sim, assetId: string): PurchaseResult {
  const { s } = sim;
  const a = s.assets.find((x) => x.id === assetId);
  if (!a || a.kind === 'business') return { ok: false, error: 'invalid' };
  const cost = Math.round(a.value * (100 - a.condition) * 0.0015);
  if (s.finances.cash < cost) return { ok: false, error: 'notEnoughCash' };
  addTx(s, -cost, 'asset', `Oppussing: ${a.name}`);
  const gained = 100 - a.condition;
  a.condition = 100;
  a.value = Math.round(a.value * (1 + gained * 0.0012));
  log(s, `Du pusset opp ${a.name.toLowerCase()}.`, 'financial', 'Oppussing', 'hammer');
  return { ok: true };
}
