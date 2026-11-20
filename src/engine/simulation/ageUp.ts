import type { GameState } from '@/types/game';
import { beginSim, changeStat, endSim, lifeStage, log, player, playerAge, relsOf, type Sim } from './helpers';
import { advanceEconomy } from '../economy/market';
import { historicalPhase } from '@/data/eras';
import { processFinances } from '../economy/finance';
import { processEducation } from '../education/education';
import { processCareer } from '../careers/careers';
import { processNpcLives } from '../npcs/life';
import { processRelationships } from '../relationships/relationships';
import { processHealth } from '../health/health';
import { playerMortality, deathCause } from '../health/mortality';
import { processPrison } from '../crime/crime';
import { raiseYearEvents } from '../events/selector';
import { die } from '../legacy/legacy';
import { postActionChecks } from './checks';
import { validateState } from './validate';

export class AgeUpBlocked extends Error {}

/**
 * The central yearly simulation pipeline. Every step runs exactly once per call, and the
 * call is only allowed when no events are unresolved, so income/expenses can never be
 * duplicated by pausing, reloading or resuming.
 */
export function ageUp(state: GameState): GameState {
  // 1. Validate
  if (state.death) throw new AgeUpBlocked('Character is dead');
  // 2. Unresolved events block progression
  if (state.pendingEvents.some((p) => !p.resolved)) throw new AgeUpBlocked('Unresolved events');
  const problems = validateState(state);
  if (problems.length > 0) throw new AgeUpBlocked(`Invalid state: ${problems[0]}`);

  const sim = beginSim(state);
  const { s } = sim;
  s.pendingEvents = []; // resolved events are dismissed when the year advances
  s.career.offer = null;

  // 3. Advance calendar & age (age is derived from year)
  s.year += 1;
  const age = playerAge(s);
  // Reset per-year counters
  s.activityUses = {};
  for (const r of Object.values(s.relationships)) r.interactions = 0;

  // 4/5. NPCs age implicitly via birthYear; process scheduled consequences inside event step.
  // 6. World economy
  s.economy = advanceEconomy(sim.rng, s.economy, historicalPhase(s.year));
  // 7. Income and expenses
  processFinances(sim);
  // 8. Education & career
  processPrison(sim);
  processEducation(sim);
  processCareer(sim);
  // 9. NPC life events
  processNpcLives(sim);
  // 10. Relationships
  processRelationships(sim);
  // 11. Health & aging
  processHealth(sim);
  stageTransitions(sim, age);
  // 14 (before events): mortality – a dead character receives no new events.
  const q = playerMortality(s);
  if (player(s).stats.health <= 0 || sim.rng.chance(q)) {
    die(sim, deathCause(s, sim.rng));
    postActionChecks(sim);
    return endSim(sim);
  }
  // 12/13. Life events (choice events wait for the player)
  raiseYearEvents(sim);
  // 15. Achievements & milestones
  postActionChecks(sim);
  // 16. Timeline updated throughout; 17. saving is done by the store layer.
  return endSim(sim);
}

/** Narrative and mechanical transitions between life stages. */
function stageTransitions(sim: Sim, age: number): void {
  const { s } = sim;
  const prev = lifeStage(age - 1);
  const now = lifeStage(age);
  if (age === 1) log(s, 'Du tok dine første skritt – rett inn i et bord.', 'positive', '1 år', 'footprints');
  if (age === 18) {
    log(s, 'Du er myndig! Nå bestemmer du selv – på godt og vondt.', 'milestone', '18 år', 'party-popper');
  }
  if (prev !== now) {
    if (now === 'senior') log(s, 'Du har rundet 65. Livets høst kan være den fineste årstiden.', 'milestone', 'Seniorlivet', 'leaf');
    if (now === 'adult') log(s, 'Tretti år! Mange forventer at du har «funnet deg selv» nå.', 'neutral', '30 år', 'cake');
  }
  // Adults living at home become restless.
  if (s.livingWithParents && age >= 25) changeStat(player(s), 'happiness', -1.5);
  // Moved out automatically when no parent is alive and you are an adult.
  if (s.livingWithParents && age >= 18 && relsOf(s, ['mother', 'father']).length === 0) s.livingWithParents = false;
}
