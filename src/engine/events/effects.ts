import type { Effect, RelTarget } from '@/types/events';
import type { Relationship } from '@/types/game';
import { getAssetDef } from '@/data/assets';
import { clamp } from '@/utils/math';
import { addTx, changeStat, firstRel, log, newId, partnerRel, player, playerAge, type Sim } from '../simulation/helpers';
import { createRomanticInterest, divorce, haveChild, marry, newFriend, startDating } from '../relationships/relationships';
import { addCondition, removeCondition } from '../health/health';
import { arrest, resolveTrial, detectionChance } from '../crime/crime';
import { endJob, retire } from '../careers/careers';
import { enroll } from '../education/education';
import { killNpc } from '../npcs/life';
import { createPerson, inheritGenetics } from '../npcs/factory';
import { renderTemplate, type TemplateContext } from './template';

export interface EffectContext {
  boundPersonId?: string;
  vars: Record<string, number>;
  tpl: TemplateContext;
  /** Extra text produced by effects (e.g. trial verdict) appended to the outcome. */
  notes: string[];
}

function resolveTarget(sim: Sim, target: RelTarget, ctx: EffectContext): Relationship | undefined {
  const { s } = sim;
  if (target === 'bound') return ctx.boundPersonId ? s.relationships[ctx.boundPersonId] : undefined;
  if (target === 'partner' || target === 'spouse') return partnerRel(s);
  if (target === 'friend') return firstRel(s, 'bestFriend') ?? firstRel(s, 'friend');
  return firstRel(s, target);
}

/** Applies a list of effects. All mutations go through the working copy in `sim`. */
export function applyEffects(sim: Sim, effects: Effect[], ctx: EffectContext): void {
  for (const e of effects) applyEffect(sim, e, ctx);
}

