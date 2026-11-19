import type { EduLevel, FieldId } from '@/types/core';
import { EDU_RANK } from '@/types/core';
import type { Credential, GameState } from '@/types/game';
import { PROGRAMS, getProgram, gradeFromPerformance, type ProgramDef } from '@/data/education';
import { BALANCE } from '@/data/balance';
import { clamp } from '@/utils/math';
import { addTx, changeStat, log, player, playerAge, type Sim } from '../simulation/helpers';

export function highestCredential(s: GameState): Credential | undefined {
  return [...s.education.credentials].sort((a, b) => EDU_RANK[b.level] - EDU_RANK[a.level] || b.grade - a.grade)[0];
}

export function highestEducation(s: GameState): EduLevel {
  return highestCredential(s)?.level ?? 'none';
}

export function hasCredential(s: GameState, level: EduLevel, fields?: FieldId[]): Credential | undefined {
  return s.education.credentials
    .filter((c) => EDU_RANK[c.level] >= EDU_RANK[level] && (!fields || fields.includes(c.field)))
    .sort((a, b) => b.grade - a.grade)[0];
}

export interface Eligibility {
  ok: boolean;
  reasons: string[];
}

export function programEligibility(s: GameState, prog: ProgramDef): Eligibility {
  const reasons: string[] = [];
  const p = player(s);
  const age = playerAge(s);
  if (age < prog.minAge) reasons.push(`Minstealder ${prog.minAge} år`);
  if (prog.kind === 'compulsory') reasons.push('Grunnskolen skjer automatisk');
  if (prog.requires) {
    const c = hasCredential(s, prog.requires.level, prog.requires.fields);
    if (!c) reasons.push(`Krever fullført ${levelName(prog.requires.level)}`);
    else if (prog.requires.minGrade && c.grade < prog.requires.minGrade)
      reasons.push(`Krever snitt ${prog.requires.minGrade.toFixed(1).replace('.', ',')} (du har ${c.grade.toFixed(1).replace('.', ',')})`);
  }
  if (prog.minIntelligence && p.stats.intelligence < prog.minIntelligence) reasons.push('For lav intelligens');
  if (prog.field === 'police' && s.crime.records.length > 0) reasons.push('Krever plettfri vandel');
  if (s.education.credentials.some((c) => c.programId === prog.id)) reasons.push('Allerede fullført');
  if (s.crime.prisonYearsLeft > 0) reasons.push('Du sitter i fengsel');
  return { ok: reasons.length === 0, reasons };
}

export function availablePrograms(s: GameState): { program: ProgramDef; eligibility: Eligibility }[] {
  return PROGRAMS.filter((p) => p.kind !== 'compulsory').map((program) => ({ program, eligibility: programEligibility(s, program) }));
}

export function levelName(level: EduLevel): string {
  const names: Record<EduLevel, string> = {
    none: 'ingen utdanning',
    primary: 'barneskole',
    lowerSecondary: 'ungdomsskole',
    upperSecondary: 'videregående',
    vocational: 'fagbrev',
    bachelor: 'bachelorgrad',
    master: 'mastergrad',
    phd: 'doktorgrad',
  };
  return names[level];
}

export function enroll(sim: Sim, programId: string, force = false): { ok: boolean; error?: string } {
  const { s } = sim;
  const prog = getProgram(programId);
  if (!prog) return { ok: false, error: 'unknown' };
  if (!force) {
    const e = programEligibility(s, prog);
    if (!e.ok) return { ok: false, error: e.reasons[0] };
  }
  const p = player(s);
  // A PhD keeps the field of the master it builds on.
  let field: FieldId = prog.field;
  if (prog.kind === 'doctoral') field = hasCredential(s, 'master')?.field ?? prog.field;
  s.education.current = {
    programId,
    stageLevel: prog.level,
    field,
    yearsCompleted: 0,
    yearsRequired: prog.years,
    performance: clamp(40 + (p.stats.intelligence - 50) * 0.5 + (p.stats.discipline - 50) * 0.3),
    effort: 'normal',
    attendance: 90,
    loanTaken: 0,
  };
  p.occupationStatus = 'student';
  if (prog.kind !== 'compulsory') {
    log(s, `Du begynte på ${prog.name.toLowerCase()}.`, 'neutral', 'Ny skolestart', 'graduation-cap');
  }
  // Full-time studies are incompatible with a full-time job.
  if (s.career.job && !s.career.job.partTime && prog.kind !== 'doctoral') {
    log(s, `Du sa opp jobben for å studere.`, 'neutral');
    s.career.pastJobs.push({ occupationId: s.career.job.occupationId, level: s.career.job.level, years: s.career.job.yearsAtCompany, endYear: s.year });
    s.career.lastSalary = s.career.job.salary;
    s.career.job = null;
  }
  return { ok: true };
}

export function dropOut(sim: Sim): { ok: boolean; error?: string } {
  const { s } = sim;
  const enr = s.education.current;
  if (!enr) return { ok: false, error: 'notEnrolled' };
  const prog = getProgram(enr.programId);
  if (!prog || prog.kind === 'compulsory') return { ok: false, error: 'compulsory' };
  if (playerAge(s) < 16) return { ok: false, error: 'tooYoung' };
  s.education.current = null;
  s.education.droppedOut += 1;
  const p = player(s);
  p.occupationStatus = s.career.job ? 'employed' : 'unemployed';
  changeStat(p, 'stress', -8);
  changeStat(p, 'reputation', -3);
  log(s, `Du sluttet på ${prog.name.toLowerCase()}.`, 'negative', 'Studiebrudd', 'door-open');
  return { ok: true };
}

