import { describe, expect, it } from 'vitest';
import { ERAS, eraMortality, historicalPhase, medicalEfficacy } from '@/data/eras';
import { getOccupation } from '@/data/occupations';
import { getActivity } from '@/data/activities';
import { EVENTS } from '@/data/events';
import { qualification, jobListings } from '@/engine/careers/careers';
import { activityAvailability } from '@/engine/activities/activities';
import { validateState } from '@/engine/simulation/validate';
import { beginSim, endSim, relsOf } from '@/engine/simulation/helpers';
import { simulateLife } from '@/engine/simulation/headless';
import { NO_OLD_FEMALE_NAMES, NO_OLD_MALE_NAMES } from '@/data/names/norway';
import { newGame } from './helpers';

describe('historical eras', () => {
  it('every era creates a valid game at the right price level', () => {
    for (const era of ERAS) {
      const s = newGame(900 + era.startYear, { startYear: era.startYear });
      expect(s.year).toBe(era.startYear);
      expect(s.economy.priceIndex).toBeCloseTo(era.priceLevel);
      expect(s.economy.housingIndex).toBeCloseTo(era.housingLevel);
      expect(validateState(s)).toEqual([]);
    }
  });

  it('gives people born long ago traditional names', () => {
    let old = 0;
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const s = newGame(i, { startYear: 1920 });
      for (const r of relsOf(s, ['mother', 'father', 'grandparent'])) {
        const p = s.people[r.personId];
        total++;
        if ([...NO_OLD_MALE_NAMES, ...NO_OLD_FEMALE_NAMES].includes(p.firstName)) old++;
      }
    }
    expect(old / total).toBeGreaterThan(0.75);
  });

  it('occupations only exist once invented', () => {
    const dev = getOccupation('developer');
    const whaler = getOccupation('whaler');
    if (!dev || !whaler) throw new Error();
    const sim = beginSim(newGame(1, { startYear: 1920 }));
    sim.s.people[sim.s.playerId].birthYear = sim.s.year - 30;
    sim.s.education.credentials.push({ programId: 'ba_it', level: 'bachelor', field: 'it', grade: 5, year: 1919 });
    sim.s.people[sim.s.playerId].stats.intelligence = 90;
    expect(qualification(sim.s, dev).ok).toBe(false);
    expect(jobListings(sim.s).some((o) => o.id === 'developer')).toBe(false);
    sim.s.year = 2020;
    sim.s.people[sim.s.playerId].birthYear = 1990;
    expect(qualification(endSim(sim), whaler).missing).toContain('Yrket finnes ikke lenger');
  });

  it('modern activities are unavailable in the past', () => {
    const s = newGame(2, { startYear: 1950 });
    const sim = beginSim(s);
    sim.s.people[sim.s.playerId].birthYear = sim.s.year - 25;
    const app = getActivity('dating_app');
    if (!app) throw new Error();
    expect(activityAvailability(endSim(sim), app).ok).toBe(false);
  });

  it('historical curves are sensible', () => {
    expect(eraMortality(1900)).toBeGreaterThan(eraMortality(1990));
    expect(medicalEfficacy(1900)).toBeLessThan(medicalEfficacy(2010));
    expect(historicalPhase(1931)).toBe('recession');
    expect(historicalPhase(2008)).toBe('recession');
    expect(historicalPhase(1997)).toBeUndefined();
  });

  it('has a substantial set of historical events', () => {
    const hist = EVENTS.filter((e) => e.conditions?.some((c) => c.t === 'year' && c.max !== undefined && c.max < 2026));
    expect(hist.length).toBeGreaterThanOrEqual(25);
  });

  it('a life starting in 1920 lives through the occupation', () => {
    let found = false;
    for (let i = 0; i < 5 && !found; i++) {
      const r = simulateLife(4200 + i, { recklessness: 0.2, startYear: 1920 });
      expect(r.problems).toEqual([]);
      if (r.state.death && r.state.death.year > 1941) found = !!r.state.eventHistory.hist_invasion;
    }
    expect(found).toBe(true);
  }, 60_000);

  it('simulates complete lives in every era without invalid states', () => {
    for (const era of ERAS) {
      for (let i = 0; i < 3; i++) {
        const r = simulateLife(7000 + era.startYear + i, { recklessness: 0.3, startYear: era.startYear }, 1);
        expect(r.problems, `${era.startYear} seed ${r.seed}`).toEqual([]);
      }
    }
  }, 180_000);
});
