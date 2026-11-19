import type { Effect, EventDef, OutcomeDef } from '@/types/events';
import { getProgram } from '@/data/education';
import { getAssetDef } from '@/data/assets';
import { getConditionDef, getAddictionDef } from '@/data/health';
import { STATIC_TEMPLATE_KEYS, templateKeys } from './template';

/**
 * Validates the event content library: unique ids, sane ages and weights, valid
 * references (follow-ups, programmes, assets, conditions) and template variables.
 * Returns a list of human-readable problems (empty = valid).
 */
export function validateEventLibrary(events: EventDef[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const byId = new Map(events.map((e) => [e.id, e]));
  for (const e of events) {
    const where = `[${e.id}]`;
    if (ids.has(e.id)) problems.push(`${where} duplicate id`);
    ids.add(e.id);
    if (!e.title.trim() || !e.text.trim()) problems.push(`${where} missing title/text`);
    if (e.minAge < 0 || e.maxAge < e.minAge || e.maxAge > 125) problems.push(`${where} invalid age range`);
    if (e.weight < 0) problems.push(`${where} negative weight`);
    if (!e.scheduledOnly && !e.priority && e.weight === 0) problems.push(`${where} zero weight but not scheduled`);
    const hasChoices = !!e.choices?.length;
    const hasOutcomes = !!e.outcomes?.length;
    if (!hasChoices && !hasOutcomes) problems.push(`${where} has neither choices nor outcomes`);
    const varKeys = Object.keys(e.vars ?? {});
    const allowedKeys = new Set([...STATIC_TEMPLATE_KEYS, ...varKeys, 'newPerson']);
    const checkText = (text: string, ctx: string) => {
      for (const k of templateKeys(text)) if (!allowedKeys.has(k)) problems.push(`${where} ${ctx}: unknown template key {${k}}`);
      if (/\{(target|targetHe|targetHim|targetFull)\}/.test(text) && !e.target && !e.scheduledOnly) problems.push(`${where} ${ctx}: uses {target} without target spec`);
    };
    checkText(e.title, 'title');
    checkText(e.text, 'text');
    const checkOutcomes = (outs: OutcomeDef[], ctx: string) => {
      if (outs.length === 0) problems.push(`${where} ${ctx}: no outcomes`);
      for (const o of outs) {
        if ((o.weight ?? 1) <= 0) problems.push(`${where} ${ctx}: non-positive outcome weight`);
        checkText(o.text, ctx);
        checkEffects(o.effects, `${ctx}`);
      }
    };
    const checkEffects = (effects: Effect[], ctx: string) => {
      for (const fx of effects) {
        switch (fx.t) {
          case 'schedule':
            if (!byId.has(fx.eventId)) problems.push(`${where} ${ctx}: schedules unknown event ${fx.eventId}`);
            if (fx.years < 1) problems.push(`${where} ${ctx}: schedule must be ≥ 1 year`);
            break;
          case 'delayed':
            if (fx.years < 1) problems.push(`${where} ${ctx}: delayed must be ≥ 1 year`);
            checkEffects(fx.effects, `${ctx} (delayed)`);
            break;
          case 'enroll':
            if (!getProgram(fx.programId)) problems.push(`${where} ${ctx}: unknown programme ${fx.programId}`);
            break;
          case 'gainAsset':
            if (!getAssetDef(fx.catalogId)) problems.push(`${where} ${ctx}: unknown asset ${fx.catalogId}`);
            break;
          case 'addCondition':
          case 'removeCondition':
            if (!getConditionDef(fx.id)) problems.push(`${where} ${ctx}: unknown condition ${fx.id}`);
            break;
          case 'addiction':
            if (!getAddictionDef(fx.id)) problems.push(`${where} ${ctx}: unknown addiction ${fx.id}`);
            break;
          case 'moneyVar':
          case 'lend':
          case 'inheritance':
            if (!varKeys.includes(fx.v)) problems.push(`${where} ${ctx}: unknown var ${fx.v}`);
            break;
          case 'rel':
          case 'npcStat':
          case 'npcWealth':
          case 'npcDie':
          case 'endRel':
          case 'promoteRel':
            if (fx.target === 'bound' && !e.target && !e.scheduledOnly) problems.push(`${where} ${ctx}: bound target without target spec`);
            break;
          case 'stat':
            if (Math.abs(fx.delta) > 30) problems.push(`${where} ${ctx}: stat delta too large`);
            break;
          default:
            break;
        }
      }
    };
    if (e.outcomes) checkOutcomes(e.outcomes, 'auto');
    e.choices?.forEach((c, i) => {
      if (!c.label.trim()) problems.push(`${where} choice ${i}: empty label`);
      checkText(c.label, `choice ${i}`);
      if (typeof c.requiresMoney === 'string' && !varKeys.includes(c.requiresMoney)) problems.push(`${where} choice ${i}: cost var missing`);
      checkOutcomes(c.outcomes, `choice ${i}`);
    });
    if (hasChoices && e.choices && e.choices.every((c) => c.conditions && c.conditions.length > 0)) problems.push(`${where} every choice is conditional – player could be stuck`);
  }
  return problems;
}
