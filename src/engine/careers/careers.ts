import type { GameState, JobState } from '@/types/game';
import { EDU_RANK } from '@/types/core';
import { OCCUPATIONS, getOccupation, occupationTitle, type OccupationDef } from '@/data/occupations';
import { NO_COMPANIES } from '@/data/names/norway';
import { BALANCE } from '@/data/balance';
import { getCity } from '@/data/countries';
import { clamp } from '@/utils/math';
import { createRng } from '../probability/rng';
import { addRelationship, changeStat, log, player, playerAge, relsOf, type Sim } from '../simulation/helpers';
import { createPerson } from '../npcs/factory';
import { hasCredential, highestEducation } from '../education/education';

export interface Qualification {
  ok: boolean;
  missing: string[];
}

export function qualification(s: GameState, occ: OccupationDef): Qualification {
  const missing: string[] = [];
  const p = player(s);
  const age = playerAge(s);
  if (age < occ.minAge) missing.push(`Minst ${occ.minAge} år`);
  if (occ.maxAge !== undefined && age > occ.maxAge) missing.push(`Maks ${occ.maxAge} år`);
  if (EDU_RANK[occ.education] > 0) {
    const cred = hasCredential(s, occ.education, occ.fields);
    if (!cred) missing.push(occ.fields ? `Relevant utdanning (${eduLabel(occ.education)})` : `Utdanning: ${eduLabel(occ.education)}`);
  }
  if (occ.experience) {
    const exp = s.career.experience[occ.category] ?? 0;
    if (exp < occ.experience) missing.push(`${occ.experience} års erfaring innen feltet`);
  }
  for (const r of occ.requirements ?? []) {
    if (p.stats[r.stat] < r.min) missing.push(`${statLabel(r.stat)} minst ${r.min}`);
  }
  if (occ.cleanRecord && s.crime.records.some((c) => s.year - c.year < 15)) missing.push('Plettfri vandel');
  if (occ.partTime && s.education.current === null && age >= 20) missing.push('Kun for elever/studenter');
  if (!occ.partTime && s.education.current && age < 18) missing.push('Du går fortsatt på skolen');
  return { ok: missing.length === 0, missing };
}

function eduLabel(level: string): string {
  const m: Record<string, string> = {
    upperSecondary: 'videregående',
    vocational: 'fagbrev',
    bachelor: 'bachelor',
    master: 'master',
    phd: 'doktorgrad',
    lowerSecondary: 'grunnskole',
    primary: 'barneskole',
  };
  return m[level] ?? level;
}

function statLabel(k: string): string {
  const m: Record<string, string> = {
    intelligence: 'Intelligens',
    appearance: 'Utseende',
    fitness: 'Form',
    health: 'Helse',
    reputation: 'Omdømme',
    discipline: 'Disiplin',
  };
  return m[k] ?? k;
}

/**
 * This year's job listings. Derived from a per-year seed (not the main RNG) so that
 * re-opening the screen never rerolls listings and browsing has no side effects.
 */
export function jobListings(s: GameState): OccupationDef[] {
  const rng = createRng((s.seed ^ (s.year * 2654435761) ^ (s.generation * 97)) >>> 0);
  const age = playerAge(s);
  return OCCUPATIONS.filter((o) => {
    if (age < Math.max(13, o.minAge - 3)) return false;
    if (o.maxAge !== undefined && age > o.maxAge + 2) return false;
    if (o.partTime && age >= 26) return false;
    const rarity = o.rarity ?? 1;
    return rng.chance(Math.min(1, rarity + 0.1));
  });
}

export function hireChance(s: GameState, occ: OccupationDef): number {
  const p = player(s);
  const q = qualification(s, occ);
  if (!q.ok) return 0;
  let c = 0.55;
  c += (p.stats.intelligence - 50) * 0.003;
  c += (p.stats.appearance - 50) * 0.002;
  c += (p.stats.reputation - 50) * 0.004;
  c += (p.stats.discipline - 50) * 0.002;
  const cred = occ.education !== 'none' ? hasCredential(s, occ.education, occ.fields) : undefined;
  if (cred) c += (cred.grade - 4) * 0.06;
  c -= s.economy.unemploymentRate * 2;
  if (s.crime.records.length > 0) c -= 0.2;
  if ((occ.rarity ?? 1) < 0.5) c -= 0.15;
  if (s.career.unemployedYears > 2) c -= 0.08;
  if (s.flags.network) c += 0.08;
  return clamp(c, 0.05, 0.92);
}

