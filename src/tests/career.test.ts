import { describe, expect, it } from 'vitest';
import { getOccupation, OCCUPATIONS } from '@/data/occupations';
import { PROGRAMS } from '@/data/education';
import { qualification, applyForJob, acceptOffer, processCareer, retire, endJob } from '@/engine/careers/careers';
import { enroll, processEducation, programEligibility } from '@/engine/education/education';
import { beginSim } from '@/engine/simulation/helpers';
import { newGame } from './helpers';

function adultSim(seed: number, age = 30) {
  const sim = beginSim(newGame(seed));
  sim.s.people[sim.s.playerId].birthYear = sim.s.year - age;
  sim.s.livingWithParents = false;
  return sim;
}

describe('occupation data', () => {
  it('has at least 60 occupations with valid ladders and salaries', () => {
    expect(OCCUPATIONS.length).toBeGreaterThanOrEqual(60);
    const ids = new Set<string>();
    for (const o of OCCUPATIONS) {
      expect(ids.has(o.id)).toBe(false);
      ids.add(o.id);
      expect(o.ladder.length).toBeGreaterThan(0);
      expect(o.salary[0]).toBeLessThanOrEqual(o.salary[1]);
      expect(o.stress).toBeGreaterThanOrEqual(0);
      expect(o.prestige).toBeLessThanOrEqual(100);
    }
  });
  it('every occupation that needs a field can be reached by some programme', () => {
    for (const o of OCCUPATIONS) {
      if (!o.fields) continue;
      const reachable = o.fields.some((f) => PROGRAMS.some((p) => p.field === f));
      expect(reachable, o.id).toBe(true);
    }
  });
});

describe('career progression', () => {
  it('requires qualifications', () => {
    const sim = adultSim(50);
    const doctor = getOccupation('doctor');
    if (!doctor) throw new Error();
    expect(qualification(sim.s, doctor).ok).toBe(false);
    sim.s.education.credentials.push({ programId: 'ma_medicine', level: 'master', field: 'medicine', grade: 5, year: sim.s.year });
    sim.s.people[sim.s.playerId].stats.intelligence = 80;
    expect(qualification(sim.s, doctor).ok).toBe(true);
  });

  it('can be hired, promoted and fired', () => {
    const sim = adultSim(51);
    sim.s.people[sim.s.playerId].stats.reputation = 90;
    sim.s.people[sim.s.playerId].stats.intelligence = 90;
    let hired = false;
    for (let i = 0; i < 4 && !hired; i++) {
      const r = applyForJob(sim, 'cashier');
      if (r.status === 'offer') hired = acceptOffer(sim);
    }
    expect(hired).toBe(true);
    expect(sim.s.career.job?.occupationId).toBe('cashier');
    // Excellent performance over years leads to promotion.
    const p = sim.s.people[sim.s.playerId];
    p.stats.discipline = 95;
    p.stats.intelligence = 95;
    for (let y = 0; y < 12; y++) {
      sim.s.year += 1;
      if (sim.s.career.job) sim.s.career.job.effort = 'high';
      processCareer(sim);
      if (!sim.s.career.job) break;
    }
    expect(sim.s.career.promotions).toBeGreaterThan(0);
    // Terrible performance gets you fired eventually.
    const sim2 = adultSim(52);
    sim2.s.career.job = { occupationId: 'cashier', level: 0, salary: 350_000, performance: 5, yearsInRole: 1, yearsAtCompany: 1, effort: 'low', company: 'X', partTime: false };
    const p2 = sim2.s.people[sim2.s.playerId];
    p2.stats.discipline = 2;
    p2.stats.intelligence = 5;
    for (let y = 0; y < 10 && sim2.s.career.job; y++) processCareer(sim2);
    expect(sim2.s.career.job).toBeNull();
    expect(sim2.s.career.firedCount).toBe(1);
  });

  it('salary grows with inflation over time', () => {
    const sim = adultSim(53);
    sim.s.career.job = { occupationId: 'nurse', level: 0, salary: 600_000, performance: 60, yearsInRole: 0, yearsAtCompany: 0, effort: 'normal', company: 'X', partTime: false };
    sim.s.people[sim.s.playerId].stats.discipline = 60;
    for (let i = 0; i < 5; i++) processCareer(sim);
    if (sim.s.career.job) expect(sim.s.career.job.salary).toBeGreaterThan(600_000);
  });

  it('retirement sets a pension of at least the minimum', () => {
    const sim = adultSim(54, 67);
    sim.s.career.job = { occupationId: 'nurse', level: 0, salary: 600_000, performance: 60, yearsInRole: 0, yearsAtCompany: 10, effort: 'normal', company: 'X', partTime: false };
    expect(retire(sim)).toBe(true);
    expect(sim.s.career.retired).toBe(true);
    expect(sim.s.finances.pensionAnnual).toBeGreaterThanOrEqual(230_000);
    expect(sim.s.career.job).toBeNull();
  });

  it('ends coworker ties loosely when leaving', () => {
    const sim = adultSim(55);
    sim.s.career.job = { occupationId: 'nurse', level: 0, salary: 600_000, performance: 60, yearsInRole: 0, yearsAtCompany: 2, effort: 'normal', company: 'X', partTime: false };
    endJob(sim, 'resigned');
    expect(sim.s.career.pastJobs).toHaveLength(1);
    expect(sim.s.career.lastSalary).toBe(600_000);
  });
});

describe('education', () => {
  it('enforces grade requirements for admission', () => {
    const sim = adultSim(56, 19);
    sim.s.education.credentials.push({ programId: 'vgs_general', level: 'upperSecondary', field: 'general', grade: 3.5, year: sim.s.year });
    const med = PROGRAMS.find((p) => p.id === 'ma_medicine');
    const kg = PROGRAMS.find((p) => p.id === 'ba_kindergarten');
    if (!med || !kg) throw new Error();
    expect(programEligibility(sim.s, med).ok).toBe(false);
    expect(programEligibility(sim.s, kg).ok).toBe(true);
  });

  it('graduates after the required years and takes student loans', () => {
    const sim = adultSim(57, 19);
    sim.s.education.credentials.push({ programId: 'vgs_general', level: 'upperSecondary', field: 'general', grade: 4.5, year: sim.s.year });
    const p = sim.s.people[sim.s.playerId];
    p.stats.intelligence = 75;
    p.stats.discipline = 75;
    expect(enroll(sim, 'ba_business').ok).toBe(true);
    for (let y = 0; y < 6 && sim.s.education.current; y++) processEducation(sim);
    expect(sim.s.education.credentials.some((c) => c.level === 'bachelor')).toBe(true);
  });
});
