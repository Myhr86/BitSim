import type { GameState } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { getConditionDef } from '@/data/health';
import { eraChildMortality, eraMortality } from '@/data/eras';
import { player, playerAge } from '../simulation/helpers';
import type { Rng } from '../probability/rng';

/**
 * Annual mortality probability for the player. A Gompertz baseline is multiplied by
 * health, conditions and lifestyle. Young healthy characters very rarely die.
 */
export function playerMortality(s: GameState): number {
  const p = player(s);
  const age = playerAge(s);
  const h = p.stats.health;
  if (h <= 0) return 1;
  let q = BALANCE.health.mortalityBase * Math.exp(BALANCE.health.mortalityGrowth * age);
  if (age === 0) q += 0.0008 * eraChildMortality(s.year);
  else if (age < 18) q *= 0.5 * eraChildMortality(s.year);
  q *= eraMortality(s.year);
  // Health multiplier: poor health strongly increases risk.
  const healthMult = h >= 70 ? 0.8 : h >= 50 ? 1 : h >= 30 ? 2 : h >= 15 ? 4 : 8;
  q *= healthMult;
  q *= 1 + (55 - p.genetics) / 150;
  for (const c of s.health.conditions) {
    const def = getConditionDef(c.id);
    if (!def) continue;
    q += def.mortality * 0.6 * (c.severity / 100) * (c.treated ? 0.4 : 1);
  }
  for (const [id, sev] of Object.entries(s.health.addictions)) {
    q += (id === 'alcohol' || id === 'smoking' ? 0.004 : 0.001) * (sev / 100);
  }
  q *= BALANCE.health.difficultyMortality[s.settings.difficulty];
  return Math.min(0.85, Math.max(0, q));
}

export function deathCause(s: GameState, rng: Rng): string {
  const serious = s.health.conditions
    .map((c) => ({ c, def: getConditionDef(c.id) }))
    .filter((x) => x.def && x.def.mortality >= 0.008)
    .sort((a, b) => (b.def?.mortality ?? 0) * b.c.severity - (a.def?.mortality ?? 0) * a.c.severity);
  if (serious.length > 0 && rng.chance(0.75)) return (serious[0].def?.name ?? 'sykdom').toLowerCase();
  const age = playerAge(s);
  if (age >= 85) return rng.pick(['alderdom', 'alderdom', 'hjertesvikt', 'sovnet stille inn']);
  if (age >= 60) return rng.pick(['hjerteinfarkt', 'hjerneslag', 'kreft', 'lungebetennelse']);
  if (age >= 18) return rng.pick(['trafikkulykke', 'hjertestans', 'drukningsulykke', 'plutselig sykdom']);
  return rng.pick(['ulykke', 'plutselig sykdom']);
}
