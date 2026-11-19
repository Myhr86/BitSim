import type { GameState, Relationship, RelKind } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { clamp } from '@/utils/math';
import { addTx, ageOf, changeStat, log, partnerRel, player, playerAge, relsOf, type Sim } from '../simulation/helpers';
import { breakUp, compatibility, divorce, haveChild, marry } from './relationships';

export type InteractionId =
  | 'spendTime'
  | 'conversation'
  | 'compliment'
  | 'gift'
  | 'vacation'
  | 'argue'
  | 'askMoney'
  | 'collectDebt'
  | 'apologize'
  | 'flirt'
  | 'askOut'
  | 'propose'
  | 'tryForBaby'
  | 'adopt'
  | 'breakUp'
  | 'divorce'
  | 'reconcile'
  | 'insult'
  | 'cutContact';

export interface InteractionDef {
  id: InteractionId;
  label: string;
  icon: string;
  kinds: RelKind[] | 'all';
  minAge: number;
  cost?: number;
  danger?: boolean;
}

export const INTERACTIONS: InteractionDef[] = [
  { id: 'spendTime', label: 'Tilbring tid sammen', icon: 'coffee', kinds: 'all', minAge: 2 },
  { id: 'conversation', label: 'Ta en prat', icon: 'message-circle', kinds: 'all', minAge: 3 },
  { id: 'compliment', label: 'Gi et kompliment', icon: 'sparkles', kinds: 'all', minAge: 4 },
  { id: 'gift', label: 'Gi en gave', icon: 'gift', kinds: 'all', minAge: 6, cost: 1_500 },
  { id: 'vacation', label: 'Reis på ferie sammen', icon: 'plane', kinds: ['partner', 'spouse', 'bestFriend', 'friend', 'mother', 'father', 'sibling', 'child'], minAge: 18, cost: 25_000 },
  { id: 'flirt', label: 'Flørt', icon: 'heart', kinds: ['partner', 'spouse'], minAge: 14 },
  { id: 'askOut', label: 'Spør om dere skal bli kjærester', icon: 'heart-handshake', kinds: ['friend', 'bestFriend', 'coworker', 'ex'], minAge: 14 },
  { id: 'propose', label: 'Fri', icon: 'gem', kinds: ['partner'], minAge: 18, cost: 30_000 },
  { id: 'tryForBaby', label: 'Prøv å få barn', icon: 'baby', kinds: ['partner', 'spouse'], minAge: 18 },
  { id: 'adopt', label: 'Adopter et barn', icon: 'home', kinds: ['partner', 'spouse'], minAge: 25, cost: 200_000 },
  { id: 'askMoney', label: 'Be om penger', icon: 'hand-coins', kinds: ['mother', 'father', 'grandparent', 'sibling', 'spouse', 'bestFriend'], minAge: 10 },
  { id: 'collectDebt', label: 'Kreve tilbake lån', icon: 'receipt', kinds: 'all', minAge: 12 },
  { id: 'apologize', label: 'Be om unnskyldning', icon: 'hand-heart', kinds: 'all', minAge: 4 },
  { id: 'reconcile', label: 'Forsøk å forsones', icon: 'heart-handshake', kinds: 'all', minAge: 12 },
  { id: 'argue', label: 'Krangle', icon: 'flame', kinds: 'all', minAge: 4, danger: true },
  { id: 'insult', label: 'Fornærm', icon: 'angry', kinds: 'all', minAge: 6, danger: true },
  { id: 'breakUp', label: 'Slå opp', icon: 'heart-crack', kinds: ['partner'], minAge: 13, danger: true },
  { id: 'divorce', label: 'Be om skilsmisse', icon: 'heart-crack', kinds: ['spouse'], minAge: 18, danger: true },
  { id: 'cutContact', label: 'Bryt kontakten', icon: 'user-x', kinds: 'all', minAge: 16, danger: true },
];

