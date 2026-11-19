import type { AssetKind } from '@/types/game';

export interface AssetDef {
  id: string;
  kind: AssetKind;
  name: string;
  /** Base price at start-of-save price level; property is further multiplied by city factor. */
  price: number;
  /** Annual maintenance as a fraction of value. */
  maintenance: number;
  insurance: number;
  /** Expected annual value change (before market). Negative = depreciation. */
  drift: number;
  /** Follows the housing market. */
  property: boolean;
  /** Potential annual rental income as a fraction of value. */
  rentYield?: number;
  happiness: number;
  minAge: number;
  /** Reputation/appearance boost while owned. */
  prestige?: number;
  description: string;
}

export const ASSETS: AssetDef[] = [
  { id: 'studio', kind: 'apartment', name: 'Hybelleilighet (30 m²)', price: 2_300_000, maintenance: 0.006, insurance: 0.001, drift: 0, property: true, rentYield: 0.045, happiness: 3, minAge: 18, description: 'Liten, men din egen.' },
  { id: 'apartment', kind: 'apartment', name: 'Leilighet (60 m²)', price: 3_600_000, maintenance: 0.006, insurance: 0.001, drift: 0, property: true, rentYield: 0.042, happiness: 5, minAge: 18, description: 'To soverom og balkong.' },
  { id: 'penthouse', kind: 'apartment', name: 'Toppleilighet (120 m²)', price: 9_500_000, maintenance: 0.007, insurance: 0.0012, drift: 0, property: true, rentYield: 0.035, happiness: 9, minAge: 18, prestige: 4, description: 'Takterrasse og utsikt.' },
  { id: 'rowhouse', kind: 'house', name: 'Rekkehus', price: 5_200_000, maintenance: 0.008, insurance: 0.0012, drift: 0, property: true, rentYield: 0.038, happiness: 7, minAge: 18, description: 'Liten hage og egen inngang.' },
  { id: 'house', kind: 'house', name: 'Enebolig', price: 7_400_000, maintenance: 0.009, insurance: 0.0013, drift: 0, property: true, rentYield: 0.035, happiness: 9, minAge: 18, description: 'Romslig hus med hage.' },
  { id: 'villa', kind: 'house', name: 'Villa ved sjøen', price: 19_000_000, maintenance: 0.01, insurance: 0.0015, drift: 0, property: true, rentYield: 0.025, happiness: 12, minAge: 18, prestige: 8, description: 'Brygge og panoramautsikt.' },
  { id: 'cabin_mountain', kind: 'cabin', name: 'Fjellhytte', price: 2_900_000, maintenance: 0.01, insurance: 0.0015, drift: 0, property: true, rentYield: 0.03, happiness: 6, minAge: 18, description: 'Skiløyper rett utenfor døra.' },
  { id: 'cabin_coast', kind: 'cabin', name: 'Sjøhytte', price: 4_400_000, maintenance: 0.01, insurance: 0.0015, drift: 0, property: true, rentYield: 0.03, happiness: 7, minAge: 18, prestige: 2, description: 'Sommer, krabber og solnedganger.' },
  { id: 'rental_unit', kind: 'rental', name: 'Utleieleilighet', price: 3_100_000, maintenance: 0.008, insurance: 0.0012, drift: 0, property: true, rentYield: 0.055, happiness: 0, minAge: 18, description: 'Investeringsobjekt med leietaker.' },
  { id: 'rental_block', kind: 'rental', name: 'Bygård (8 enheter)', price: 26_000_000, maintenance: 0.01, insurance: 0.0015, drift: 0, property: true, rentYield: 0.058, happiness: 0, minAge: 21, prestige: 4, description: 'Stabil leieinntekt, mye vedlikehold.' },
  { id: 'farm', kind: 'farm', name: 'Småbruk', price: 5_800_000, maintenance: 0.012, insurance: 0.0015, drift: 0, property: true, rentYield: 0.04, happiness: 6, minAge: 18, description: 'Jord, låve og noen sauer.' },
  { id: 'commercial', kind: 'commercial', name: 'Næringslokale', price: 14_000_000, maintenance: 0.009, insurance: 0.0015, drift: 0, property: true, rentYield: 0.065, happiness: 0, minAge: 21, description: 'Butikklokale i sentrum.' },

  { id: 'used_car', kind: 'car', name: 'Bruktbil', price: 95_000, maintenance: 0.08, insurance: 0.1, drift: -0.12, property: false, happiness: 2, minAge: 18, description: 'Den starter som regel.' },
  { id: 'ev', kind: 'car', name: 'Elbil', price: 420_000, maintenance: 0.03, insurance: 0.03, drift: -0.13, property: false, happiness: 4, minAge: 18, description: 'Stille og effektiv.' },
  { id: 'suv', kind: 'car', name: 'Familie-SUV', price: 690_000, maintenance: 0.04, insurance: 0.03, drift: -0.14, property: false, happiness: 4, minAge: 18, description: 'Plass til både hund og ski.' },
  { id: 'sports_car', kind: 'car', name: 'Sportsbil', price: 1_900_000, maintenance: 0.05, insurance: 0.04, drift: -0.12, property: false, happiness: 7, minAge: 18, prestige: 4, description: 'Altfor rask for norske fartsgrenser.' },
  { id: 'motorcycle', kind: 'motorcycle', name: 'Motorsykkel', price: 160_000, maintenance: 0.05, insurance: 0.06, drift: -0.1, property: false, happiness: 4, minAge: 18, description: 'Frihet på to hjul.' },
  { id: 'dinghy', kind: 'boat', name: 'Snekke', price: 120_000, maintenance: 0.06, insurance: 0.04, drift: -0.06, property: false, happiness: 3, minAge: 16, description: 'Tøff-tøff ut til holmen.' },
  { id: 'motorboat', kind: 'boat', name: 'Motorbåt', price: 650_000, maintenance: 0.06, insurance: 0.04, drift: -0.09, property: false, happiness: 6, minAge: 18, description: 'Sommerens beste investering.' },
  { id: 'yacht', kind: 'boat', name: 'Seilbåt (40 fot)', price: 3_200_000, maintenance: 0.07, insurance: 0.03, drift: -0.07, property: false, happiness: 8, minAge: 18, prestige: 5, description: 'For deg som eier vinden.' },
  { id: 'watch', kind: 'luxury', name: 'Luksusklokke', price: 160_000, maintenance: 0.01, insurance: 0.01, drift: 0.02, property: false, happiness: 2, minAge: 18, prestige: 1, description: 'Tikker diskré mot deg.' },
  { id: 'art', kind: 'luxury', name: 'Maleri av kjent kunstner', price: 900_000, maintenance: 0.005, insurance: 0.01, drift: 0.03, property: false, happiness: 3, minAge: 18, prestige: 3, description: 'Kan stige i verdi – eller ikke.' },
  { id: 'jewelry', kind: 'luxury', name: 'Smykkesamling', price: 280_000, maintenance: 0.005, insurance: 0.015, drift: 0.01, property: false, happiness: 2, minAge: 18, prestige: 1, description: 'Glitrer i festlige lag.' },
];

