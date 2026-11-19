import type { GameState } from '@/types/game';
import { getCity } from '@/data/countries';
import { occupationTitle } from '@/data/occupations';
import { formatNOK } from '@/utils/format';
import { firstRel, partnerRel, player } from '../simulation/helpers';

export type TemplateContext = Record<string, string>;

/** Builds the variables available to event text: {name}, {friend}, {partner}, {amount} … */
export function buildContext(s: GameState, boundPersonId: string | undefined, vars: Record<string, number>): TemplateContext {
  const p = player(s);
  const nameOf = (id?: string) => (id && s.people[id] ? s.people[id].firstName : '');
  const ctx: TemplateContext = {
    name: p.firstName,
    fullName: `${p.firstName} ${p.lastName}`,
    lastName: p.lastName,
    city: getCity(s.countryId, p.city).name,
    job: s.career.job ? occupationTitle(s.career.job.occupationId, s.career.job.level).toLowerCase() : 'arbeidsledig',
    company: s.career.job?.company ?? '',
    mother: nameOf(firstRel(s, 'mother')?.personId) || 'mamma',
    father: nameOf(firstRel(s, 'father')?.personId) || 'pappa',
    sibling: nameOf(firstRel(s, 'sibling')?.personId) || 'søsknet ditt',
    friend: nameOf(firstRel(s, 'bestFriend')?.personId ?? firstRel(s, 'friend')?.personId) || 'en venn',
    partner: nameOf(partnerRel(s)?.personId) || 'kjæresten din',
    child: nameOf(firstRel(s, 'child')?.personId) || 'barnet ditt',
    boss: nameOf(firstRel(s, 'boss')?.personId) || 'sjefen',
    coworker: nameOf(firstRel(s, 'coworker')?.personId) || 'en kollega',
    target: nameOf(boundPersonId) || 'en bekjent',
  };
  if (boundPersonId && s.people[boundPersonId]) {
    const t = s.people[boundPersonId];
    ctx.targetFull = `${t.firstName} ${t.lastName}`;
    ctx.targetHe = t.gender === 'male' ? 'han' : 'hun';
    ctx.targetHim = t.gender === 'male' ? 'ham' : 'henne';
  }
  for (const [k, v] of Object.entries(vars)) ctx[k] = formatNOK(v);
  return ctx;
}

export function renderTemplate(text: string, ctx: TemplateContext): string {
  return text.replace(/\{(\w+)\}/g, (_m, key: string) => ctx[key] ?? `{${key}}`);
}

/** Returns template keys used in a text (for validation). */
export function templateKeys(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}

export const STATIC_TEMPLATE_KEYS = [
  'name', 'fullName', 'lastName', 'city', 'job', 'company', 'mother', 'father', 'sibling', 'friend',
  'partner', 'child', 'boss', 'coworker', 'target', 'targetFull', 'targetHe', 'targetHim',
];