export function availableInteractions(s: GameState, r: Relationship): InteractionDef[] {
  const age = playerAge(s);
  const npc = s.people[r.personId];
  if (!npc?.alive) return [];
  if (s.crime.prisonYearsLeft > 0) return INTERACTIONS.filter((i) => i.id === 'conversation' || i.id === 'apologize');
  return INTERACTIONS.filter((i) => {
    if (age < i.minAge) return false;
    if (i.kinds !== 'all' && !i.kinds.includes(r.kind)) return false;
    if (i.id === 'reconcile') return r.status === 'estranged' || r.kind === 'enemy' || r.kind === 'ex';
    if (r.status === 'estranged') return false;
    if (i.id === 'collectDebt') return r.owes > 0;
    if (i.id === 'askOut') {
      const npcAge = ageOf(s, npc);
      return !partnerRel(s) && Math.abs(npcAge - age) <= 15 && npcAge >= (age >= 18 ? 18 : 13) && genderFits(s, npc.gender);
    }
    if (i.id === 'tryForBaby') return canConceive(s);
    if (i.id === 'adopt') return age >= 25 && relsOf(s, 'child').length < 6;
    if (i.id === 'cutContact') return r.kind !== 'child' || ageOf(s, npc) >= 18;
    if (r.kind === 'enemy') return ['argue', 'insult', 'apologize', 'cutContact', 'reconcile'].includes(i.id);
    return true;
  });
}

function genderFits(s: GameState, g: 'male' | 'female'): boolean {
  return s.datingPreference === 'any' || s.datingPreference === g;
}

export function canConceive(s: GameState): boolean {
  const me = player(s);
  const pr = partnerRel(s);
  if (!pr) return false;
  const partner = s.people[pr.personId];
  if (!partner || partner.gender === me.gender) return false;
  const mother = me.gender === 'female' ? me : partner;
  const mAge = ageOf(s, mother);
  return mAge >= 18 && mAge <= 46 && playerAge(s) >= 18;
}

/** Diminishing returns: the more often you do something with someone this year, the less it helps. */
function dim(r: Relationship): number {
  return Math.pow(BALANCE.activities.diminishingFactor, r.interactions);
}

export interface InteractionResult {
  ok: boolean;
  text: string;
}

