import { player, log, type Sim } from './helpers';
import { netWorth } from '../assets/assets';
import { deathCause } from '../health/mortality';
import { coverShortfall } from '../economy/finance';
import { die } from '../legacy/legacy';
import { evaluateAchievements } from '../achievements/definitions';

/** Checks run after every player action and after each simulated year. */
export function postActionChecks(sim: Sim): void {
  const { s, rng } = sim;
  if (s.death) return;
  const p = player(s);
  // Never leave the player with a negative balance: liquidate savings or borrow.
  if (s.finances.cash < 0) coverShortfall(sim);
  // Milestone: first million (real terms).
  if (!s.flags.firstMillion && netWorth(s) >= 1_000_000 * s.economy.priceIndex) {
    s.flags.firstMillion = s.year;
    s.milestones.push({ kind: 'firstMillion', text: 'Du passerte én million kroner i formue.' });
    log(s, 'Formuen din har passert én million kroner! Det kjennes godt.', 'milestone', 'Millionær', 'gem');
  }
  if (p.stats.health <= 0) {
    const forced = Object.keys(s.flags).find((k) => k.startsWith('cause_'));
    die(sim, forced ? forced.slice(6).replace(/_/g, ' ') : deathCause(s, rng));
  }
  syncAchievements(sim);
}

export function syncAchievements(sim: Sim): void {
  const { s } = sim;
  const already = new Set(s.unlockedThisSave);
  for (const id of evaluateAchievements(s, already)) s.unlockedThisSave.push(id);
}