export function offerSalary(s: GameState, occ: OccupationDef, rngValue: number): number {
  const city = getCity(s.countryId, player(s).city);
  const [lo, hi] = occ.salary;
  const cred = occ.education !== 'none' ? hasCredential(s, occ.education, occ.fields) : undefined;
  const gradeAdj = cred ? (cred.grade - 4) * 0.02 : 0;
  const expAdj = Math.min(0.2, (s.career.experience[occ.category] ?? 0) * 0.015);
  const base = lo + (hi - lo) * rngValue;
  return Math.round((base * city.jobFactor * (1 + gradeAdj + expAdj) * s.economy.priceIndex) / 1000) * 1000;
}

export type ApplyResult = { status: 'offer'; salary: number } | { status: 'rejected'; reason: string } | { status: 'error'; reason: string };

export function applyForJob(sim: Sim, occupationId: string): ApplyResult {
  const { s, rng } = sim;
  const occ = getOccupation(occupationId);
  if (!occ) return { status: 'error', reason: 'Ukjent stilling' };
  if (s.crime.prisonYearsLeft > 0) return { status: 'error', reason: 'Du sitter i fengsel' };
  if (s.career.applicationsThisYear >= BALANCE.career.maxApplicationsPerYear)
    return { status: 'error', reason: 'Du har sendt nok søknader i år' };
  if (s.career.job?.occupationId === occupationId) return { status: 'error', reason: 'Du har allerede denne jobben' };
  const q = qualification(s, occ);
  if (!q.ok) return { status: 'error', reason: q.missing[0] };
  s.career.applicationsThisYear += 1;
  const company = rng.pick(NO_COMPANIES);
  if (!rng.chance(hireChance(s, occ))) {
    changeStat(player(s), 'happiness', -1);
    log(s, `Du søkte jobb som ${occ.title.toLowerCase()} hos ${company}, men fikk nei etter intervjuet.`, 'negative', 'Avslag', 'mail-x');
    return { status: 'rejected', reason: 'Du fikk avslag etter intervjuet.' };
  }
  const salary = offerSalary(s, occ, rng.next());
  s.career.offer = { occupationId, salary, company, negotiated: false };
  return { status: 'offer', salary };
}

export function negotiateOffer(sim: Sim): 'raised' | 'withdrawn' | 'unchanged' | 'none' {
  const { s, rng } = sim;
  const offer = s.career.offer;
  if (!offer || offer.negotiated) return 'none';
  offer.negotiated = true;
  const p = player(s);
  const success = 0.45 + (p.stats.reputation - 50) * 0.004 + (p.traits.includes('charismatic') ? 0.12 : 0);
  const r = rng.next();
  if (r < success) {
    offer.salary = Math.round((offer.salary * rng.range(1.04, 1.14)) / 1000) * 1000;
    return 'raised';
  }
  if (r > 0.9) {
    s.career.offer = null;
    log(s, `${offer.company} trakk tilbudet etter at du forhandlet for hardt.`, 'negative', 'Tilbud trukket', 'mail-x');
    return 'withdrawn';
  }
  return 'unchanged';
}

export function acceptOffer(sim: Sim): boolean {
  const { s, rng } = sim;
  const offer = s.career.offer;
  if (!offer) return false;
  const occ = getOccupation(offer.occupationId);
  if (!occ) return false;
  if (s.career.job) endJob(sim, 'resigned', true);
  const p = player(s);
  const bossGender = rng.chance(0.5) ? 'male' : 'female';
  const boss = createPerson(s, rng, { birthYear: s.year - rng.int(35, 58), city: p.city, gender: bossGender, education: occ.education, occupationId: occ.id });
  addRelationship(s, boss.id, 'boss', { strength: 40, trust: 45 });
  const job: JobState = {
    occupationId: occ.id,
    level: 0,
    salary: offer.salary,
    performance: 55,
    yearsInRole: 0,
    yearsAtCompany: 0,
    effort: 'normal',
    company: offer.company,
    bossId: boss.id,
    partTime: occ.partTime ?? false,
  };
  s.career.job = job;
  s.career.offer = null;
  s.career.unemploymentBenefitYears = 0;
  if (!job.partTime) {
    p.occupationStatus = 'employed';
    s.career.retired = false;
  }
  p.occupationId = occ.id;
  // One or two new coworkers.
  for (let i = 0; i < rng.int(1, 2); i++) {
    const cw = createPerson(s, rng, { birthYear: s.year - playerAge(s) - rng.int(-8, 12), city: p.city, occupationId: occ.id, education: occ.education });
    addRelationship(s, cw.id, 'coworker', { strength: rng.int(25, 50), trust: 40 });
  }
  updatePeak(s);
  if (!job.partTime) s.milestones.push({ kind: 'newJob', text: `Ny jobb som ${occ.title.toLowerCase()}.` });
  log(s, `Du fikk jobb som ${occ.title.toLowerCase()} hos ${offer.company} med ${Math.round(offer.salary / 1000)} 000 kr i årslønn.`, 'positive', 'Ny jobb!', 'briefcase');
  return true;
}

