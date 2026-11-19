import type { CountryConfig } from './types';

/** Fictionalised, simplified Norway. Rules are inspired by, not identical to, real regulations. */
export const NORWAY: CountryConfig = {
  id: 'no',
  name: 'Norge',
  currency: 'NOK',
  locale: 'nb',
  cities: [
    { id: 'oslo', name: 'Oslo', size: 'capital', county: 'Oslo', priceFactor: 1.55, jobFactor: 1.15 },
    { id: 'bergen', name: 'Bergen', size: 'large', county: 'Vestland', priceFactor: 1.2, jobFactor: 1.05 },
    { id: 'trondheim', name: 'Trondheim', size: 'large', county: 'Trøndelag', priceFactor: 1.15, jobFactor: 1.05 },
    { id: 'stavanger', name: 'Stavanger', size: 'large', county: 'Rogaland', priceFactor: 1.15, jobFactor: 1.1 },
    { id: 'kristiansand', name: 'Kristiansand', size: 'medium', county: 'Agder', priceFactor: 1.0, jobFactor: 1.0 },
    { id: 'tromso', name: 'Tromsø', size: 'medium', county: 'Troms', priceFactor: 1.05, jobFactor: 1.0 },
    { id: 'drammen', name: 'Drammen', size: 'medium', county: 'Buskerud', priceFactor: 1.05, jobFactor: 1.0 },
    { id: 'fredrikstad', name: 'Fredrikstad', size: 'medium', county: 'Østfold', priceFactor: 0.95, jobFactor: 0.97 },
    { id: 'bodo', name: 'Bodø', size: 'medium', county: 'Nordland', priceFactor: 0.95, jobFactor: 0.97 },
    { id: 'alesund', name: 'Ålesund', size: 'medium', county: 'Møre og Romsdal', priceFactor: 0.95, jobFactor: 0.98 },
    { id: 'lillehammer', name: 'Lillehammer', size: 'small', county: 'Innlandet', priceFactor: 0.85, jobFactor: 0.92 },
    { id: 'hamar', name: 'Hamar', size: 'small', county: 'Innlandet', priceFactor: 0.85, jobFactor: 0.93 },
    { id: 'molde', name: 'Molde', size: 'small', county: 'Møre og Romsdal', priceFactor: 0.82, jobFactor: 0.92 },
    { id: 'alta', name: 'Alta', size: 'small', county: 'Finnmark', priceFactor: 0.75, jobFactor: 0.9 },
    { id: 'voss', name: 'Voss', size: 'small', county: 'Vestland', priceFactor: 0.8, jobFactor: 0.88 },
    { id: 'kongsberg', name: 'Kongsberg', size: 'small', county: 'Buskerud', priceFactor: 0.88, jobFactor: 0.97 },
  ],
  /** Typical price of a 60 m² apartment in a medium city at game start. */
  baseApartmentPrice: 3_200_000,
  militaryAge: 19,
  drivingAge: 18,
  schoolStartAge: 6,
  lowerSecondaryAge: 13,
  upperSecondaryAge: 16,
  adultAge: 18,
  retirementAge: 67,
  lifeExpectancy: 83,
  playableEras: [{ startYear: 2026, label: 'Nåtid', available: true }],
  plannedEras: [
    { startYear: 1900, label: '1900', available: false },
    { startYear: 1950, label: '1950', available: false },
    { startYear: 1990, label: '1990', available: false },
  ],
};
