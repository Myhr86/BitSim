import type { Person } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { eraChildMortality, eraMortality } from '@/data/eras';
import { clamp } from '@/utils/math';
import { addRelationship, addTx, ageOf, changeStat, log, player, relsOf, type Sim } from '../simulation/helpers';
import { createPerson, inheritGenetics, npcOccupationFor, randomEducationLevel } from './factory';

/** Annual death probability for an NPC (simplified Gompertz curve). */
export function npcMortality(age: number, health: number, year = 2026): number {
  const base = BALANCE.health.mortalityBase * Math.exp(BALANCE.health.mortalityGrowth * age) * eraMortality(year);
  const infant = age === 0 ? 0.002 * eraChildMortality(year) : 0;
  const healthMult = health < 30 ? 3 : health < 50 ? 1.6 : 1;
  return Math.min(0.7, base * healthMult + infant);
}

const NPC_CAUSES = ['hjertesvikt', 'kreft', 'hjerneslag', 'lungebetennelse', 'alderdom', 'en ulykke'];

/**
 * NPCs live their own lives every year: they age, change jobs, marry, have children,
 * gain or lose wealth and eventually die. Only people relevant to the player are simulated.
 */
export function processNpcLives(sim: Sim): void {
  const { s, rng } = sim;
  const me = player(s);
  const relevant = new Set<string>(Object.keys(s.relationships));
  // Include spouses of children so grandchildren have two parents.
  for (const id of [...relevant]) {
    const p = s.people[id];
    if (p?.spouseId) relevant.add(p.spouseId);
  }
  for (const id of relevant) {
    const npc = s.people[id];
    if (!npc || !npc.alive || npc.id === me.id) continue;
    const age = ageOf(s, npc);
    // Health drift
    const healthDelta = age > 50 ? -rng.range(0.5, 2.5) * (age / 60) : rng.range(-1, 1.5);
    npc.stats.health = clamp(npc.stats.health + healthDelta + (npc.genetics - 60) * 0.02);
    npc.stats.happiness = clamp(npc.stats.happiness + rng.normal(0, 3));
    // Death
    const r = s.relationships[id];
    if (rng.chance(npcMortality(age, npc.stats.health, s.year))) {
      killNpc(sim, npc, age > 75 ? 'alderdom' : rng.pick(NPC_CAUSES));
      continue;
    }
    // Wealth: NPC savings roughly follow their life stage.
    if (age >= 20 && age < 67) npc.wealth = Math.max(0, npc.wealth + rng.range(10_000, 90_000) * s.economy.priceIndex);
    else if (age >= 67) npc.wealth = Math.max(0, npc.wealth * 0.98);
    // Education & career for young NPCs
    if (age === 19 && npc.educationLevel === 'none') npc.educationLevel = randomEducationLevel(rng);
    if (age >= 20 && age < 67 && !npc.occupationId && npc.occupationStatus !== 'employed') {
      if (rng.chance(0.6)) {
        npc.occupationId = npcOccupationFor(rng, npc.educationLevel === 'none' ? 'upperSecondary' : npc.educationLevel, age, s.year);
        npc.occupationStatus = npc.occupationId ? 'employed' : 'unemployed';
      }
    }
    if (age >= 67 && npc.occupationStatus === 'employed') {
      npc.occupationStatus = 'retired';
      if (r && (r.kind === 'mother' || r.kind === 'father')) log(s, `${relLabel(r.kind)} ${npc.firstName} gikk av med pensjon.`, 'neutral', undefined, 'sunset');
    }
    if (!r) continue;
    // Independent life events for close NPCs
    if ((r.kind === 'child' || r.kind === 'sibling') && age >= 23 && age <= 45 && !npc.spouseId && rng.chance(0.09)) {
      const spouse = createPerson(s, rng, {
        gender: npc.gender === 'male' ? 'female' : 'male',
        birthYear: npc.birthYear + rng.int(-3, 3),
        city: npc.city,
        education: randomEducationLevel(rng),
      });
      spouse.spouseId = npc.id;
      npc.spouseId = spouse.id;
      log(s, `${relLabel(r.kind)} ${npc.firstName} giftet seg med ${spouse.firstName}.`, 'relationship', 'Bryllup i familien', 'gem');
      changeStat(me, 'happiness', 2);
    }
    if (r.kind === 'child' && npc.spouseId && age >= 24 && age <= 42 && npc.childrenIds.length < 4 && rng.chance(0.14)) {
      const spouse = s.people[npc.spouseId];
      const baby = createPerson(s, rng, {
        birthYear: s.year,
        city: npc.city,
        lastName: npc.lastName,
        motherId: npc.gender === 'female' ? npc.id : spouse?.id,
        fatherId: npc.gender === 'male' ? npc.id : spouse?.id,
        genetics: inheritGenetics(rng, npc, spouse),
      });
      npc.childrenIds.push(baby.id);
      if (spouse) spouse.childrenIds.push(baby.id);
      addRelationship(s, baby.id, 'grandchild', { strength: 70, trust: 70 });
      s.flags.grandchildren = (s.flags.grandchildren ?? 0) + 1;
      s.milestones.push({ kind: 'grandchild', text: `Barnebarnet ${baby.firstName} ble født.` });
      log(s, `Du ble ${me.gender === 'male' ? 'bestefar' : 'bestemor'}! ${npc.firstName} fikk ${baby.gender === 'male' ? 'sønnen' : 'datteren'} ${baby.firstName}.`, 'milestone', 'Barnebarn', 'baby');
      changeStat(me, 'happiness', 6);
    }
    if (r.kind === 'child' && age === 19 && rng.chance(0.7)) {
      log(s, `${npc.firstName} flyttet hjemmefra.`, 'neutral', undefined, 'home');
    }
    if ((r.kind === 'friend' || r.kind === 'bestFriend') && age >= 18 && rng.chance(0.03)) {
      r.strength = clamp(r.strength - 15);
      log(s, `${npc.firstName} flyttet til en annen by. Dere ses sjeldnere nå.`, 'relationship', undefined, 'map-pin');
    }
  }
}