export function declineOffer(sim: Sim): void {
  sim.s.career.offer = null;
}

/** Ends the current job. Coworker and boss relationships fade. */
export function endJob(sim: Sim, reason: 'resigned' | 'fired' | 'laidOff' | 'retired', silent = false): void {
  const { s } = sim;
  const job = s.career.job;
  if (!job) return;
  s.career.pastJobs.push({ occupationId: job.occupationId, level: job.level, years: job.yearsAtCompany, endYear: s.year });
  if (!job.partTime) s.career.lastSalary = job.salary;
  s.career.unemploymentBenefitYears = reason === 'resigned' ? 1 : 0; // reduced benefits after resigning
  s.career.job = null;
  for (const r of relsOf(s, ['coworker', 'boss'])) {
    if (r.kind === 'boss') delete s.relationships[r.personId];
    else r.strength = Math.max(0, r.strength - 20);
  }
  const p = player(s);
  p.occupationStatus = reason === 'retired' ? 'retired' : s.education.current ? 'student' : 'unemployed';
  const title = occupationTitle(job.occupationId, job.level);
  if (silent) return;
  if (reason === 'fired') {
    s.career.firedCount += 1;
    changeStat(p, 'happiness', -10);
    changeStat(p, 'reputation', -5);
    log(s, `Du fikk sparken fra jobben som ${title.toLowerCase()} hos ${job.company}.`, 'negative', 'Oppsagt', 'briefcase');
  } else if (reason === 'laidOff') {
    changeStat(p, 'happiness', -7);
    log(s, `${job.company} nedbemannet, og stillingen din som ${title.toLowerCase()} forsvant.`, 'negative', 'Permittert', 'briefcase');
  } else if (reason === 'resigned') {
    log(s, `Du sa opp jobben som ${title.toLowerCase()} hos ${job.company}.`, 'neutral', 'Oppsigelse', 'door-open');
  }
}

export function setWorkEffort(sim: Sim, effort: 'low' | 'normal' | 'high'): void {
  if (sim.s.career.job) sim.s.career.job.effort = effort;
}

export function askForRaise(sim: Sim): 'raise' | 'no' | 'angry' | 'none' {
  const { s, rng } = sim;
  const job = s.career.job;
  if (!job) return 'none';
  if (s.flags.raiseAskedYear === s.year) return 'none';
  s.flags.raiseAskedYear = s.year;
  const chance = 0.15 + (job.performance - 50) * 0.012 + (player(s).stats.reputation - 50) * 0.004;
  const r = rng.next();
  if (r < chance) {
    const pct = rng.range(0.04, 0.1);
    job.salary = Math.round((job.salary * (1 + pct)) / 1000) * 1000;
    log(s, `Du ba om lønnsøkning og fikk ${Math.round(pct * 100)} % mer!`, 'positive', 'Lønnsøkning', 'trending-up');
    return 'raise';
  }
  if (r > 0.85) {
    job.performance = clamp(job.performance - 8);
    log(s, 'Sjefen reagerte dårlig på at du ba om mer lønn.', 'negative', 'Avslag', 'frown');
    return 'angry';
  }
  log(s, 'Du ba om lønnsøkning, men det var ikke rom for det i år.', 'neutral');
  return 'no';
}

export function retire(sim: Sim): boolean {
  const { s } = sim;
  const age = playerAge(s);
  if (age < BALANCE.benefits.earliestPensionAge || s.career.retired) return false;
  if (s.career.job) endJob(sim, 'retired', true);
  s.career.retired = true;
  const early = Math.max(0, BALANCE.benefits.pensionAge - age);
  const publicPension = Math.max(
    BALANCE.benefits.minimumPension * s.economy.priceIndex,
    (s.finances.pensionEntitlement / 17) * (1 - early * 0.06),
  );
  s.finances.pensionAnnual = Math.round(publicPension);
  player(s).occupationStatus = 'retired';
  s.milestones.push({ kind: 'retirement', text: 'Du gikk av med pensjon.' });
  log(s, `Du gikk av med pensjon! Årlig pensjon: ${Math.round(publicPension / 1000)} 000 kr. Tid for hytteliv og barnebarn.`, 'milestone', 'Pensjonist', 'sunset');
  changeStat(player(s), 'stress', -20);
  changeStat(player(s), 'happiness', 6);
  return true;
}

