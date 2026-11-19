import type { GameState, Lifestyle, YearSummary } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { getCity } from '@/data/countries';
import { getProgram } from '@/data/education';
import { getAddictionDef } from '@/data/health';
import { addTx, changeStat, log, newId, partnerRel, player, playerAge, relsOf, type Sim } from '../simulation/helpers';
import { assetCashflows, netWorth, totalDebt, updateAssetValues } from '../assets/assets';
import { calculateTax, annuityPayment } from './tax';

export function livingCost(s: GameState, lifestyle: Lifestyle = s.finances.lifestyle): number {
  const base = BALANCE.living.lifestyle[lifestyle] * s.economy.priceIndex;
  const partner = partnerRel(s);
  const shared = partner && partner.kind === 'spouse' ? 1 - BALANCE.living.partnerCostShare * 0.5 : 1;
  const kids = relsOf(s, 'child').filter((r) => s.year - s.people[r.personId].birthYear < 18).length;
  return Math.round(base * shared + kids * BALANCE.living.childCost * s.economy.priceIndex);
}

export function annualRent(s: GameState): number {
  const city = getCity(s.countryId, player(s).city);
  const partner = partnerRel(s);
  const share = partner && partner.kind === 'spouse' ? 0.6 : 1;
  return Math.round(BALANCE.living.rentByCitySize[city.size] * s.economy.priceIndex * share);
}

/** Sum of income and expense lines collected during the yearly pipeline. */
interface Ledger {
  wage: number;
  capital: number;
  taxFree: number;
  expenses: number;
  debtPayments: number;
  investmentReturn: number;
}

/**
 * Processes one year of personal finances: income, taxes, expenses, debt service and
 * investment returns. Called exactly once per simulated year by the pipeline.
 */
