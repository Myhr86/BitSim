import type { GameState } from '@/types/game';
import { occupationTitle } from '@/data/occupations';
import { getProgram } from '@/data/education';
import { playerAge } from '@/engine/simulation/helpers';
import { t } from '@/i18n';

/** Short description of what the character currently does. */
export function occupationLine(s: GameState): string {
  if (s.crime.prisonYearsLeft > 0) return 'Innsatt';
  if (s.career.job) return occupationTitle(s.career.job.occupationId, s.career.job.level);
  if (s.education.current) return getProgram(s.education.current.programId)?.name ?? 'Student';
  if (s.career.retired) return t('retired');
  const age = playerAge(s);
  if (age < 1) return 'Nyfødt';
  if (age < 6) return 'Barnehagebarn';
  return 'Arbeidsledig';
}