/** Yearly career processing: performance, raises, promotions, firing and layoffs. */
export function processCareer(sim: Sim): void {
  const { s, rng } = sim;
  const p = player(s);
  const age = playerAge(s);
  s.career.applicationsThisYear = 0;
  // Pension savings payout while retired.
  if (s.career.retired && s.finances.pensionSavings > 0) {
    const yearsLeft = Math.max(5, 90 - age);
    const payout = s.finances.pensionSavings / yearsLeft;
    s.finances.pensionSavings -= payout;
    s.finances.cash += payout;
  }
  const job = s.career.job;
  if (!job) {
    if (age >= 18 && !s.education.current && !s.career.retired && s.crime.prisonYearsLeft === 0) {
      s.career.unemployedYears += 1;
      if (s.career.unemployedYears > 1) changeStat(p, 'happiness', -3);
    }
    if (age >= 75 && !s.career.retired) retire(sim);
    return;
  }
  const occ = getOccupation(job.occupationId);
  if (!occ) {
    s.career.job = null;
    return;
  }
  if (s.crime.prisonYearsLeft > 0) {
    endJob(sim, 'fired');
    return;
  }
  s.career.unemployedYears = 0;
  job.yearsInRole += 1;
  job.yearsAtCompany += 1;
  s.career.totalYearsWorked += job.partTime ? 0.3 : 1;
  s.career.experience[occ.category] = (s.career.experience[occ.category] ?? 0) + (job.partTime ? 0.3 : 1);

  const effortBonus = job.effort === 'high' ? 8 : job.effort === 'low' ? -10 : 0;
  const boss = job.bossId ? s.relationships[job.bossId] : undefined;
  const target =
    50 +
    (p.stats.intelligence - 50) * 0.25 +
    (p.stats.discipline - 50) * 0.35 +
    effortBonus * 2 -
    Math.max(0, p.stats.stress - 70) * 0.4 +
    (boss ? (boss.strength - 50) * 0.15 : 0) +
    (p.traits.includes('ambitious') ? 5 : 0) +
    (p.traits.includes('lazy') ? -6 : 0);
  job.performance = clamp(job.performance + (target - job.performance) * BALANCE.career.performanceDrift + rng.normal(0, 6));

  if (job.effort === 'high') changeStat(p, 'discipline', 1);

  // Annual wage growth follows inflation plus a performance component.
  const growth = s.economy.inflation + BALANCE.career.raisePerYear * (job.performance / 60);
  job.salary = Math.round(job.salary * (1 + growth));

  // Promotions
  const maxLevel = occ.ladder.length - 1;
  if (
    job.level < maxLevel &&
    job.performance >= BALANCE.career.promotionPerformance &&
    job.yearsInRole >= 2 + job.level &&
    rng.chance(0.35 + (job.performance - 72) * 0.015 - job.level * 0.07)
  ) {
    job.level += 1;
    job.yearsInRole = 0;
    job.salary = Math.round(job.salary * occ.ladderMult);
    s.career.promotions += 1;
    const title = occupationTitle(occ.id, job.level);
    changeStat(p, 'happiness', 6);
    changeStat(p, 'reputation', 4);
    if (job.level === maxLevel && maxLevel > 0) {
      s.milestones.push({ kind: 'careerPeak', text: `Du nådde toppen: ${title}.` });
      log(s, `Du ble utnevnt til ${title.toLowerCase()}! Toppen av karrierestigen.`, 'milestone', 'Karrieretopp', 'crown');
      if (occ.id === 'politician' && job.level === maxLevel) s.flags.primeMinister = 1;
    } else {
      log(s, `Du ble forfremmet til ${title.toLowerCase()}! Ny lønn: ${Math.round(job.salary / 1000)} 000 kr.`, 'positive', 'Forfremmet', 'trending-up');
    }
  }
  // Firing and layoffs
  if (job.performance < BALANCE.career.fireBelowPerformance && rng.chance(0.45)) {
    endJob(sim, 'fired');
  } else if (s.economy.phase === 'recession' && rng.chance(0.04)) {
    endJob(sim, 'laidOff');
  } else if (occ.maxAge !== undefined && age > occ.maxAge) {
    log(s, `Kroppen sa stopp – karrieren som ${occ.title.toLowerCase()} er over.`, 'neutral', 'Karriereslutt', 'flag');
    endJob(sim, 'resigned', true);
  }
  updatePeak(s);
  // Part-time jobs end automatically when you outgrow them.
  if (s.career.job?.partTime && occ.maxAge !== undefined && age > occ.maxAge) endJob(sim, 'resigned');
  p.educationLevel = highestEducation(s);
}

export function canRetire(s: GameState): boolean {
  return !s.career.retired && playerAge(s) >= BALANCE.benefits.earliestPensionAge;
}

/** Tracks the most prestigious position ever held (for the life summary). */
export function updatePeak(s: GameState): void {
  const job = s.career.job;
  if (!job || job.partTime) return;
  const occ = getOccupation(job.occupationId);
  if (!occ) return;
  const score = occ.prestige + job.level * 12;
  if (score > (s.flags.peakScore ?? 0)) {
    s.flags.peakScore = score;
    s.career.peakTitle = occupationTitle(occ.id, job.level);
  }
}
