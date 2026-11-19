import type { StatKey, TraitId } from '@/types/core';

export interface TraitDef {
  id: TraitId;
  name: string;
  description: string;
  /** Applied once at birth. */
  statBonus: Partial<Record<StatKey, number>>;
  /** Applied every year (small drift). */
  yearlyDrift: Partial<Record<StatKey, number>>;
  opposite?: TraitId;
}

export const TRAITS: TraitDef[] = [
  { id: 'ambitious', name: 'Ambisiøs', description: 'Vil alltid lenger. Jobber hardt – og stresser mer.', statBonus: { discipline: 8 }, yearlyDrift: { discipline: 1, stress: 1 }, opposite: 'lazy' },
  { id: 'lazy', name: 'Makelig', description: 'Tar livet med ro. Mindre stress, mindre driv.', statBonus: { discipline: -10, stress: -5 }, yearlyDrift: { discipline: -1, stress: -1 }, opposite: 'ambitious' },
  { id: 'kind', name: 'Snill', description: 'Lett å like og lett å utnytte.', statBonus: { reputation: 5 }, yearlyDrift: { reputation: 1 }, opposite: 'hotheaded' },
  { id: 'hotheaded', name: 'Hissig', description: 'Kort lunte, store følelser.', statBonus: { stress: 5 }, yearlyDrift: { stress: 1, reputation: -1 }, opposite: 'kind' },
  { id: 'creative', name: 'Kreativ', description: 'Ser muligheter andre overser.', statBonus: { intelligence: 4, happiness: 3 }, yearlyDrift: { happiness: 0.5 } },
  { id: 'shy', name: 'Sjenert', description: 'Trives best i små grupper.', statBonus: { reputation: -4 }, yearlyDrift: {}, opposite: 'charismatic' },
  { id: 'charismatic', name: 'Karismatisk', description: 'Rommet lyser opp når du kommer inn.', statBonus: { reputation: 8, appearance: 3 }, yearlyDrift: { reputation: 0.5 }, opposite: 'shy' },
  { id: 'anxious', name: 'Engstelig', description: 'Bekymrer seg mye, men er forsiktig.', statBonus: { stress: 10 }, yearlyDrift: { stress: 1.5 }, opposite: 'adventurous' },
  { id: 'adventurous', name: 'Eventyrlysten', description: 'Elsker spenning og nye opplevelser.', statBonus: { happiness: 4, fitness: 3 }, yearlyDrift: { happiness: 0.5 }, opposite: 'anxious' },
  { id: 'frugal', name: 'Sparsom', description: 'Hver krone teller.', statBonus: { discipline: 4 }, yearlyDrift: {}, opposite: 'impulsive' },
  { id: 'impulsive', name: 'Impulsiv', description: 'Handler først, tenker etterpå.', statBonus: { discipline: -6, happiness: 3 }, yearlyDrift: { discipline: -0.5 }, opposite: 'frugal' },
  { id: 'honest', name: 'Ærlig', description: 'Sier det som det er.', statBonus: { reputation: 4 }, yearlyDrift: { reputation: 0.5 } },
  { id: 'athletic', name: 'Sporty', description: 'Kroppen vil bevege seg.', statBonus: { fitness: 12, health: 4 }, yearlyDrift: { fitness: 1 } },
  { id: 'bookish', name: 'Boklig', description: 'Slukte bøker før du kunne gå.', statBonus: { intelligence: 10 }, yearlyDrift: { intelligence: 0.5 } },
];

const BY_ID = Object.fromEntries(TRAITS.map((t) => [t.id, t])) as Record<TraitId, TraitDef>;

export function getTrait(id: TraitId): TraitDef {
  return BY_ID[id];
}