function relLabel(kind: string): string {
  const m: Record<string, string> = {
    mother: 'Moren din',
    father: 'Faren din',
    sibling: 'Søsken',
    child: 'Barnet ditt',
    friend: 'Vennen din',
    bestFriend: 'Bestevennen din',
    grandparent: 'Besteforelderen din',
    spouse: 'Ektefellen din',
    partner: 'Kjæresten din',
    grandchild: 'Barnebarnet ditt',
  };
  return m[kind] ?? '';
}

/** Kills an NPC, applies grief and inheritance. */
export function killNpc(sim: Sim, npc: Person, cause: string): void {
  const { s } = sim;
  const me = player(s);
  npc.alive = false;
  npc.deathYear = s.year;
  npc.deathCause = cause;
  const r = s.relationships[npc.id];
  if (!r) return;
  r.status = 'deceased';
  const close = ['mother', 'father', 'spouse', 'child', 'sibling', 'partner', 'bestFriend', 'grandparent', 'grandchild'].includes(r.kind);
  const grief = close ? 6 + r.strength * 0.12 : 2;
  changeStat(me, 'happiness', -grief);
  changeStat(me, 'stress', grief * 0.5);
  log(s, `${relLabel(r.kind)} ${npc.firstName} døde ${ageOf(s, npc)} år gammel (${cause}).`, 'negative', 'Dødsfall', 'flower');
  if (r.kind === 'spouse') {
    me.spouseId = undefined;
    s.flags.widowed = s.year;
  }
  // Inheritance from parents and grandparents.
  if ((r.kind === 'mother' || r.kind === 'father' || r.kind === 'grandparent') && npc.wealth > 0) {
    const otherHeirs = Math.max(1, relsOf(s, 'sibling').length + 1);
    const spouseAlive = npc.spouseId ? s.people[npc.spouseId]?.alive : false;
    let share = r.kind === 'grandparent' ? npc.wealth * 0.1 : npc.wealth / otherHeirs;
    if (spouseAlive && r.kind !== 'grandparent') share *= 1 - BALANCE.wealth.npcInheritanceShareToSpouse;
    share = Math.round(share);
    if (share > 1000) {
      addTx(s, share, 'inheritance', `Arv etter ${npc.firstName}`);
      s.finances.inheritanceReceived += share;
      npc.wealth = 0;
      log(s, `Du arvet ${share.toLocaleString('nb-NO')} kr etter ${npc.firstName}.`, 'financial', 'Arv', 'landmark');
    }
  }
  // Orphaned while living at home: you move in with a relative but keep living "at home".
  const parentsAlive = relsOf(s, ['mother', 'father']).length;
  if (parentsAlive === 0 && s.livingWithParents && ageOf(s, me) >= 18) {
    s.livingWithParents = false;
    log(s, 'Uten foreldre i live måtte du flytte for deg selv.', 'neutral', undefined, 'home');
  }
}
