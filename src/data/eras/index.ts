import type { EconomyPhase } from '@/types/game';

/**
 * Historical profiles. All money in data files is expressed at 2026 prices; an era sets
 * the price level the save starts at. Because a life spans decades, most historical
 * effects are looked up by the *current* calendar year (see the helpers below), not by
 * the start year.
 */
export interface EraDef {
  id: string;
  startYear: number;
  name: string;
  description: string;
  /** Consumer price level relative to 2026 (1 = 2026 prices). */
  priceLevel: number;
  /** Housing price level relative to 2026. */
  housingLevel: number;
  /** Shift applied to parents' education (negative = less education was common). */
  educationBias: number;
  icon: string;
}

export const ERAS: EraDef[] = [
  { id: '1900', startYear: 1900, name: 'Århundreskiftet', description: 'Utvandring til Amerika, elektrisk lys og unionsoppløsning. Tøft liv, høy dødelighet.', priceLevel: 0.017, housingLevel: 0.012, educationBias: -0.45, icon: 'flame' },
  { id: '1920', startYear: 1920, name: 'Mellomkrigstiden', description: 'Brennevinsforbud, radio og krakket. Du vokser opp mot okkupasjonen.', priceLevel: 0.03, housingLevel: 0.02, educationBias: -0.35, icon: 'radio' },
  { id: '1950', startYear: 1950, name: 'Gjenreisningen', description: 'Etterkrigsoptimisme, babyboom, TV og oljeeventyret i voksen alder.', priceLevel: 0.045, housingLevel: 0.03, educationBias: -0.22, icon: 'hammer' },
  { id: '1970', startYear: 1970, name: 'Oljealderen', description: 'Oljepenger, jappetid, bankkrise og internettets fødsel.', priceLevel: 0.11, housingLevel: 0.07, educationBias: -0.1, icon: 'factory' },
  { id: '1990', startYear: 1990, name: 'Nettgenerasjonen', description: 'Mobiltelefon, internett og finanskrise mens du blir voksen.', priceLevel: 0.37, housingLevel: 0.17, educationBias: -0.03, icon: 'smartphone' },
  { id: '2000', startYear: 2000, name: 'Millennium', description: 'Smarttelefoner, sosiale medier og pandemi i ungdommen.', priceLevel: 0.48, housingLevel: 0.28, educationBias: 0, icon: 'globe' },
  { id: '2026', startYear: 2026, name: 'Nåtid', description: 'Livet slik det er i dag – og fremtiden ingen kjenner.', priceLevel: 1, housingLevel: 1, educationBias: 0, icon: 'sparkles' },
];

export function getEraForStart(startYear: number): EraDef {
  return ERAS.find((e) => e.startYear === startYear) ?? ERAS[ERAS.length - 1];
}

const lerpTable = (table: [number, number][], year: number): number => {
  if (year <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [y1, v1] = table[i];
    const [y0, v0] = table[i - 1];
    if (year <= y1) return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
  }
  return table[table.length - 1][1];
};

/** Mortality multiplier by calendar year (living standards, hygiene, medicine). */
export function eraMortality(year: number): number {
  return lerpTable(
    [
      [1900, 2.7],
      [1920, 2.3],
      [1945, 1.9],
      [1960, 1.65],
      [1980, 1.38],
      [2000, 1.12],
      [2026, 1],
      [2060, 0.9],
    ],
    year,
  );
}

/** Extra mortality for children by calendar year (multiplies the child baseline). */
export function eraChildMortality(year: number): number {
  return lerpTable(
    [
      [1900, 18],
      [1930, 8],
      [1960, 2],
      [1990, 1.1],
      [2026, 1],
    ],
    year,
  );
}

/** Effectiveness of medical treatment by calendar year (0–1 scales treatment success). */
export function medicalEfficacy(year: number): number {
  return lerpTable(
    [
      [1900, 0.35],
      [1930, 0.5],
      [1950, 0.65],
      [1980, 0.85],
      [2005, 1],
      [2060, 1.1],
    ],
    year,
  );
}

/** Historical economic phases that override the random business cycle. */
const FORCED_PHASES: [number, number, EconomyPhase][] = [
  [1916, 1918, 'boom'],
  [1920, 1923, 'recession'],
  [1930, 1933, 'recession'],
  [1940, 1945, 'recession'],
  [1946, 1952, 'boom'],
  [1974, 1977, 'boom'],
  [1984, 1986, 'boom'],
  [1988, 1992, 'recession'],
  [2004, 2007, 'boom'],
  [2008, 2009, 'recession'],
  [2020, 2020, 'recession'],
];

export function historicalPhase(year: number): EconomyPhase | undefined {
  return FORCED_PHASES.find(([a, b]) => year >= a && year <= b)?.[2];
}

/** Living conditions (nutrition, housing, hard physical work) lower the health target. */
export function eraHealthPenalty(year: number): number {
  return lerpTable(
    [
      [1900, 12],
      [1930, 9],
      [1950, 5],
      [1975, 2],
      [2000, 0],
    ],
    year,
  );
}
