import type { GameState, Person, Relationship, RelKind } from '@/types/game';
import { getTrait } from '@/data/traits';
import { clamp } from '@/utils/math';
import { addRelationship, addTx, ageOf, changeStat, log, newId, partnerRel, player, playerAge, relsOf, type Sim } from '../simulation/helpers';
import { createPerson, inheritGenetics } from '../npcs/factory';

export const FAMILY_KINDS: RelKind[] = ['mother', 'father', 'sibling', 'child', 'grandchild', 'grandparent'];
export const ROMANTIC_KINDS: RelKind[] = ['partner', 'spouse'];

/** Personality compatibility -1..1 based on shared and opposing traits. */
export function compatibility(a: Person, b: Person): number {
  let score = 0;
  for (const t of a.traits) {
    if (b.traits.includes(t)) score += 0.3;
    const opp = getTrait(t)?.opposite;
    if (opp && b.traits.includes(opp)) score -= 0.35;
  }
  if (a.traits.includes('kind') || b.traits.includes('kind')) score += 0.1;
  if (a.traits.includes('hotheaded') && b.traits.includes('hotheaded')) score -= 0.3;
  return clamp(score, -1, 1);
}

/** Yearly drift of all relationships toward personality-driven baselines. */
export function processRelationships(sim: Sim): void {
  const { s, rng } = sim;
  const me = player(s);
  for (const r of Object.values(s.relationships)) {
    const npc = s.people[r.personId];
    if (!npc) {
      delete s.relationships[r.personId];
      continue;
    }
    if (!npc.alive) {
      r.status = 'deceased';
      r.interactions = 0;
      continue;
    }
    if (r.status !== 'active') {
      // Estrangement slowly heals with family.
      if (FAMILY_KINDS.includes(r.kind) && rng.chance(0.08)) {
        r.status = 'active';
        r.strength = 25;
        log(s, `Du og ${npc.firstName} tok kontakt igjen etter lang tid.`, 'relationship', 'Forsoning', 'heart-handshake');
      }
      r.interactions = 0;
      continue;
    }
    const comp = compatibility(me, npc);
    const neglect = r.interactions === 0;
    let drift = comp * 2 + rng.normal(0, 2.5);
    if (neglect) {
      drift -= r.kind === 'friend' || r.kind === 'bestFriend' ? 5 : ROMANTIC_KINDS.includes(r.kind) ? 4 : r.kind === 'coworker' ? 2 : 1.5;
    }
    if (r.kind === 'mother' || r.kind === 'father') drift += playerAge(s) < 13 ? 2 : 0;
    if (r.kind === 'child' && ageOf(s, npc) < 12) drift += 2;
    r.strength = clamp(r.strength + drift);
    r.trust = clamp(r.trust + (r.strength - r.trust) * 0.1);
    if (ROMANTIC_KINDS.includes(r.kind)) r.attraction = clamp(r.attraction - rng.range(0, 2.5) + (me.stats.appearance - 50) * 0.02);
    r.interactions = 0;

    // Friendships drift apart when neglected.
    if ((r.kind === 'friend' || r.kind === 'coworker') && r.strength < 8) {
      delete s.relationships[r.personId];
      if (r.kind === 'friend') log(s, `Du og ${npc.firstName} gled fra hverandre.`, 'relationship', undefined, 'user-minus');
      continue;
    }
    if (r.kind === 'bestFriend' && r.strength < 35) {
      r.kind = 'friend';
      log(s, `${npc.firstName} er ikke lenger din bestevenn.`, 'relationship', undefined, 'user-minus');
    }
    if (r.kind === 'friend' && r.strength > 88 && relsOf(s, 'bestFriend').length === 0 && rng.chance(0.4)) {
      r.kind = 'bestFriend';
      log(s, `${npc.firstName} har blitt din aller beste venn.`, 'relationship', 'Bestevenn', 'heart');
    }
    if (r.kind === 'partner' && r.strength < 12) {
      breakUp(sim, r.personId, true);
    }
  }
  // Grief for recently deceased close ones is handled in npc life.
  // Loneliness / social support effects on happiness.
  const close = relsOf(s, ['friend', 'bestFriend', 'partner', 'spouse', 'mother', 'father', 'sibling', 'child']).filter((r) => r.strength >= 50).length;
  const age = playerAge(s);
  if (age >= 13) changeStat(me, 'happiness', close === 0 ? -4 : Math.min(3, close * 0.6));
}

export function breakUp(sim: Sim, personId: string, mutual = false): void {
  const { s } = sim;
  const r = s.relationships[personId];
  const npc = s.people[personId];
  if (!r || !npc) return;
  if (r.kind === 'spouse') {
    divorce(sim, personId);
    return;
  }
  r.kind = 'ex';
  r.strength = Math.min(r.strength, 20);
  r.attraction = 0;
  changeStat(player(s), 'happiness', mutual ? -4 : -8);
  log(s, mutual ? `Du og ${npc.firstName} gikk fra hverandre.` : `Du slo opp med ${npc.firstName}.`, 'relationship', 'Brudd', 'heart-crack');
}

export function divorce(sim: Sim, personId: string): void {
  const { s } = sim;
  const r = s.relationships[personId];
  const npc = s.people[personId];
  const me = player(s);
  if (!r || !npc) return;
  r.kind = 'ex';
  r.strength = Math.min(r.strength, 15);
  r.attraction = 0;
  me.spouseId = undefined;
  npc.spouseId = undefined;
  // Settlement: half of liquid savings and a share of property value goes to the ex-spouse.
  const f = s.finances;
  const liquid = Math.max(0, f.cash + f.savingsAccount + f.funds);
  const property = s.assets.filter((a) => a.residence).reduce((a, x) => a + x.value, 0);
  const settlement = Math.round(liquid * 0.5 + property * 0.2);
  if (settlement > 0) {
    addTx(s, -settlement, 'event', 'Skifteoppgjør ved skilsmisse');
    npc.wealth += settlement;
  }
  s.flags.divorces = (s.flags.divorces ?? 0) + 1;
  changeStat(me, 'happiness', -14);
  changeStat(me, 'stress', 14);
  log(s, `Du og ${npc.firstName} ble skilt. Skifteoppgjøret kostet deg ${Math.round(settlement / 1000)} 000 kr.`, 'negative', 'Skilsmisse', 'heart-crack');
}

