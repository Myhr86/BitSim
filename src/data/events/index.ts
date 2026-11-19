import type { EventDef } from '@/types/events';
import { EARLY_EVENTS } from './early';
import { CHILD_EVENTS } from './childhood';
import { TEEN_EVENTS } from './teen';
import { YOUNG_ADULT_EVENTS } from './youngAdult';
import { ADULT_EVENTS } from './adult';
import { SENIOR_EVENTS } from './senior';
import { GENERAL_EVENTS } from './general';

/** The complete event library. Each life stage lives in its own content file. */
export const EVENTS: EventDef[] = [
  ...EARLY_EVENTS,
  ...CHILD_EVENTS,
  ...TEEN_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...ADULT_EVENTS,
  ...SENIOR_EVENTS,
  ...GENERAL_EVENTS,
];

const BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function getEvent(id: string): EventDef | undefined {
  return BY_ID[id];
}
