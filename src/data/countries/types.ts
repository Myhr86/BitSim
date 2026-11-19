export type CitySize = 'small' | 'medium' | 'large' | 'capital';

export interface CityDef {
  id: string;
  name: string;
  size: CitySize;
  county: string;
  priceFactor: number;
  jobFactor: number;
}

export interface EraDef {
  startYear: number;
  label: string;
  available: boolean;
}

/** Data-driven country definition. Adding a country = adding one of these + a name pool. */
export interface CountryConfig {
  id: string;
  name: string;
  currency: string;
  locale: string;
  cities: CityDef[];
  baseApartmentPrice: number;
  militaryAge: number;
  drivingAge: number;
  schoolStartAge: number;
  lowerSecondaryAge: number;
  upperSecondaryAge: number;
  adultAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  playableEras: EraDef[];
  plannedEras: EraDef[];
}