export function processFinances(sim: Sim): YearSummary {
  const { s, rng } = sim;
  const p = player(s);
  const age = playerAge(s);
  const f = s.finances;
  const startNet = netWorth(s);
  const L: Ledger = { wage: 0, capital: 0, taxFree: 0, expenses: 0, debtPayments: 0, investmentReturn: 0 };
  const inPrison = s.crime.prisonYearsLeft > 0;

  // ── Income ───────────────────────────────────────────────
  const job = s.career.job;
  if (job && !inPrison) {
    addTx(s, job.salary, 'salary', `Lønn: ${job.company}`);
    L.wage += job.salary;
    f.lifetimeEarnings += job.salary;
    f.pensionEntitlement += Math.min(job.salary, 900_000 * s.economy.priceIndex) * BALANCE.benefits.pensionAccrualRatio;
    // Mandatory occupational pension saving (OTP) of 2 %.
    f.pensionSavings += job.salary * 0.02;
  }
  const enr = s.education.current;
  if (enr && !inPrison) {
    const prog = getProgram(enr.programId);
    if (prog?.paid && enr.yearsCompleted >= prog.paid.fromYear) {
      const pay = Math.round(prog.paid.salary * s.economy.priceIndex);
      addTx(s, pay, 'salary', prog.kind === 'doctoral' ? 'Stipendiatlønn' : 'Lærlinglønn');
      L.wage += pay;
      f.lifetimeEarnings += pay;
      f.pensionEntitlement += pay * BALANCE.benefits.pensionAccrualRatio;
    }
    if (prog && (prog.kind === 'higher') && age >= 18) {
      const loan = Math.round(BALANCE.education.loanPerYear * s.economy.priceIndex);
      addTx(s, loan, 'education', 'Studielån fra Lånekassen');
      enr.loanTaken += loan;
      const existing = f.debts.find((d) => d.kind === 'student');
      if (existing) existing.principal += loan;
      else
        f.debts.push({ id: newId(s, 'd'), kind: 'student', label: 'Studielån', principal: loan, rate: BALANCE.economy.studentLoanRate, termYears: 20 });
    }
  }
  if (!job && !inPrison && age >= 18 && !s.career.retired && !enr) {
    if (s.career.lastSalary > 0 && s.career.unemploymentBenefitYears < BALANCE.benefits.unemploymentYears) {
      const benefit = Math.round(s.career.lastSalary * BALANCE.benefits.unemploymentRatio);
      addTx(s, benefit, 'benefit', 'Dagpenger fra NAV');
      L.wage += benefit;
      s.career.unemploymentBenefitYears += 1;
    } else if (!s.livingWithParents && f.cash + f.savingsAccount < 60_000 * s.economy.priceIndex) {
      const aid = Math.round(BALANCE.benefits.socialAssistance * s.economy.priceIndex);
      addTx(s, aid, 'benefit', 'Økonomisk sosialhjelp');
      L.taxFree += aid;
    }
  }
  if (s.career.retired && !inPrison) {
    const pension = f.pensionAnnual;
    addTx(s, pension, 'pension', 'Alderspensjon');
    L.wage += pension;
  }
  const kidsUnder18 = relsOf(s, 'child').filter((r) => s.year - s.people[r.personId].birthYear < 18).length;
  if (kidsUnder18 > 0) {
    const cb = Math.round(kidsUnder18 * BALANCE.benefits.childBenefitPerChild * s.economy.priceIndex);
    addTx(s, cb, 'benefit', 'Barnetrygd');
    L.taxFree += cb;
  }
  // Pocket money while living at home as a child/teen.
  if (s.livingWithParents && age >= 6 && age < 18) {
    const parentsWealth = relsOf(s, ['mother', 'father']).reduce((a, r) => a + s.people[r.personId].wealth, 0);
    const base = s.background === 'wealthy' ? 9_000 : s.background === 'difficult' ? 0 : 3_000;
    const pocket = Math.round((base + Math.min(6_000, parentsWealth / 2_000)) * (age / 12) * s.economy.priceIndex);
    if (pocket > 0) {
      addTx(s, pocket, 'gift', 'Lommepenger');
      L.taxFree += pocket;
    }
  }

  // ── Assets & businesses ──────────────────────────────────
  updateAssetValues(sim);
  for (const line of assetCashflows(sim)) {
    addTx(s, line.amount, line.category, line.label);
    if (line.amount > 0) L.capital += line.amount;
    else L.expenses += -line.amount;
  }

  // ── Living costs ─────────────────────────────────────────
  if (!inPrison && age >= 18) {
    // Living at home: you chip in from your own income; parents cover the rest.
    const ownIncome = L.wage + L.taxFree;
    const cost = s.livingWithParents ? Math.round(Math.min(livingCost(s) * 0.3, ownIncome * 0.25)) : livingCost(s);
    addTx(s, -cost, 'living', 'Levekostnader');
    L.expenses += cost;
    if (!s.livingWithParents && !s.assets.some((a) => a.residence)) {
      const rent = annualRent(s);
      addTx(s, -rent, 'rent', 'Husleie');
      L.expenses += rent;
    }
    changeStat(p, 'happiness', BALANCE.living.lifestyleHappiness[f.lifestyle] * 0.5);
  }
  for (const [id, sev] of Object.entries(s.health.addictions)) {
    const def = getAddictionDef(id);
    if (!def || sev <= 0) continue;
    const cost = Math.round(def.yearlyCost * (sev / 100) * s.economy.priceIndex);
    addTx(s, -cost, 'health', `Avhengighet: ${def.name}`);
    L.expenses += cost;
  }

  // ── Taxes (on income of the year) ────────────────────────
  const wealthForTax = Math.max(0, startNet);
  const tax = calculateTax(L.wage, L.capital, wealthForTax, s.economy.priceIndex);
  if (tax.total > 0) addTx(s, -tax.total, 'tax', 'Skatt');

  // ── Debt service ─────────────────────────────────────────
  for (const d of f.debts) {
    if (d.principal <= 0) continue;
    if (d.kind === 'student' && enr) continue; // no repayment while studying
    const rate = d.kind === 'mortgage' ? s.economy.interestRate + d.rate : d.rate;
    const payment = Math.min(d.principal * (1 + rate), annuityPayment(d.principal, rate, Math.max(1, d.termYears)));
    const interest = d.principal * rate;
    d.principal = Math.max(0, d.principal + interest - payment);
    d.termYears = Math.max(1, d.termYears - 1);
    addTx(s, -payment, d.kind === 'mortgage' ? 'mortgage' : 'debt', `Nedbetaling: ${d.label}`);
    L.debtPayments += payment;
  }
  f.debts = f.debts.filter((d) => d.principal > 1);

  // ── Investments ──────────────────────────────────────────
  const real = netWorth(s) / s.economy.priceIndex;
  const capFactor = real > BALANCE.wealth.softCap ? BALANCE.wealth.softCap / real : 1;
  const savingsRate = Math.max(0, s.economy.interestRate + BALANCE.economy.savingsRateSpread);
  const r1 = f.savingsAccount * savingsRate;
  const r2 = f.funds * s.economy.lastStockReturn * (s.economy.lastStockReturn > 0 ? capFactor : 1);
  const stockRet = s.economy.lastStockReturn * 1.5 + rng.normal(0, 0.18);
  const r3 = f.stocks * Math.max(-0.8, stockRet) * (stockRet > 0 ? capFactor : 1);
  const r4 = f.pensionSavings * (s.economy.lastStockReturn * 0.6 + 0.01);
  f.savingsAccount += r1;
  f.funds = Math.max(0, f.funds + r2);
  f.stocks = Math.max(0, f.stocks + r3);
  f.pensionSavings = Math.max(0, f.pensionSavings + r4);
  L.investmentReturn = r1 + r2 + r3 + r4;

  // ── Liquidity: cover a negative balance ──────────────────
  coverShortfall(sim);

  const nw = netWorth(s);
  f.peakNetWorth = Math.max(f.peakNetWorth, nw / s.economy.priceIndex);
  const summary: YearSummary = {
    year: s.year,
    age,
    income: Math.round(L.wage + L.capital + L.taxFree),
    taxes: tax.total,
    expenses: Math.round(L.expenses),
    debtPayments: Math.round(L.debtPayments),
    investmentReturn: Math.round(L.investmentReturn),
    netChange: Math.round(nw - startNet),
    netWorth: Math.round(nw),
    happiness: p.stats.happiness,
  };
  f.history.push(summary);
  if (f.history.length > 130) f.history.shift();
  return summary;
}