export function marry(sim: Sim, personId: string, weddingCost: number): void {
  const { s } = sim;
  const r = s.relationships[personId];
  const npc = s.people[personId];
  if (!r || !npc) return;
  const me = player(s);
  r.kind = 'spouse';
  r.strength = clamp(r.strength + 10);
  me.spouseId = npc.id;
  npc.spouseId = me.id;
  if (weddingCost > 0) addTx(s, -weddingCost, 'event', 'Bryllup');
  s.flags.marriages = (s.flags.marriages ?? 0) + 1;
  changeStat(me, 'happiness', 12);
  s.milestones.push({ kind: 'wedding', text: `Du giftet deg med ${npc.firstName} ${npc.lastName}.` });
  log(s, `Du giftet deg med ${npc.firstName}! Det ble en dag dere aldri glemmer.`, 'milestone', 'Bryllup', 'gem');
  s.livingWithParents = false;
}

/** Creates a new romantic interest of an appropriate age and gender. */
export function createRomanticInterest(sim: Sim): Person {
  const { s, rng } = sim;
  const me = player(s);
  const age = playerAge(s);
  const pref = s.datingPreference;
  const gender = pref === 'any' ? (rng.chance(0.5) ? 'male' : 'female') : pref;
  const lo = Math.max(age >= 18 ? 18 : age - 1, Math.round(age / 2 + 7));
  const ageNpc = clamp(age + rng.int(-4, 5), lo, age + 12);
  const person = createPerson(s, rng, {
    gender,
    birthYear: s.year - ageNpc,
    city: me.city,
    education: ageNpc > 24 ? (rng.chance(0.5) ? 'bachelor' : 'upperSecondary') : 'upperSecondary',
    wealth: rng.int(0, 400_000) * s.economy.priceIndex,
  });
  if (ageNpc >= 20) {
    person.occupationStatus = 'employed';
  }
  return person;
}

export function startDating(sim: Sim, person: Person, kind: 'partner' = 'partner'): Relationship {
  const { s, rng } = sim;
  const r = addRelationship(s, person.id, kind, {
    strength: rng.int(45, 70),
    trust: rng.int(40, 60),
    attraction: rng.int(55, 90),
    loyalty: rng.int(40, 85),
  });
  return r;
}

/** Attempt to conceive / adopt a child with the current partner. */
export function haveChild(sim: Sim, adopted = false): Person | null {
  const { s, rng } = sim;
  const me = player(s);
  const pr = partnerRel(s);
  const partner = pr ? s.people[pr.personId] : undefined;
  const mother = me.gender === 'female' ? me : partner?.gender === 'female' ? partner : undefined;
  const father = me.gender === 'male' ? me : partner?.gender === 'male' ? partner : undefined;
  const lastName = me.lastName;
  const baby = createPerson(s, rng, {
    birthYear: s.year,
    city: me.city,
    lastName,
    motherId: adopted ? undefined : mother?.id,
    fatherId: adopted ? undefined : father?.id,
    genetics: inheritGenetics(rng, me, partner),
    stats: { happiness: 85, health: 90, stress: 5 },
  });
  if (adopted) {
    // Adoptive parents are recorded on the child so the family tree stays consistent.
    if (me.gender === 'female') baby.motherId = me.id;
    else baby.fatherId = me.id;
    if (partner) {
      if (partner.gender === 'female' && !baby.motherId) baby.motherId = partner.id;
      else if (partner.gender === 'male' && !baby.fatherId) baby.fatherId = partner.id;
    }
  }
  me.childrenIds.push(baby.id);
  if (partner) partner.childrenIds.push(baby.id);
  addRelationship(s, baby.id, 'child', { strength: 85, trust: 80, loyalty: 90 });
  s.flags.childrenBorn = (s.flags.childrenBorn ?? 0) + 1;
  changeStat(me, 'happiness', 10);
  changeStat(me, 'stress', 8);
  s.milestones.push({ kind: 'childBorn', text: `${baby.firstName} ble født.` });
  log(
    s,
    adopted ? `Dere adopterte ${baby.firstName}! Familien er større nå.` : `${baby.firstName} ble født! ${baby.gender === 'male' ? 'En gutt' : 'Ei jente'} på ${rng.int(29, 42) / 10} kg.`,
    'milestone',
    adopted ? 'Adopsjon' : 'Ny baby',
    'baby',
  );
  return baby;
}

export function familyMembers(s: GameState): Relationship[] {
  return relsOf(s, FAMILY_KINDS, true);
}

export function newFriend(sim: Sim, ageOffset = 0): Person {
  const { s, rng } = sim;
  const me = player(s);
  const age = playerAge(s);
  const npcAge = Math.max(0, age + ageOffset + rng.int(-2, 2));
  const p = createPerson(s, rng, { birthYear: s.year - npcAge, city: me.city, education: npcAge >= 19 ? 'upperSecondary' : 'none' });
  addRelationship(s, p.id, 'friend', { strength: rng.int(45, 65), trust: rng.int(40, 60), loyalty: rng.int(30, 80) });
  return p;
}

export function idForInteraction(s: GameState): string {
  return newId(s, 'int');
}