export function interact(sim: Sim, personId: string, id: InteractionId): InteractionResult {
  const { s, rng } = sim;
  const r = s.relationships[personId];
  const npc = s.people[personId];
  const me = player(s);
  if (!r || !npc || !npc.alive) return { ok: false, text: 'Personen er ikke tilgjengelig.' };
  const def = INTERACTIONS.find((i) => i.id === id);
  if (!def || !availableInteractions(s, r).some((i) => i.id === id)) return { ok: false, text: 'Ikke tilgjengelig.' };
  const cost = def.cost ? Math.round(def.cost * s.economy.priceIndex) : 0;
  if (cost > s.finances.cash) return { ok: false, text: 'Du har ikke råd.' };
  if (r.interactions >= 6) return { ok: false, text: `${npc.firstName} trenger litt pause fra deg i år.` };
  const d = dim(r);
  const comp = compatibility(me, npc);
  r.interactions += 1;
  const name = npc.firstName;
  let text = '';
  const bump = (str: number, trust = 0) => {
    r.strength = clamp(r.strength + str * (str > 0 ? d : 1));
    r.trust = clamp(r.trust + trust * (trust > 0 ? d : 1));
  };

  switch (id) {
    case 'spendTime': {
      const good = rng.chance(0.75 + comp * 0.15);
      bump(good ? rng.int(5, 10) : -rng.int(1, 4), good ? 2 : 0);
      changeStat(me, 'happiness', good ? 2 * d : -1);
      changeStat(me, 'stress', -1.5 * d);
      text = good ? `Du og ${name} hadde en fin dag sammen.` : `Stemningen med ${name} var litt anstrengt i dag.`;
      break;
    }
    case 'conversation': {
      bump(rng.int(2, 6), rng.int(1, 4));
      const topics = ['livet', 'jobben', 'gamle minner', 'været', 'fremtiden', 'politikk', 'en serie dere begge ser'];
      text = `Du og ${name} snakket lenge om ${rng.pick(topics)}.`;
      break;
    }
    case 'compliment': {
      bump(rng.int(2, 6));
      text = `${name} ble glad for komplimentet.`;
      break;
    }
    case 'gift': {
      addTx(s, -cost, 'gift', `Gave til ${name}`);
      const liked = rng.chance(0.7);
      bump(liked ? rng.int(6, 12) : rng.int(0, 3), liked ? 3 : 0);
      text = liked ? `${name} elsket gaven!` : `${name} takket høflig for gaven, men virket ikke overbegeistret.`;
      break;
    }
    case 'vacation': {
      addTx(s, -cost, 'activity', `Ferie med ${name}`);
      bump(rng.int(10, 18), 5);
      changeStat(me, 'happiness', 6 * d);
      changeStat(me, 'stress', -8 * d);
      const places = ['Lofoten', 'Roma', 'Kanariøyene', 'Berlin', 'Island', 'Kreta', 'New York', 'Thailand'];
      text = `Du og ${name} reiste til ${rng.pick(places)}. En uforglemmelig tur!`;
      if (r.kind === 'partner' || r.kind === 'spouse') r.attraction = clamp(r.attraction + 6);
      break;
    }
    case 'flirt': {
      r.attraction = clamp(r.attraction + rng.int(2, 7) * d);
      bump(rng.int(1, 5));
      text = `Du flørtet med ${name}. Det gnistret.`;
      break;
    }
    case 'askOut': {
      const chance = (r.strength / 100) * 0.5 + (me.stats.appearance / 100) * 0.35 + comp * 0.15 + (r.kind === 'ex' ? -0.1 : 0);
      if (rng.chance(chance)) {
        r.kind = 'partner';
        r.attraction = clamp(r.attraction + 40);
        bump(10);
        changeStat(me, 'happiness', 8);
        text = `${name} sa ja! Dere er kjærester nå.`;
        log(s, text, 'relationship', 'Forelsket', 'heart');
      } else {
        bump(-8);
        changeStat(me, 'happiness', -5);
        text = `${name} ville bare være venner. Au.`;
      }
      break;
    }
    case 'propose': {
      const chance = r.strength / 100 * 0.6 + r.attraction / 100 * 0.35 + (s.year - r.since) * 0.03 - 0.1;
      addTx(s, -cost, 'gift', 'Forlovelsesring');
      if (rng.chance(chance)) {
        const wedding = Math.round(rng.pick([40_000, 120_000, 250_000]) * s.economy.priceIndex);
        marry(sim, personId, Math.min(wedding, Math.max(0, s.finances.cash)));
        text = `${name} sa JA! Dere giftet dere i år.`;
      } else {
        bump(-15);
        r.attraction = clamp(r.attraction - 10);
        changeStat(me, 'happiness', -10);
        text = `${name} sa nei. Det ble en kjølig kveld.`;
        log(s, `Du fridde til ${name}, men fikk nei.`, 'negative', 'Avslag', 'heart-crack');
      }
      break;
    }
    case 'tryForBaby': {
      const mother = me.gender === 'female' ? me : npc;
      const mAge = ageOf(s, mother);
      const fert = mAge < 30 ? 0.55 : mAge < 35 ? 0.42 : mAge < 40 ? 0.25 : 0.08;
      if (rng.chance(fert)) {
        haveChild(sim);
        bump(6);
        text = 'Gratulerer! Dere har fått en baby.';
      } else {
        text = 'Det ble ingen baby denne gangen.';
        changeStat(me, 'stress', 2);
      }
      break;
    }
    case 'adopt': {
      addTx(s, -cost, 'event', 'Adopsjonsprosess');
      if (rng.chance(0.6)) {
        haveChild(sim, true);
        text = 'Adopsjonen ble godkjent!';
      } else {
        text = 'Adopsjonssøknaden ble satt på vent. Prøv igjen senere.';
      }
      break;
    }
    case 'askMoney': {
      const willing = r.strength / 100 * 0.7 + (npc.wealth > 500_000 ? 0.15 : 0);
      if (s.flags[`asked_${personId}`] === s.year) {
        text = `${name} minner deg om at du allerede spurte i år.`;
        bump(-4);
        break;
      }
      s.flags[`asked_${personId}`] = s.year;
      if (npc.wealth > 5_000 && rng.chance(willing)) {
        const amount = Math.round(Math.min(npc.wealth * 0.05, rng.int(1, 10) * 1_000 * s.economy.priceIndex * (playerAge(s) < 18 ? 0.3 : 1)));
        addTx(s, amount, 'gift', `Penger fra ${name}`);
        npc.wealth -= amount;
        bump(-2);
        text = `${name} ga deg ${amount.toLocaleString('nb-NO')} kr.`;
      } else {
        bump(-5);
        text = `${name} sa nei.`;
      }
      break;
    }
    case 'collectDebt': {
      if (rng.chance(r.trust / 100 * 0.6 + (npc.wealth > r.owes ? 0.3 : 0))) {
        addTx(s, r.owes, 'gift', `Tilbakebetaling fra ${name}`);
        npc.wealth -= r.owes;
        text = `${name} betalte tilbake ${r.owes.toLocaleString('nb-NO')} kr.`;
        r.owes = 0;
      } else {
        bump(-8, -6);
        text = `${name} har ikke pengene akkurat nå, og ble irritert over maset.`;
      }
      break;
    }
    case 'apologize': {
      bump(rng.int(3, 8), 3);
      text = `${name} godtok unnskyldningen.`;
      break;
    }
    case 'reconcile': {
      if (rng.chance(0.35 + comp * 0.2 + (me.traits.includes('kind') ? 0.15 : 0))) {
        r.status = 'active';
        if (r.kind === 'enemy') r.kind = 'friend';
        r.strength = Math.max(r.strength, 35);
        text = `Du og ${name} la det vonde bak dere.`;
        log(s, text, 'relationship', 'Forsoning', 'heart-handshake');
      } else {
        text = `${name} er ikke klar for å tilgi deg ennå.`;
      }
      break;
    }
    case 'argue': {
      bump(-rng.int(6, 14), -4);
      changeStat(me, 'stress', 3);
      text = `Du og ${name} kranglet høylytt.`;
      if (r.strength < 15 && r.kind === 'friend') {
        r.kind = 'enemy';
        text += ' Vennskapet er over.';
      }
      break;
    }
    case 'insult': {
      bump(-rng.int(10, 20), -10);
      changeStat(me, 'reputation', -2);
      text = `Du fornærmet ${name}. Det falt ikke i god jord.`;
      if (r.strength < 20 && !['mother', 'father', 'child', 'spouse', 'sibling'].includes(r.kind)) r.kind = 'enemy';
      break;
    }
    case 'breakUp': {
      breakUp(sim, personId);
      text = `Du slo opp med ${name}.`;
      break;
    }
    case 'divorce': {
      divorce(sim, personId);
      text = `Du og ${name} er skilt.`;
      break;
    }
    case 'cutContact': {
      if (['friend', 'coworker', 'enemy', 'ex'].includes(r.kind)) {
        delete s.relationships[personId];
      } else {
        r.status = 'estranged';
      }
      changeStat(me, 'stress', -2);
      text = `Du brøt kontakten med ${name}.`;
      log(s, text, 'relationship', undefined, 'user-x');
      break;
    }
  }
  return { ok: true, text };
}
