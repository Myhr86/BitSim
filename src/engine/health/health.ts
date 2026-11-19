import type { GameState } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { ADDICTIONS, CONDITIONS, getAddictionDef, getConditionDef } from '@/data/health';
import { getTrait } from '@/data/traits';
import { getOccupation } from '@/data/occupations';
import { clamp } from '@/utils/math';
import { addTx, changeStat, log, player, playerAge, relsOf, type Sim } from '../simulation/helpers';

export function hasCondition(s: GameState, id: string): boolean {
  return s.health.conditions.some((c) => c.id === id);
}

export function addCondition(sim: Sim, id: string, severity?: number): boolean {
  const { s, rng } = sim;
  const def = getConditionDef(id);
  if (!def || hasCondition(s, id)) return false;
  s.health.conditions.push({ id, since: s.year, severity: severity ?? rng.int(30, 75), treated: false });
  return true;
}

export function removeCondition(s: GameState, id: string): void {
  const c = s.health.conditions.find((x) => x.id === id);
  if (c && getConditionDef(id)?.serious) s.health.survivedSerious += 1;
  s.health.conditions = s.health.conditions.filter((x) => x.id !== id);
}

/** Yearly aging, lifestyle and disease progression. */
export function processHealth(sim: Sim): void {
  const { s, rng } = sim;
  const p = player(s);
  const age = playerAge(s);
  const st = p.stats;

  // Natural development by life stage
  if (age >= 13 && age <= 22) changeStat(p, 'appearance', rng.range(-1.5, 2.5));
  if (age > BALANCE.stats.appearanceDecayAfter) changeStat(p, 'appearance', -rng.range(0.3, 1.2) * (age / 60));
  // Fitness drifts toward an age- and trait-dependent baseline; exercise lifts it above.
  const fitTarget = clamp((age < 25 ? 55 : 55 - (age - 25) * 0.55) + (p.traits.includes('athletic') ? 15 : 0) + (p.traits.includes('lazy') ? -8 : 0), 5, 80);
  changeStat(p, 'fitness', (fitTarget - st.fitness) * BALANCE.stats.fitnessRegression);
  if (age >= 18 && age < 60) changeStat(p, 'discipline', rng.range(-0.3, 0.8));
  if (age > 70) changeStat(p, 'intelligence', -rng.range(0, 1.2));

  // Health tracks a target set by age, fitness, genetics and lifestyle; illness pulls it down.
  const target = healthTarget(s);
  let delta = (target - st.health) * 0.3;
  // Conditions
  for (const c of [...s.health.conditions]) {
    const def = getConditionDef(c.id);
    if (!def) continue;
    delta -= def.yearlyDamage * (c.severity / 100) * (c.treated ? 0.35 : 1);
    if (def.mental) changeStat(p, 'happiness', -c.severity * 0.08 * (c.treated ? 0.4 : 1));
    // Public healthcare: the GP usually starts treatment of chronic conditions.
    if (def.chronic && !c.treated && rng.chance(0.35)) c.treated = true;
    const recoverP = def.recoverChance * (c.treated ? 1.6 : 1) * (st.fitness > 60 ? 1.2 : 1);
    if (rng.chance(Math.min(0.95, recoverP))) {
      removeCondition(s, c.id);
      if (def.serious || def.mental || age > 3) log(s, `Du ble frisk fra ${def.name.toLowerCase()}.`, 'positive', 'Frisk', 'heart-pulse');
    } else {
      c.severity = clamp(c.severity + (c.treated ? -rng.range(1, 8) : rng.range(-4, 5)));
    }
  }
  changeStat(p, 'health', delta);

  // New illnesses
  for (const def of CONDITIONS) {
    if (age < def.minAge || def.onset <= 0 || hasCondition(s, def.id)) continue;
    let pOn = def.onset;
    if (def.id === 'depression' || def.id === 'anxiety') pOn *= 1 + Math.max(0, st.stress - 50) / 25 + (st.happiness < 30 ? 1.5 : 0) + (p.traits.includes('anxious') ? 0.8 : 0);
    if (['diabetes', 'heart_disease', 'hypertension'].includes(def.id)) pOn *= 1 + Math.max(0, 50 - st.fitness) / 30 + Math.max(0, age - 50) / 25;
    if (def.id === 'cancer') pOn *= 1 + Math.max(0, age - 45) / 12 + (s.health.addictions.smoking ?? 0) / 40;
    if (def.id === 'dementia') pOn *= 1 + Math.max(0, age - 70) / 6;
    if (def.id === 'stroke') pOn *= 1 + Math.max(0, age - 60) / 10 + (hasCondition(s, 'hypertension') ? 1.5 : 0);
    pOn *= 1 + (60 - p.genetics) / 120;
    if (def.id === 'flu' || def.id === 'broken_bone') pOn *= age < 12 ? 1.6 : 1;
    if (rng.chance(pOn)) {
      addCondition(sim, def.id);
      const tone = def.serious ? 'negative' : 'neutral';
      log(s, diagnosisText(def.id, def.name), tone, def.serious ? 'Alvorlig diagnose' : 'Sykdom', 'stethoscope');
      changeStat(p, 'happiness', def.serious ? -10 : -2);
      if (def.serious) changeStat(p, 'stress', 10);
    }
  }
  // Burnout from chronic stress at work.
  if (st.stress > 85 && s.career.job && !hasCondition(s, 'burnout') && rng.chance(0.3)) {
    addCondition(sim, 'burnout', 60);
    log(s, 'Du gikk helt tom for energi. Legen sykemeldte deg for utbrenthet.', 'negative', 'Utbrent', 'battery-low');
  }

  // Stress moves toward a level set by your circumstances; happiness toward a baseline.
  changeStat(p, 'stress', (stressTarget(s) - st.stress) * 0.35);
  const baseline = happinessBaseline(s);
  changeStat(p, 'happiness', (baseline - st.happiness) * BALANCE.stats.happinessRegression);

  // Trait drift
  for (const tid of p.traits) {
    const t = getTrait(tid);
    for (const [k, v] of Object.entries(t.yearlyDrift)) changeStat(p, k as keyof typeof st, v ?? 0);
  }
  s.happinessLog.push(Math.round(p.stats.happiness));
  if (s.happinessLog.length > 130) s.happinessLog.shift();
  s.health.doctorVisitsThisYear = 0;
}

