export const clamp = (v: number, min = 0, max = 100): number => Math.min(max, Math.max(min, v));
export const round = (v: number, step = 1): number => Math.round(v / step) * step;
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
export const avg = (xs: readonly number[]): number => (xs.length ? sum(xs) / xs.length : 0);
