import { describe, expect, it } from 'vitest';
import { calculateTax, annuityPayment } from '@/engine/economy/tax';
import { processFinances, declareBankruptcy, coverShortfall } from '@/engine/economy/finance';
import { advanceEconomy, initialEconomy } from '@/engine/economy/market';
import { beginSim, endSim } from '@/engine/simulation/helpers';
import { createRng } from '@/engine/probability/rng';
import { buyAsset, netWorth, sellAsset } from '@/engine/assets/assets';
import { actions } from '@/engine/simulation/actions';
import { newGame } from './helpers';
import type { GameState } from '@/types/game';

function adult(seed = 30, age = 30): GameState {
  const s = newGame(seed);
  const sim = beginSim(s);
  sim.s.people[sim.s.playerId].birthYear = sim.s.year - age;
  sim.s.livingWithParents = false;
  return endSim(sim);
}

function withJob(s: GameState, salary: number): GameState {
  const sim = beginSim(s);
  sim.s.career.job = { occupationId: 'developer', level: 0, salary, performance: 60, yearsInRole: 0, yearsAtCompany: 0, effort: 'normal', company: 'Test AS', partTime: false };
  return endSim(sim);
}

describe('taxes', () => {
  it('is zero for tiny incomes and progressive for larger ones', () => {
    expect(calculateTax(50_000, 0, 0, 1).total).toBe(0);
    const t1 = calculateTax(500_000, 0, 0, 1).total / 500_000;
    const t2 = calculateTax(1_500_000, 0, 0, 1).total / 1_500_000;
    expect(t1).toBeGreaterThan(0.15);
    expect(t1).toBeLessThan(0.35);
    expect(t2).toBeGreaterThan(t1);
    expect(t2).toBeLessThan(0.5);
  });
  it('scales brackets with the price index', () => {
    const a = calculateTax(600_000, 0, 0, 1).total;
    const b = calculateTax(1_200_000, 0, 0, 2).total;
    expect(Math.abs(b / a - 2)).toBeLessThan(0.01);
  });
  it('applies wealth tax only above the threshold', () => {
    expect(calculateTax(0, 0, 1_000_000, 1).wealth).toBe(0);
    expect(calculateTax(0, 0, 5_000_000, 1).wealth).toBeGreaterThan(0);
  });
});

describe('loans', () => {
  it('annuity repays principal over the term', () => {
    let p = 1_000_000;
    const pay = annuityPayment(p, 0.05, 20);
    for (let y = 0; y < 20; y++) p = p * 1.05 - pay;
    expect(Math.abs(p)).toBeLessThan(1);
  });
});

describe('yearly finances', () => {
  it('pays salary, deducts tax and living costs', () => {
    const s = withJob(adult(), 600_000);
    const sim = beginSim(s);
    const cash0 = sim.s.finances.cash;
    const sum = processFinances(sim);
    expect(sum.income).toBeGreaterThanOrEqual(600_000);
    expect(sum.taxes).toBeGreaterThan(100_000);
    expect(sum.expenses).toBeGreaterThan(100_000);
    expect(sim.s.finances.cash).toBeGreaterThan(cash0);
    expect(sim.s.finances.lifetimeEarnings).toBe(600_000);
  });

  it('services debt and reduces the principal', () => {
    const s = withJob(adult(31), 700_000);
    const sim = beginSim(s);
    sim.s.finances.debts.push({ id: 'd1', kind: 'consumer', label: 'Lån', principal: 100_000, rate: 0.1, termYears: 5 });
    processFinances(sim);
    const d = sim.s.finances.debts.find((x) => x.id === 'd1');
    expect(d?.principal ?? 0).toBeLessThan(100_000);
  });

  it('turns a negative balance into consumer debt instead of negative cash', () => {
    const sim = beginSim(adult(32));
    sim.s.finances.cash = -50_000;
    coverShortfall(sim);
    expect(sim.s.finances.cash).toBe(0);
    expect(sim.s.finances.debts.some((d) => d.kind === 'consumer' && d.principal === 50_000)).toBe(true);
  });

  it('bankruptcy writes down consumer debt', () => {
    const sim = beginSim(adult(33));
    sim.s.finances.debts.push({ id: 'd', kind: 'consumer', label: 'Lån', principal: 2_000_000, rate: 0.19, termYears: 5 });
    declareBankruptcy(sim);
    expect(sim.s.finances.bankruptcies).toBe(1);
    expect(sim.s.finances.debts.reduce((a, d) => a + d.principal, 0)).toBeLessThan(400_000);
  });

  it('economy stays bounded over a century', () => {
    const rng = createRng(1);
    let e = initialEconomy();
    for (let i = 0; i < 100; i++) {
      e = advanceEconomy(rng, e);
      expect(e.interestRate).toBeGreaterThanOrEqual(0.005);
      expect(e.interestRate).toBeLessThanOrEqual(0.07);
      expect(e.inflation).toBeLessThan(0.06);
    }
    expect(e.priceIndex).toBeGreaterThan(2);
    expect(e.priceIndex).toBeLessThan(25);
  });
});

describe('property', () => {
  it('buys a home with a mortgage and sells it again', () => {
    let s = withJob(adult(34), 900_000);
    const sim0 = beginSim(s);
    sim0.s.finances.cash = 1_000_000;
    s = endSim(sim0);
    const sim = beginSim(s);
    const r = buyAsset(sim, 'apartment', true);
    expect(r.ok).toBe(true);
    expect(sim.s.assets[0].residence).toBe(true);
    expect(sim.s.finances.debts.some((d) => d.kind === 'mortgage')).toBe(true);
    const nwBefore = netWorth(sim.s);
    const ok = sellAsset(sim, sim.s.assets[0].id);
    expect(ok.ok).toBe(true);
    expect(sim.s.finances.debts.some((d) => d.kind === 'mortgage')).toBe(false);
    expect(netWorth(sim.s)).toBeLessThan(nwBefore); // transaction costs
  });

  it('refuses a mortgage without enough equity', () => {
    const s = withJob(adult(35), 400_000);
    const sim = beginSim(s);
    sim.s.finances.cash = 10_000;
    expect(buyAsset(sim, 'house', true).ok).toBe(false);
  });

  it('investment deposits move money between accounts', () => {
    const s = adult(36);
    const sim = beginSim(s);
    sim.s.finances.cash = 100_000;
    const r = actions.deposit(endSim(sim), 'funds', 40_000);
    expect(r.ok).toBe(true);
    expect(r.state.finances.funds).toBe(40_000);
    expect(r.state.finances.cash).toBe(60_000);
  });
});