/** The health level a body of this age and lifestyle drifts toward. */
export function healthTarget(s: GameState): number {
  const p = player(s);
  const age = playerAge(s);
  const st = p.stats;
  let t = 94 - Math.pow(Math.max(0, age - 35), 1.5) * BALANCE.health.agingRate * 0.16;
  t += (st.fitness - 50) * 0.18;
  t += (p.genetics - 60) * 0.15;
  t -= Math.max(0, st.stress - 50) * 0.15;
  if (s.finances.lifestyle === 'frugal' && playerAge(s) >= 18) t -= 2;
  return clamp(t, 5, 100);
}

/** The stress level your circumstances push you toward. */
export function stressTarget(s: GameState): number {
  const p = player(s);
  const age = playerAge(s);
  let t = age < 6 ? 5 : age < 13 ? 12 : 20;
  const job = s.career.job;
  if (job) {
    const occ = getOccupation(job.occupationId);
    t += ((occ?.stress ?? 40) - 30) * (job.partTime ? 0.2 : 0.45);
    t += job.effort === 'high' ? 10 : job.effort === 'low' ? -6 : 0;
  }
  const enr = s.education.current;
  if (enr) t += enr.effort === 'high' ? 10 : enr.effort === 'low' ? -4 : 4;
  if (age >= 18 && !job && !enr && !s.career.retired) t += 8;
  if (s.career.retired) t -= 8;
  const debt = s.finances.debts.filter((d) => d.kind === 'consumer').reduce((a, d) => a + d.principal, 0);
  if (debt > 100_000 * s.economy.priceIndex) t += 8;
  const smallKids = relsOf(s, 'child').filter((r) => s.year - s.people[r.personId].birthYear < 6).length;
  t += smallKids * 4;
  if (p.traits.includes('anxious')) t += 10;
  if (p.traits.includes('lazy')) t -= 5;
  if (s.crime.prisonYearsLeft > 0) t += 20;
  t -= Math.max(0, p.stats.fitness - 60) * 0.15;
  return clamp(t, 0, 95);
}

export function happinessBaseline(s: GameState): number {
  const p = player(s);
  let b = 58;
  b += (p.stats.health - 70) * 0.15;
  b -= (p.stats.stress - 30) * 0.2;
  if (relsOf(s, ['spouse', 'partner']).length) b += 5;
  if (s.career.job && !s.career.job.partTime) b += 3;
  if (playerAge(s) >= 18 && !s.career.job && !s.education.current && !s.career.retired) b -= 6;
  if (s.crime.prisonYearsLeft > 0) b -= 20;
  if (s.finances.cash + s.finances.savingsAccount < 0) b -= 8;
  return clamp(b, 15, 90);
}