export function setEffort(sim: Sim, effort: 'low' | 'normal' | 'high'): void {
  if (sim.s.education.current) sim.s.education.current.effort = effort;
}

/** Yearly education progress. Compulsory school is automatic; higher education can be failed. */
export function processEducation(sim: Sim): void {
  const { s, rng } = sim;
  const p = player(s);
  const age = playerAge(s);
  if (s.crime.prisonYearsLeft > 0) return;

  // Automatic enrolment in compulsory schooling.
  if (!s.education.current) {
    if (age === 6 && !hasCredential(s, 'primary')) {
      enroll(sim, 'primary', true);
      log(s, 'Første skoledag! Sekken var nesten like stor som deg.', 'milestone', 'Skolestart', 'backpack');
      return;
    }
    if (age >= 13 && age <= 16 && hasCredential(s, 'primary') && !hasCredential(s, 'lowerSecondary')) {
      enroll(sim, 'lower_secondary', true);
      log(s, 'Du begynte på ungdomsskolen.', 'neutral', 'Ungdomsskolen', 'school');
      return;
    }
    return;
  }

  const enr = s.education.current;
  const prog = getProgram(enr.programId);
  if (!prog) {
    s.education.current = null;
    return;
  }
  const effortBonus = enr.effort === 'high' ? 7 : enr.effort === 'low' ? -8 : 0;
  const delta =
    (p.stats.intelligence - 50) * 0.12 +
    (p.stats.discipline - 50) * 0.1 +
    effortBonus -
    Math.max(0, p.stats.stress - 60) * 0.15 +
    rng.normal(0, 5) +
    (s.health.conditions.some((c) => c.severity > 50) ? -6 : 0);
  enr.performance = clamp(enr.performance * 0.7 + (50 + delta * 2.2) * 0.3 + delta * 0.2);
  enr.attendance = clamp(enr.attendance + (enr.effort === 'low' ? -6 : enr.effort === 'high' ? 3 : 0) + rng.range(-3, 3));
  changeStat(p, 'intelligence', prog.kind === 'compulsory' ? rng.range(0.8, 2.2) : rng.range(0.5, 2) + (enr.effort === 'high' ? 1 : 0));
  if (enr.effort === 'high') changeStat(p, 'discipline', 1.5);
  else if (enr.effort === 'low') changeStat(p, 'discipline', -1);

  const passed = prog.kind === 'compulsory' || enr.performance >= 28;
  if (!passed) {
    changeStat(p, 'happiness', -5);
    log(s, `Du strøk på flere eksamener og må ta året på nytt.`, 'negative', 'Stryk', 'x-circle');
    s.flags.failedYears = (s.flags.failedYears ?? 0) + 1;
    return;
  }
  enr.yearsCompleted += 1;
  if (prog.kind === 'higher' && enr.loanTaken > 0) {
    // Part of the loan for a passed year converts to a grant.
    const loanThisYear = Math.round(BALANCE.education.loanPerYear * s.economy.priceIndex);
    const student = s.finances.debts.find((d) => d.kind === 'student');
    if (student) student.principal = Math.max(0, student.principal - loanThisYear * BALANCE.education.grantConversion);
  }
  if (prog.kind !== 'compulsory' && enr.performance >= BALANCE.education.scholarshipThreshold && rng.chance(0.3)) {
    const amount = Math.round(rng.int(2, 6) * 10_000 * s.economy.priceIndex);
    addTx(s, amount, 'education', 'Stipend for gode resultater');
    s.education.scholarships += 1;
    log(s, `Du fikk et stipend på ${Math.round(amount / 1000)} 000 kr for strålende resultater!`, 'positive', 'Stipend', 'award');
  }
  if (enr.yearsCompleted >= enr.yearsRequired) graduate(sim);
}

function graduate(sim: Sim): void {
  const { s } = sim;
  const enr = s.education.current;
  if (!enr) return;
  const prog = getProgram(enr.programId);
  if (!prog) return;
  const grade = gradeFromPerformance(enr.performance);
  s.education.credentials.push({ programId: prog.id, level: prog.level, field: enr.field, grade, year: s.year });
  s.education.current = null;
  const p = player(s);
  p.educationLevel = highestEducation(s);
  p.occupationStatus = s.career.job ? 'employed' : 'unemployed';
  const gradeTxt = grade.toFixed(1).replace('.', ',');
  if (prog.kind === 'compulsory') {
    log(s, `Du fullførte ${prog.name.toLowerCase()} med snitt ${gradeTxt}.`, 'positive', 'Ferdig!', 'check-circle');
    if (prog.id === 'primary') enroll(sim, 'lower_secondary', true);
    return;
  }
  changeStat(p, 'happiness', 8);
  changeStat(p, 'reputation', prog.level === 'phd' ? 8 : 4);
  s.milestones.push({ kind: 'graduation', text: `Du fullførte ${prog.name.toLowerCase()} med snitt ${gradeTxt}.` });
  log(s, `Du fullførte ${prog.name.toLowerCase()} med snitt ${gradeTxt}! Familien jublet.`, 'milestone', 'Uteksaminert', 'graduation-cap');
  if (prog.level === 'phd') s.flags.doctorate = 1;
}

export function currentProgram(s: GameState): ProgramDef | undefined {
  return s.education.current ? getProgram(s.education.current.programId) : undefined;
}
