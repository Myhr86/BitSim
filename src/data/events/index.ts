import type { EventDef } from '@/types/events';
import { EARLY_EVENTS } from './early';
import { CHILD_EVENTS } from './childhood';
import { TEEN_EVENTS } from './teen';
import { YOUNG_ADULT_EVENTS } from './youngAdult';
import { ADULT_EVENTS } from './adult';
import { SENIOR_EVENTS } from './senior';
import { GENERAL_EVENTS } from './general';
import { HISTORICAL_EVENTS } from './historical';
import { EVERYDAY_EVENTS } from './everyday';

/** The complete event library. Each life stage lives in its own content file. */
export const EVENTS: EventDef[] = [
  ...EARLY_EVENTS,
  ...CHILD_EVENTS,
  ...TEEN_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...ADULT_EVENTS,
  ...SENIOR_EVENTS,
  ...GENERAL_EVENTS,
  ...EVERYDAY_EVENTS,
  ...HISTORICAL_EVENTS,
];

/**
 * Calendar-year windows for events that depend on technology or institutions, so a life
 * that starts in 1920 never meets a dating app. [from, to?]
 */
const ERA_GATES: Record<string, [number, number?]> = {
  ya_crypto: [2011],
  teen_social_media: [2008],
  teen_cyberbully: [2006],
  teen_hackathon: [2000],
  teen_gaming_tournament: [2000],
  ya_scam_call: [2006],
  sn_tech_struggle: [1998],
  child_screen_time: [1985],
  ya_credit_card: [1970],
  teen_russ: [1960],
  ya_festival: [1970],
  ya_side_project: [2008],
  ad_identity_theft: [2000],
  ad_cancer_screening: [1990],
  child_wealthy_trip: [1965],
  sn_pension_trip: [1965],
  teen_coming_out: [1972],
  gen_tv_quiz: [1960],
  teen_body_image: [2005],
  ad_fertility: [1985],
  sn_scam_grandparent: [1990],
  teen_exchange: [1950],
  ya_volunteer_abroad: [1960],
  ya_bsu: [1990],
  teen_moped: [1950],
  ya_drunk_driving: [1925],
  teen_learner_permit: [1925],
  teen_driving_test_delayed: [1925],
  teen_parents_money_gift: [1950],
  ya_student_loan_letter: [1950],
  ad_sabbatical: [1975],
  ad_union_strike: [1910],
  child_bsu: [1950],
  ya_dog_adoption: [1960],
  teen_snus: [1900],
  teen_smoking: [1900],
  teen_confirmation: [1900],
  early_vaccine: [1950],
  ya_paid_internship: [1980],
  ya_hostel_romance: [1960],
  ya_roadtrip: [1955],
  ad_job_offer_competitor: [1960],
  gen_pandemic: [1957],
  ad_investment_property: [1950],
  sn_memoir: [1950],
  ya_parental_help_money: [1960],
};

for (const e of EVENTS) {
  const gate = ERA_GATES[e.id];
  if (gate) e.conditions = [...(e.conditions ?? []), { t: 'year', min: gate[0], max: gate[1] }];
}
// Conscription applied to men only until the 2015 reform.
const military = EVENTS.find((e) => e.id === 'ya_military');
if (military) military.conditions = [...(military.conditions ?? []), { t: 'any', of: [{ t: 'gender', value: 'male' }, { t: 'year', min: 2015 }] }];

export const ERA_GATED_EVENT_IDS = Object.keys(ERA_GATES);

const BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function getEvent(id: string): EventDef | undefined {
  return BY_ID[id];
}
