import type { PendingEvent } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { addTx, changeStat, log, newId, player, playerAge, type Sim } from '../simulation/helpers';
import { endJob } from '../careers/careers';

export const CRIME_NAMES: Record<string, string> = {
  shoplifting: 'naskeri',
  vandalism: 'hærverk',
  fraud: 'bedrageri',
  burglary: 'innbrudd',
  tax_fraud: 'skattesvik',
  smuggling: 'smugling',
  assault: 'legemsfornærmelse',
  dui: 'promillekjøring',
  embezzlement: 'underslag',
  robbery: 'ran',
  cyber: 'datainnbrudd',
};

/** Detection probability for a crime of a given severity (1–5). */
export function detectionChance(severity: number, intelligence: number, discipline: number, priorRecords: number): number {
  const base = BALANCE.crime.baseDetection + severity * 0.06 + priorRecords * 0.05;
  return Math.min(0.9, Math.max(0.08, base - (intelligence - 50) * 0.004 - (discipline - 50) * 0.002));
}

/**
 * The player has been caught: arrest and raise a trial decision that cannot be skipped.
 * The trial is a pending event so closing the app cannot avoid it.
 */
export function arrest(sim: Sim, crime: string, severity: number): void {
  const { s } = sim;
  const p = player(s);
  s.crime.timesCaught += 1;
  s.flags.pendingCrimeSeverity = severity;
  s.flags[`pendingCrime_${crime}`] = 1;
  s.flags.pendingCrimeId = Object.keys(CRIME_NAMES).indexOf(crime);
  changeStat(p, 'reputation', -6 - severity * 2);
  changeStat(p, 'stress', 10 + severity * 3);
  changeStat(p, 'happiness', -6);
  log(s, `Du ble tatt av politiet for ${CRIME_NAMES[crime] ?? crime}.`, 'negative', 'Arrestert', 'siren');
  const trial: PendingEvent = {
    instanceId: newId(s, 'ev'),
    eventId: 'justice_trial',
    title: 'Rettssak',
    text: `Du er tiltalt for ${CRIME_NAMES[crime] ?? crime}. Aktor krever ${sentenceText(baseSentence(severity, s.crime.records.length))}. Hvordan vil du møte retten?`,
    vars: { severity, cost: Math.round(severity * 60_000 * s.economy.priceIndex) },
    choiceIds: [0, 1, 2],
  };
  s.pendingEvents.push(trial);
}

/** Sentence in years (0 = fine only). */
export function baseSentence(severity: number, priors: number): number {
  if (severity <= 1 && priors === 0) return 0;
  if (severity <= 2) return priors >= 2 ? 1 : 0;
  return Math.max(1, Math.round(severity * 0.9 + priors * 0.6 - 1.4));
}

export function sentenceText(years: number): string {
  if (years <= 0) return 'en bot';
  return years === 1 ? '1 års fengsel' : `${years} års fengsel`;
}

export function resolveTrial(sim: Sim, mode: 'plead' | 'defend' | 'lawyer'): string {
  const { s, rng } = sim;
  const severity = s.flags.pendingCrimeSeverity ?? 1;
  const crimeIdx = s.flags.pendingCrimeId ?? 0;
  const crime = Object.keys(CRIME_NAMES)[crimeIdx] ?? 'shoplifting';
  for (const k of Object.keys(s.flags)) if (k.startsWith('pendingCrime')) delete s.flags[k];
  const priors = s.crime.records.length;
  let years = baseSentence(severity, priors);
  const p = player(s);
  let acquitted = false;
  if (mode === 'plead') {
    years = Math.max(0, Math.round(years * 0.66));
  } else if (mode === 'lawyer') {
    const cost = Math.round(severity * 60_000 * s.economy.priceIndex);
    addTx(s, -cost, 'fine', 'Advokatsalær');
    acquitted = rng.chance(0.45 + (p.stats.reputation - 50) * 0.004);
    if (!acquitted) years = Math.max(0, years - 1);
  } else {
    acquitted = rng.chance(0.18 + (p.stats.intelligence - 50) * 0.004);
    if (!acquitted) years += severity >= 3 ? 1 : 0;
  }
  if (acquitted) {
    changeStat(p, 'happiness', 8);
    changeStat(p, 'stress', -10);
    log(s, 'Retten frifant deg! Du gikk ut av rettssalen som en fri person.', 'positive', 'Frifunnet', 'scale');
    return 'Du ble frifunnet!';
  }
  const fine = Math.round((severity * 8_000 + rng.int(0, 10) * 1_000) * s.economy.priceIndex);
  if (years <= 0) {
    addTx(s, -fine, 'fine', 'Bot');
    s.crime.records.push({ crime, year: s.year, sentence: `Bot på ${fine.toLocaleString('nb-NO')} kr` });
    log(s, `Du ble dømt til å betale en bot på ${fine.toLocaleString('nb-NO')} kr.`, 'negative', 'Dømt', 'scale');
    return `Du fikk en bot på ${fine.toLocaleString('nb-NO')} kr.`;
  }
  s.crime.records.push({ crime, year: s.year, sentence: sentenceText(years) });
  imprison(sim, years);
  return `Du ble dømt til ${sentenceText(years)}.`;
}

export function imprison(sim: Sim, years: number): void {
  const { s } = sim;
  s.crime.prisonYearsLeft = years;
  s.crime.totalPrisonYears += years;
  const p = player(s);
  changeStat(p, 'happiness', -15);
  changeStat(p, 'reputation', -12);
  if (s.career.job) endJob(sim, 'fired', true);
  if (s.education.current && playerAge(s) >= 16) {
    s.education.current = null;
    s.education.droppedOut += 1;
  }
  log(s, `Du ble dømt til ${sentenceText(years)}. Dørene smalt igjen bak deg.`, 'negative', 'Fengslet', 'lock');
}

/** Yearly prison processing. */
export function processPrison(sim: Sim): void {
  const { s, rng } = sim;
  if (s.crime.prisonYearsLeft <= 0) return;
  const p = player(s);
  s.crime.prisonYearsLeft -= 1;
  changeStat(p, 'happiness', -4);
  changeStat(p, 'fitness', rng.range(-1, 3));
  if (s.crime.prisonYearsLeft > 0 && p.stats.discipline > 60 && rng.chance(0.2)) {
    s.crime.prisonYearsLeft = 0;
    log(s, 'Du ble prøveløslatt for god oppførsel.', 'positive', 'Prøveløslatt', 'door-open');
  }
  if (s.crime.prisonYearsLeft === 0) {
    s.flags.released = s.year;
    log(s, 'Du slapp ut av fengselet. Verden ser litt annerledes ut nå.', 'milestone', 'Løslatt', 'sunrise');
  }
}
