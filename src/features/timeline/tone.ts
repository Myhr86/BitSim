import type { Tone } from '@/types/core';

/** Semantic colours for event tones (positive, negative, financial …). */
export function toneColor(tone: Tone): { fg: string; soft: string } {
  switch (tone) {
    case 'positive':
      return { fg: 'var(--pos)', soft: 'var(--pos-soft)' };
    case 'negative':
      return { fg: 'var(--neg)', soft: 'var(--neg-soft)' };
    case 'financial':
      return { fg: 'var(--gold)', soft: 'var(--gold-soft)' };
    case 'relationship':
      return { fg: 'var(--berry)', soft: 'var(--berry-soft)' };
    case 'milestone':
      return { fg: 'var(--violet)', soft: 'var(--violet-soft)' };
    default:
      return { fg: 'var(--muted)', soft: 'var(--surface-2)' };
  }
}

export const TONE_ICON: Record<Tone, string> = {
  positive: 'sparkles',
  negative: 'cloud-rain',
  neutral: 'circle',
  financial: 'coins',
  relationship: 'heart',
  milestone: 'star',
};