export function applyEffect(sim: Sim, e: Effect, ctx: EffectContext): void {
  const { s, rng } = sim;
  const p = player(s);
  const pi = s.economy.priceIndex;
  switch (e.t) {
    case 'stat':
      changeStat(p, e.key, e.delta);
      return;
    case 'money':
      addTx(s, e.amount * pi, e.amount >= 0 ? 'event' : 'event', e.label ?? (e.amount >= 0 ? 'Inntekt' : 'Utgift'));
      return;
    case 'moneyVar': {
      const v = ctx.vars[e.v] ?? 0;
      addTx(s, v * e.mult, 'event', e.label ?? (e.mult >= 0 ? 'Inntekt' : 'Utgift'));
      return;
    }
    case 'salaryPct': {
      const amount = s.career.job ? s.career.job.salary * e.pct : e.fallback * pi;
      addTx(s, amount, 'event', e.label ?? 'Utgift');
      return;
    }
    case 'flag':
      s.flags[e.key] = e.value ?? s.year;
      return;
    case 'unflag':
      delete s.flags[e.key];
      return;
    case 'count':
      s.flags[e.key] = (s.flags[e.key] ?? 0) + 1;
      return;
    case 'rel': {
      const r = resolveTarget(sim, e.target, ctx);
      if (!r) return;
      if (e.strength) r.strength = clamp(r.strength + e.strength);
      if (e.trust) r.trust = clamp(r.trust + e.trust);
      if (e.attraction) r.attraction = clamp(r.attraction + e.attraction);
      if (e.loyalty) r.loyalty = clamp(r.loyalty + e.loyalty);
      return;
    }
    case 'newRel': {
      if (e.kind === 'partner') {
        if (partnerRel(s)) return;
        const person = createRomanticInterest(sim);
        startDating(sim, person);
        ctx.tpl.newPerson = person.firstName;
        return;
      }
      if (e.kind === 'enemy' || e.kind === 'coworker') {
        const npc = createPerson(s, rng, { birthYear: s.year - playerAge(s) + rng.int(-3, 3), city: p.city });
        s.relationships[npc.id] = {
          personId: npc.id,
          kind: e.kind,
          strength: e.kind === 'enemy' ? 10 : 40,
          trust: e.kind === 'enemy' ? 5 : 40,
          attraction: 0,
          loyalty: 30,
          since: s.year,
          status: 'active',
          interactions: 0,
          owes: 0,
        };
        ctx.tpl.newPerson = npc.firstName;
        return;
      }
      const f = newFriend(sim, e.ageOffset ?? 0);
      if (e.kind === 'bestFriend') {
        s.relationships[f.id].kind = 'bestFriend';
        s.relationships[f.id].strength = 75;
      }
      ctx.tpl.newPerson = f.firstName;
      return;
    }
    case 'promoteRel': {
      const r = resolveTarget(sim, e.target, ctx);
      if (r) r.kind = e.kind;
      return;
    }
    case 'endRel': {
      const r = resolveTarget(sim, e.target, ctx);
      if (!r) return;
      if (e.to === 'remove') delete s.relationships[r.personId];
      else if (e.to === 'ex') {
        if (r.kind === 'spouse') divorce(sim, r.personId);
        else {
          r.kind = 'ex';
          r.strength = Math.min(r.strength, 20);
        }
      } else r.status = 'estranged';
      return;
    }
    case 'lend': {
      const r = resolveTarget(sim, e.target, ctx);
      const amount = Math.round((ctx.vars[e.v] ?? 0) * e.mult);
      if (!r) return;
      addTx(s, -amount, 'gift', `Lån til ${s.people[r.personId]?.firstName ?? 'venn'}`);
      r.owes += amount;
      return;
    }
    case 'npcStat': {
      const r = resolveTarget(sim, e.target, ctx);
      const npc = r ? s.people[r.personId] : undefined;
      if (npc) npc.stats[e.key] = clamp(npc.stats[e.key] + e.delta);
      return;
    }
    case 'npcWealth': {
      const r = resolveTarget(sim, e.target, ctx);
      const npc = r ? s.people[r.personId] : undefined;
      if (npc) npc.wealth = Math.max(0, npc.wealth + e.amount * pi);
      return;
    }
    case 'npcDie': {
      const r = resolveTarget(sim, e.target, ctx);
      const npc = r ? s.people[r.personId] : undefined;
      if (npc && npc.alive) killNpc(sim, npc, e.cause);
      return;
    }
    case 'addCondition':
      addCondition(sim, e.id, e.severity);
      return;
    case 'removeCondition':
      removeCondition(s, e.id);
      return;
    case 'addiction': {
      const cur = s.health.addictions[e.id] ?? 0;
      const next = clamp(cur + e.delta);
      if (next <= 0) delete s.health.addictions[e.id];
      else s.health.addictions[e.id] = next;
      return;
    }
    case 'debt': {
      const amount = Math.round(e.amount * pi);
      s.finances.cash += amount;
      const existing = s.finances.debts.find((d) => d.kind === e.kind && d.label === e.label);
      if (existing) existing.principal += amount;
      else
        s.finances.debts.push({
          id: newId(s, 'd'),
          kind: e.kind,
          label: e.label,
          principal: amount,
          rate: e.kind === 'consumer' ? 0.19 : e.kind === 'student' ? 0.045 : 0.08,
          termYears: e.kind === 'consumer' ? 5 : 10,
        });
      return;
    }
    case 'crime': {
      const chance = detectionChance(e.severity, p.stats.intelligence, p.stats.discipline, s.crime.records.length);
      if (rng.chance(chance)) arrest(sim, e.crime, e.severity);
      else s.crime.successfulCrimes += 1;
      return;
    }
    case 'trial':
      ctx.notes.push(resolveTrial(sim, e.mode));
      return;
    case 'prisonTime':
      s.crime.prisonYearsLeft = Math.max(0, s.crime.prisonYearsLeft + e.delta);
      return;
    case 'loseJob':
      endJob(sim, e.reason);
      return;
    case 'performance':
      if (s.career.job) s.career.job.performance = clamp(s.career.job.performance + e.delta);
      return;
    case 'schoolPerf':
      if (s.education.current) s.education.current.performance = clamp(s.education.current.performance + e.delta);
      return;
    case 'schedule':
      s.scheduled.push({ id: newId(s, 'sch'), dueYear: s.year + e.years, eventId: e.eventId, boundPersonId: ctx.boundPersonId });
      return;
    case 'delayed':
      s.scheduled.push({
        id: newId(s, 'sch'),
        dueYear: s.year + e.years,
        effectsJson: JSON.stringify(e.effects),
        text: renderTemplate(e.text, ctx.tpl),
        tone: e.tone,
        boundPersonId: ctx.boundPersonId,
      });
      return;
    case 'milestone':
      s.milestones.push({ kind: e.kind, text: '' });
      return;
    case 'baby':
      haveChild(sim);
      return;
    case 'marry': {
      const r = partnerRel(s);
      if (r && r.kind === 'partner') marry(sim, r.personId, 0);
      return;
    }
    case 'divorce': {
      const r = firstRel(s, 'spouse');
      if (r) divorce(sim, r.personId);
      return;
    }
    case 'moveOut':
      if (s.livingWithParents) {
        s.livingWithParents = false;
        s.flags.movedOut = s.year;
      }
      return;
    case 'gainAsset': {
      const def = getAssetDef(e.catalogId);
      if (!def) return;
      const value = Math.round(def.price * (def.property ? s.economy.housingIndex : pi));
      s.assets.push({
        id: newId(s, 'a'),
        catalogId: def.id,
        kind: def.kind,
        name: def.name,
        purchasePrice: 0,
        purchaseYear: s.year,
        value,
        condition: 70,
        residence: false,
        lastIncome: 0,
      });
      return;
    }
    case 'death':
      p.stats.health = 0;
      s.flags.forcedDeathCause = 1;
      s.flags[`cause_${e.cause}`] = 1;
      return;
    case 'military':
      s.career.militaryDone = true;
      if (e.serve) s.flags.militaryServed = s.year;
      return;
    case 'retire':
      retire(sim);
      return;
    case 'enroll':
      enroll(sim, e.programId, true);
      return;
    case 'license':
      s.flags.license = s.year;
      s.milestones.push({ kind: 'license', text: 'Du tok førerkortet.' });
      return;
    case 'adoptPet':
      s.flags.pet = s.year;
      return;
    case 'sibling':
      addYoungerSibling(sim);
      return;
    case 'inheritance': {
      const v = ctx.vars[e.v] ?? 0;
      addTx(s, v, 'inheritance', 'Arv');
      s.finances.inheritanceReceived += v;
      return;
    }
  }
}

export function logOutcome(sim: Sim, text: string, tone: Parameters<typeof log>[2], title?: string, icon?: string): void {
  log(sim.s, text, tone, title, icon);
}

/** A younger sibling is born into the player's family. */
export function addYoungerSibling(sim: Sim): void {
  const { s, rng } = sim;
  const p = player(s);
  const mother = p.motherId ? s.people[p.motherId] : undefined;
  const father = p.fatherId ? s.people[p.fatherId] : undefined;
  if (!mother?.alive || (mother && s.year - mother.birthYear > 45)) return;
  const baby = createPerson(s, rng, {
    birthYear: s.year,
    city: p.city,
    lastName: p.lastName,
    motherId: mother?.id,
    fatherId: father?.id,
    genetics: inheritGenetics(rng, mother, father),
  });
  mother?.childrenIds.push(baby.id);
  father?.childrenIds.push(baby.id);
  s.relationships[baby.id] = {
    personId: baby.id,
    kind: 'sibling',
    strength: 60,
    trust: 55,
    attraction: 0,
    loyalty: 70,
    since: s.year,
    status: 'active',
    interactions: 0,
    owes: 0,
  };
}
