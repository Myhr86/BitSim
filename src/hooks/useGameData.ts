import { useGame } from '@/store/gameStore';
import type { GameState, Person } from '@/types/game';

/** The active game state. Only call inside screens rendered while a game is loaded. */
export function useGameState(): GameState {
  const s = useGame((x) => x.state);
  if (!s) throw new Error('No active game');
  return s;
}

export function usePlayer(): Person {
  const s = useGameState();
  return s.people[s.playerId];
}