function diagnosisText(id: string, name: string): string {
  const custom: Record<string, string> = {
    flu: 'Du lå i senga en hel uke med influensa.',
    broken_bone: 'Du brakk armen etter et uheldig fall.',
    cancer: 'Legen hadde dårlige nyheter: du har fått kreft.',
    heart_disease: 'En utmattende undersøkelse viste at du har hjertesykdom.',
    depression: 'Du har kjent deg nedfor lenge. Legen mener du har depresjon.',
    anxiety: 'Bekymringene tok overhånd. Du fikk diagnosen angstlidelse.',
    dementia: 'Hukommelsen svikter. Legen konstaterte tidlig demens.',
    stroke: 'Du fikk et hjerneslag og ble hastet til sykehuset.',
  };
  return custom[id] ?? `Du fikk diagnosen ${name.toLowerCase()}.`;
}

export interface TreatmentResult {
  ok: boolean;
  text: string;
}

/** Visit a doctor to treat a condition. Public healthcare is cheap; some treatments cost extra. */
export function treatCondition(sim: Sim, id: string, privateClinic: boolean): TreatmentResult {
  const { s, rng } = sim;
  const c = s.health.conditions.find((x) => x.id === id);
  const def = getConditionDef(id);
  if (!c || !def) return { ok: false, text: 'Ingen slik tilstand.' };
  if (s.health.doctorVisitsThisYear >= 3) return { ok: false, text: 'Du har brukt opp legetimene dine i år.' };
  const cost = Math.round((def.treatCost + (privateClinic ? 40_000 : 400)) * s.economy.priceIndex);
  if (s.finances.cash < cost) return { ok: false, text: 'Du har ikke råd til behandlingen.' };
  s.health.doctorVisitsThisYear += 1;
  addTx(s, -cost, 'health', `Behandling: ${def.name}`);
  const chance = def.treatChance * (privateClinic ? 1.2 : 1) * (c.treated ? 0.6 : 1);
  if (rng.chance(Math.min(0.97, chance))) {
    if (def.chronic) {
      c.treated = true;
      c.severity = clamp(c.severity - 25);
      return { ok: true, text: `Behandlingen virker. ${def.name} er nå under kontroll.` };
    }
    removeCondition(s, id);
    changeStat(player(s), 'happiness', def.serious ? 12 : 3);
    log(s, `Behandlingen var vellykket – du er frisk fra ${def.name.toLowerCase()}!`, 'positive', 'Behandlet', 'heart-pulse');
    if (def.serious) s.flags.survivedSerious = (s.flags.survivedSerious ?? 0) + 1;
    return { ok: true, text: `Du er frisk fra ${def.name.toLowerCase()}!` };
  }
  c.severity = clamp(c.severity + 5);
  return { ok: true, text: 'Behandlingen hadde dessverre liten effekt.' };
}

export function rehab(sim: Sim, addictionId: string): TreatmentResult {
  const { s, rng } = sim;
  const sev = s.health.addictions[addictionId];
  const def = getAddictionDef(addictionId);
  if (!sev || !def) return { ok: false, text: 'Ingen avhengighet.' };
  if (s.flags[`rehab_${addictionId}`] === s.year) return { ok: false, text: 'Du har allerede vært på behandling i år.' };
  s.flags[`rehab_${addictionId}`] = s.year;
  const cost = Math.round(15_000 * s.economy.priceIndex);
  if (s.finances.cash < cost) return { ok: false, text: 'Du har ikke råd.' };
  addTx(s, -cost, 'health', `Rusbehandling: ${def.name}`);
  const p = player(s);
  if (rng.chance(0.4 + (p.stats.discipline - 50) * 0.01)) {
    delete s.health.addictions[addictionId];
    s.flags.recoveredAddiction = 1;
    changeStat(p, 'happiness', 8);
    log(s, `Du fullførte behandlingen og er fri fra avhengigheten til ${def.name.toLowerCase()}.`, 'positive', 'Rusfri', 'shield-check');
    return { ok: true, text: 'Behandlingen var en suksess!' };
  }
  s.health.addictions[addictionId] = clamp(sev - 20);
  return { ok: true, text: 'Det går riktig vei, men du er ikke helt fri ennå.' };
}

export function addictionNames(): Record<string, string> {
  return Object.fromEntries(ADDICTIONS.map((a) => [a.id, a.name]));
}