const BY_ID: Record<string, AssetDef> = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

export function getAssetDef(id: string): AssetDef | undefined {
  return BY_ID[id];
}

export interface BusinessDef {
  id: string;
  name: string;
  startCost: number;
  /** Expected annual profit at level 1 as a fraction of start cost. */
  baseMargin: number;
  volatility: number;
  minAge: number;
  stat: 'intelligence' | 'appearance' | 'fitness' | 'discipline';
  description: string;
}

export const BUSINESSES: BusinessDef[] = [
  { id: 'cafe', name: 'Kaffebar', startCost: 650_000, baseMargin: 0.22, volatility: 0.35, minAge: 18, stat: 'discipline', description: 'Kaffe, kanelboller og lange dager.' },
  { id: 'consultancy', name: 'Konsulentselskap', startCost: 250_000, baseMargin: 0.6, volatility: 0.3, minAge: 22, stat: 'intelligence', description: 'Lav startkostnad, krever kompetanse.' },
  { id: 'craft', name: 'Håndverksbedrift', startCost: 500_000, baseMargin: 0.4, volatility: 0.25, minAge: 20, stat: 'discipline', description: 'Oppdrag finnes alltid – om du leverer.' },
  { id: 'webshop', name: 'Nettbutikk', startCost: 300_000, baseMargin: 0.35, volatility: 0.55, minAge: 18, stat: 'intelligence', description: 'Kan eksplodere – i begge retninger.' },
  { id: 'gym', name: 'Treningssenter', startCost: 1_800_000, baseMargin: 0.2, volatility: 0.3, minAge: 21, stat: 'fitness', description: 'Kapitalkrevende, men stabile medlemmer.' },
  { id: 'salon', name: 'Skjønnhetssalong', startCost: 450_000, baseMargin: 0.3, volatility: 0.3, minAge: 19, stat: 'appearance', description: 'Lojale kunder er alt.' },
  { id: 'tech_startup', name: 'Teknologi-startup', startCost: 1_200_000, baseMargin: 0.15, volatility: 0.9, minAge: 20, stat: 'intelligence', description: 'Høy risiko. Enorm oppside.' },
];

export function getBusinessDef(id: string): BusinessDef | undefined {
  return BUSINESSES.find((b) => b.id === id);
}
