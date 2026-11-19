import { nb, type I18nKey } from './nb';

const dictionaries: Record<string, Record<I18nKey, string>> = { nb };
let locale = 'nb';

export function setLocale(l: string): void {
  if (dictionaries[l]) locale = l;
}

/** Translate a UI string with optional {var} interpolation. */
export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  const raw = dictionaries[locale][key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_m, k: string) => String(vars[k] ?? `{${k}}`));
}

export type { I18nKey };
