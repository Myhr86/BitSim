import type { GameState } from '@/types/game';
import { playerAge, relsOf } from '../simulation/helpers';
import { netWorth } from '../assets/assets';
import { getAssetDef } from '@/data/assets';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  hidden?: boolean;
  /** Evaluated after every action and every year. */
  check: (s: GameState) => boolean;
  /** Unlocks a starting scenario when earned. */
  unlocksScenario?: string;
}

const real = (s: GameState, v: number) => v * s.economy.priceIndex;
const occ = (s: GameState, ids: string[]) =>
  (s.career.job && ids.includes(s.career.job.occupationId)) || s.career.pastJobs.some((j) => ids.includes(j.occupationId));
const dead = (s: GameState) => s.death !== null;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_breath', name: 'Velkommen til verden', description: 'Start ditt første liv.', icon: 'baby', check: () => true },
  { id: 'graduate', name: 'Studiekompetanse', description: 'Fullfør videregående eller fagbrev.', icon: 'graduation-cap', check: (s) => s.education.credentials.some((c) => c.level === 'upperSecondary' || c.level === 'vocational') },
  { id: 'bachelor', name: 'Bachelor', description: 'Fullfør en bachelorgrad.', icon: 'graduation-cap', check: (s) => s.education.credentials.some((c) => c.level === 'bachelor') },
  { id: 'doctorate', name: 'Doktor', description: 'Fullfør en doktorgrad.', icon: 'scroll', check: (s) => s.education.credentials.some((c) => c.level === 'phd'), unlocksScenario: 'prodigy' },
  { id: 'first_job', name: 'Første lønnsslipp', description: 'Få din første heltidsjobb.', icon: 'briefcase', check: (s) => s.career.totalYearsWorked >= 1 },
  { id: 'doctor', name: 'Dr. med.', description: 'Bli lege.', icon: 'stethoscope', check: (s) => occ(s, ['doctor', 'surgeon']) },
  { id: 'surgeon', name: 'Stødig hånd', description: 'Bli kirurg.', icon: 'scissors', check: (s) => occ(s, ['surgeon']) },
  { id: 'politician', name: 'Folkevalgt', description: 'Bli politiker.', icon: 'landmark', check: (s) => occ(s, ['politician', 'municipal_politician']) },
  { id: 'prime_minister', name: 'Statsminister', description: 'Nå toppen av politikken.', icon: 'crown', hidden: true, check: (s) => !!s.flags.primeMinister },
  { id: 'ceo', name: 'Toppsjef', description: 'Bli administrerende direktør.', icon: 'building-2', check: (s) => occ(s, ['ceo']) },
  { id: 'star', name: 'Stjerne', description: 'Nå toppen som artist, skuespiller eller utøver.', icon: 'star', hidden: true, check: (s) => !!s.career.job && ['musician', 'actor', 'athlete', 'influencer'].includes(s.career.job.occupationId) && s.career.job.level >= 2, unlocksScenario: 'talent' },
  { id: 'career_peak', name: 'På toppen', description: 'Nå øverste trinn på en karrierestige.', icon: 'trending-up', check: (s) => s.milestones.some((m) => m.kind === 'careerPeak') },
  { id: 'millionaire', name: 'Millionær', description: 'Få en nettoformue på 1 million kroner.', icon: 'gem', check: (s) => netWorth(s) >= real(s, 1_000_000), unlocksScenario: 'heir' },
  { id: 'multimillionaire', name: 'Mangemillionær', description: 'Få en nettoformue på 10 millioner kroner.', icon: 'gem', check: (s) => netWorth(s) >= real(s, 10_000_000) },
  { id: 'billionaire', name: 'Milliardær', description: 'Få en nettoformue på 1 milliard kroner.', icon: 'crown', hidden: true, check: (s) => netWorth(s) >= real(s, 1_000_000_000) },
  { id: 'homeowner', name: 'Egen nøkkel', description: 'Kjøp din første bolig.', icon: 'home', check: (s) => !!s.flags.firstHome },
  { id: 'landlord', name: 'Eiendomsmogul', description: 'Eie minst tre eiendommer samtidig.', icon: 'building', check: (s) => s.assets.filter((a) => getAssetDef(a.catalogId)?.property).length >= 3 },
  { id: 'cabin', name: 'Hytteliv', description: 'Eie en hytte.', icon: 'tent-tree', check: (s) => s.assets.some((a) => a.kind === 'cabin') },
  { id: 'entrepreneur', name: 'Gründer', description: 'Start en bedrift.', icon: 'rocket', check: (s) => (s.flags.businessesStarted ?? 0) >= 1 },
  { id: 'tycoon', name: 'Industribygger', description: 'Bygg en bedrift til nivå 5.', icon: 'factory', check: (s) => !!s.flags.bigBusiness },
  { id: 'married', name: 'Ja!', description: 'Gift deg.', icon: 'gem', check: (s) => (s.flags.marriages ?? 0) >= 1 },
  { id: 'serial_spouse', name: 'Tredje gang er lykkens gang', description: 'Gift deg tre ganger.', icon: 'heart', hidden: true, check: (s) => (s.flags.marriages ?? 0) >= 3 },
  { id: 'parent', name: 'Forelder', description: 'Få ditt første barn.', icon: 'baby', check: (s) => (s.flags.childrenBorn ?? 0) >= 1 },
  { id: 'big_family', name: 'Storfamilie', description: 'Ha fem eller flere barn.', icon: 'users', check: (s) => relsOf(s, 'child', true).length >= 5 },
  { id: 'grandparent', name: 'Besteforelder', description: 'Få et barnebarn.', icon: 'heart-handshake', check: (s) => (s.flags.grandchildren ?? 0) >= 1 },
  { id: 'centenarian', name: 'Hundreåring', description: 'Bli 100 år gammel.', icon: 'cake', check: (s) => playerAge(s) >= 100 },
  { id: 'ninety', name: 'Lang og god', description: 'Bli 90 år gammel.', icon: 'hourglass', check: (s) => playerAge(s) >= 90 },
  { id: 'survivor', name: 'Overlevende', description: 'Overlev en alvorlig sykdom.', icon: 'heart-pulse', check: (s) => s.health.survivedSerious >= 1 || (s.flags.survivedSerious ?? 0) >= 1 },
  { id: 'comeback', name: 'Comeback', description: 'Bli millionær etter å ha gått gjennom gjeldsordning.', icon: 'refresh-cw', hidden: true, check: (s) => s.finances.bankruptcies > 0 && netWorth(s) >= real(s, 1_000_000) },
  { id: 'bankrupt', name: 'Bunnen er nådd', description: 'Gå gjennom gjeldsordning.', icon: 'alert-triangle', hidden: true, check: (s) => s.finances.bankruptcies > 0 },
  { id: 'jailbird', name: 'Bak murene', description: 'Sitt i fengsel.', icon: 'lock', hidden: true, check: (s) => s.crime.totalPrisonYears > 0 },
  { id: 'reformed', name: 'Nytt blad', description: 'Bli løslatt og få en heltidsjobb igjen.', icon: 'sunrise', hidden: true, check: (s) => !!s.flags.released && !!s.career.job && !s.career.job.partTime },
  { id: 'clean', name: 'Rusfri', description: 'Kom deg ut av en avhengighet.', icon: 'shield-check', hidden: true, check: (s) => !!s.flags.recoveredAddiction },
  { id: 'lottery', name: 'Jackpot', description: 'Vinn storgevinsten i lotto.', icon: 'ticket', hidden: true, check: (s) => !!s.flags.lotteryWin },
  { id: 'soldier', name: 'Plikt kaller', description: 'Fullfør førstegangstjenesten.', icon: 'shield', check: (s) => !!s.flags.militaryServed },
  { id: 'globetrotter', name: 'Verdensborger', description: 'Reis til utlandet fem ganger.', icon: 'globe', check: (s) => (s.flags.trips ?? 0) >= 5 },
  { id: 'athlete_body', name: 'Toppform', description: 'Ha 95 i form.', icon: 'dumbbell', check: (s) => s.people[s.playerId].stats.fitness >= 95 },
  { id: 'genius', name: 'Geni', description: 'Ha 95 i intelligens.', icon: 'brain', check: (s) => s.people[s.playerId].stats.intelligence >= 95 },
  { id: 'zen', name: 'Indre ro', description: 'Ha 0 i stress som voksen.', icon: 'leaf', hidden: true, check: (s) => playerAge(s) >= 25 && s.people[s.playerId].stats.stress <= 0.5 },
  { id: 'happy_life', name: 'Et lykkelig liv', description: 'Dø med gjennomsnittlig lykke over 75.', icon: 'smile', check: (s) => dead(s) && (s.death?.summary.avgHappiness ?? 0) >= 75 },
  { id: 'legacy2', name: 'Arven lever', description: 'Fortsett som ditt barn.', icon: 'git-branch', check: (s) => s.generation >= 2 },
  { id: 'legacy5', name: 'Dynasti', description: 'Spill fem generasjoner i samme slekt.', icon: 'castle', check: (s) => s.generation >= 5, unlocksScenario: 'dynasty' },
  { id: 'young_death', name: 'For tidlig', description: 'Dø før du fyller 30.', icon: 'flower', hidden: true, check: (s) => dead(s) && (s.death?.age ?? 99) < 30 },
  { id: 'ten_friends', name: 'Populær', description: 'Ha ti venner samtidig.', icon: 'users', check: (s) => relsOf(s, ['friend', 'bestFriend']).length >= 10 },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Returns achievement ids newly earned in this state (not yet in `already`). */
export function evaluateAchievements(s: GameState, already: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (already.has(a.id)) continue;
    try {
      if (a.check(s)) out.push(a.id);
    } catch {
      // An achievement check must never break the game.
    }
  }
  return out;
}

export interface ScenarioDef {
  id: string;
  name: string;
  description: string;
  unlockedBy?: string;
}

export const SCENARIOS: ScenarioDef[] = [
  { id: 'standard', name: 'Vanlig start', description: 'Livet slik det kommer.' },
  { id: 'heir', name: 'Arving', description: 'Født inn i en svært velstående familie med en arv i vente.', unlockedBy: 'millionaire' },
  { id: 'prodigy', name: 'Vidunderbarn', description: 'Usedvanlig intelligent fra første dag.', unlockedBy: 'doctorate' },
  { id: 'talent', name: 'Født stjerne', description: 'Strålende utseende og naturlig karisma.', unlockedBy: 'star' },
  { id: 'dynasty', name: 'Dynasti', description: 'Stor familie med gode gener og lang levetid.', unlockedBy: 'legacy5' },
];
