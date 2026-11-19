import { NORWAY } from './norway';
import type { CityDef, CountryConfig } from './types';

export const COUNTRIES: Record<string, CountryConfig> = { no: NORWAY };

export function getCountry(id: string): CountryConfig {
  const c = COUNTRIES[id];
  if (!c) throw new Error(`Unknown country ${id}`);
  return c;
}

export function getCity(countryId: string, cityId: string): CityDef {
  const country = getCountry(countryId);
  return country.cities.find((c) => c.id === cityId) ?? country.cities[0];
}

export type { CityDef, CountryConfig } from './types';
