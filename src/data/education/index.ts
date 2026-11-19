import type { EduLevel, FieldId } from '@/types/core';

export interface ProgramDef {
  id: string;
  name: string;
  level: EduLevel;
  field: FieldId;
  years: number;
  minAge: number;
  kind: 'compulsory' | 'secondary' | 'vocational' | 'higher' | 'doctoral';
  requires?: { level: EduLevel; minGrade?: number; fields?: FieldId[] };
  /** Final years paid as apprentice/PhD fellow (annual salary at start price level). */
  paid?: { fromYear: number; salary: number };
  minIntelligence?: number;
  description: string;
}

/** Simplified Norwegian education system. Grades use the 1–6 scale. */
export const PROGRAMS: ProgramDef[] = [
  { id: 'primary', name: 'Barneskole', level: 'primary', field: 'general', years: 7, minAge: 6, kind: 'compulsory', description: '1.–7. trinn' },
  { id: 'lower_secondary', name: 'Ungdomsskole', level: 'lowerSecondary', field: 'general', years: 3, minAge: 13, kind: 'compulsory', description: '8.–10. trinn' },
  { id: 'vgs_general', name: 'Studieforberedende', level: 'upperSecondary', field: 'general', years: 3, minAge: 16, kind: 'secondary', requires: { level: 'lowerSecondary' }, description: 'Generell studiekompetanse' },
  { id: 'vgs_electrician', name: 'Elektro (yrkesfag)', level: 'vocational', field: 'electrician', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 210_000 }, description: '2 år skole + 2 år lære' },
  { id: 'vgs_carpenter', name: 'Bygg og anlegg (yrkesfag)', level: 'vocational', field: 'carpenter', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 200_000 }, description: 'Tømrerfag med læretid' },
  { id: 'vgs_plumber', name: 'Rørleggerfag (yrkesfag)', level: 'vocational', field: 'plumber', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 205_000 }, description: 'Rørleggerfag med læretid' },
  { id: 'vgs_mechanic', name: 'Teknologi og industri (yrkesfag)', level: 'vocational', field: 'mechanic', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 195_000 }, description: 'Mekaniske fag med læretid' },
  { id: 'vgs_chef', name: 'Restaurant og matfag (yrkesfag)', level: 'vocational', field: 'chef', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 185_000 }, description: 'Kokkefag med læretid' },
  { id: 'vgs_health', name: 'Helse- og oppvekstfag (yrkesfag)', level: 'vocational', field: 'healthworker', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 190_000 }, description: 'Helsefagarbeider med læretid' },
  { id: 'vgs_hair', name: 'Frisørfag (yrkesfag)', level: 'vocational', field: 'hairdresser', years: 4, minAge: 16, kind: 'vocational', requires: { level: 'lowerSecondary' }, paid: { fromYear: 2, salary: 175_000 }, description: 'Frisørfag med læretid' },

  { id: 'ba_it', name: 'Bachelor i informatikk', level: 'bachelor', field: 'it', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.0 }, minIntelligence: 50, description: 'Programmering og systemutvikling' },
  { id: 'ba_engineering', name: 'Bachelor i ingeniørfag', level: 'bachelor', field: 'engineering', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.0 }, minIntelligence: 50, description: 'Ingeniørutdanning' },
  { id: 'ba_business', name: 'Bachelor i økonomi og ledelse', level: 'bachelor', field: 'business', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 3.8 }, description: 'Økonomi, regnskap og ledelse' },
  { id: 'ba_nursing', name: 'Bachelor i sykepleie', level: 'bachelor', field: 'health', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 3.9 }, description: 'Sykepleierutdanning' },
  { id: 'ba_kindergarten', name: 'Barnehagelærerutdanning', level: 'bachelor', field: 'education', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 3.5 }, description: 'Pedagogikk for de minste' },
  { id: 'ba_social', name: 'Bachelor i sosialt arbeid', level: 'bachelor', field: 'social', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 3.8 }, description: 'Sosionomutdanning' },
  { id: 'ba_arts', name: 'Bachelor i kunst og design', level: 'bachelor', field: 'arts', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 3.5 }, description: 'Kreative fag' },
  { id: 'ba_science', name: 'Bachelor i realfag', level: 'bachelor', field: 'science', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.0 }, minIntelligence: 55, description: 'Biologi, kjemi og fysikk' },
  { id: 'ba_police', name: 'Politihøgskolen', level: 'bachelor', field: 'police', years: 3, minAge: 19, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.0 }, description: 'Politiutdanning (krever rent rulleblad)' },
  { id: 'ba_military', name: 'Krigsskolen', level: 'bachelor', field: 'military', years: 3, minAge: 19, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.0 }, description: 'Offisersutdanning' },
  { id: 'ba_media', name: 'Bachelor i journalistikk', level: 'bachelor', field: 'social', years: 3, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.2 }, description: 'Journalistikk og medier' },

  { id: 'ma_medicine', name: 'Profesjonsstudiet i medisin', level: 'master', field: 'medicine', years: 6, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 5.6 }, minIntelligence: 65, description: 'Legeutdanning' },
  { id: 'ma_law', name: 'Master i rettsvitenskap', level: 'master', field: 'law', years: 5, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 5.0 }, minIntelligence: 58, description: 'Juss' },
  { id: 'ma_psychology', name: 'Profesjonsstudiet i psykologi', level: 'master', field: 'psychology', years: 6, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 5.5 }, minIntelligence: 62, description: 'Psykologutdanning' },
  { id: 'ma_teacher', name: 'Lektorutdanning', level: 'master', field: 'education', years: 5, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 4.2 }, description: 'Grunnskolelærer / lektor' },
  { id: 'ma_civeng', name: 'Sivilingeniør', level: 'master', field: 'engineering', years: 5, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 5.0 }, minIntelligence: 60, description: 'Teknologistudiet' },
  { id: 'ma_dentistry', name: 'Master i odontologi', level: 'master', field: 'health', years: 5, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 5.4 }, minIntelligence: 60, description: 'Tannlegeutdanning' },
  { id: 'ma_vet', name: 'Veterinærstudiet', level: 'master', field: 'science', years: 6, minAge: 18, kind: 'higher', requires: { level: 'upperSecondary', minGrade: 5.6 }, minIntelligence: 60, description: 'Veterinærmedisin' },

  { id: 'ma_business', name: 'Master i økonomi', level: 'master', field: 'business', years: 2, minAge: 21, kind: 'higher', requires: { level: 'bachelor', minGrade: 3.8, fields: ['business'] }, description: 'Siviløkonom' },
  { id: 'ma_it', name: 'Master i informatikk', level: 'master', field: 'it', years: 2, minAge: 21, kind: 'higher', requires: { level: 'bachelor', minGrade: 3.8, fields: ['it', 'engineering', 'science'] }, description: 'Videregående informatikk' },
  { id: 'ma_science', name: 'Master i realfag', level: 'master', field: 'science', years: 2, minAge: 21, kind: 'higher', requires: { level: 'bachelor', minGrade: 3.8, fields: ['science', 'engineering'] }, description: 'Fordypning i naturvitenskap' },
  { id: 'ma_arts', name: 'Master i arkitektur', level: 'master', field: 'arts', years: 2, minAge: 21, kind: 'higher', requires: { level: 'bachelor', minGrade: 4.0, fields: ['arts', 'engineering'] }, description: 'Arkitektur og design' },
  { id: 'ma_social', name: 'Master i samfunnsvitenskap', level: 'master', field: 'social', years: 2, minAge: 21, kind: 'higher', requires: { level: 'bachelor', minGrade: 3.8, fields: ['social', 'business', 'education'] }, description: 'Statsvitenskap og samfunnsfag' },
  { id: 'ma_pharmacy', name: 'Master i farmasi', level: 'master', field: 'science', years: 2, minAge: 21, kind: 'higher', requires: { level: 'bachelor', minGrade: 4.2, fields: ['science', 'health'] }, description: 'Farmasøytutdanning' },

  { id: 'phd', name: 'Doktorgrad (ph.d.)', level: 'phd', field: 'science', years: 3, minAge: 23, kind: 'doctoral', requires: { level: 'master', minGrade: 4.5 }, paid: { fromYear: 0, salary: 532_000 }, minIntelligence: 68, description: 'Forskerutdanning som stipendiat' },
];

const BY_ID: Record<string, ProgramDef> = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

export function getProgram(id: string): ProgramDef | undefined {
  return BY_ID[id];
}

export function gradeFromPerformance(perf: number): number {
  // 0..100 -> 1..6, with a slight curve so 6 is hard to reach.
  const g = 1 + 5 * Math.pow(Math.max(0, Math.min(100, perf)) / 100, 1.1);
  return Math.round(g * 10) / 10;
}