/** Sells liquid holdings, then borrows, when cash goes negative. Triggers bankruptcy if hopeless. */
export function coverShortfall(sim: Sim): void {
  const { s } = sim;
  const f = s.finances;
  if (f.cash >= 0) return;
  const pull = (key: 'savingsAccount' | 'funds' | 'stocks') => {
    if (f.cash >= 0) return;
    const take = Math.min(f[key], -f.cash);
    f[key] -= take;
    f.cash += take;
  };
  pull('savingsAccount');
  pull('funds');
  pull('stocks');
  if (f.cash >= 0) return;
  const need = -f.cash;
  f.cash = 0;
  const existing = f.debts.find((d) => d.kind === 'consumer');
  if (existing) {
    existing.principal += need;
    existing.termYears = 5;
  } else {
    f.debts.push({ id: newId(s, 'd'), kind: 'consumer', label: 'Forbrukslån', principal: need, rate: BALANCE.economy.consumerDebtRate, termYears: 5 });
  }
  const consumer = f.debts.filter((d) => d.kind === 'consumer').reduce((a, d) => a + d.principal, 0);
  const income = Math.max(150_000 * s.economy.priceIndex, s.career.job?.salary ?? 0);
  if (consumer > income * 2.5 && playerAge(s) >= 18) declareBankruptcy(sim);
}

/** Debt settlement ("gjeldsordning"): consumer debt is written down, luxury assets are sold. */
export function declareBankruptcy(sim: Sim): void {
  const { s } = sim;
  const f = s.finances;
  for (const a of [...s.assets]) {
    if (a.kind === 'luxury' || a.kind === 'boat' || (a.kind === 'car' && a.value > 300_000 * s.economy.priceIndex)) {
      f.cash += a.value * 0.8;
      s.assets = s.assets.filter((x) => x.id !== a.id);
    }
  }
  for (const d of f.debts) {
    if (d.kind === 'consumer' || d.kind === 'business') {
      const pay = Math.min(f.cash, d.principal);
      f.cash -= pay;
      d.principal = Math.round((d.principal - pay) * 0.15);
      d.termYears = 5;
    }
  }
  f.debts = f.debts.filter((d) => d.principal > 1);
  f.bankruptcies += 1;
  s.flags.bankrupt = s.year;
  const p = player(s);
  changeStat(p, 'reputation', -12);
  changeStat(p, 'happiness', -15);
  changeStat(p, 'stress', 15);
  log(s, 'Gjelden ble uhåndterlig. Du har gått inn i gjeldsordning – mesteparten av forbruksgjelden er slettet, men alt av luksus er solgt.', 'negative', 'Gjeldsordning', 'alert-triangle');
}

export function debtTotal(s: GameState): number {
  return totalDebt(s);
}
