import type { Condition, Effect, OutcomeDef } from '@/types/events';
import type { StatKey } from '@/types/core';

export type ActivityCategory =
  | 'health'
  | 'sports'
  | 'entertainment'
  | 'social'
  | 'dating'
  | 'travel'
  | 'shopping'
  | 'education'
  | 'personal'
  | 'hobbies'
  | 'medical'
  | 'cosmetic'
  | 'gambling'
  | 'business'
  | 'crime'
  | 'prison';

export interface ActivityDef {
  id: string;
  category: ActivityCategory;
  name: string;
  description: string;
  minAge: number;
  maxAge?: number;
  cost: number;
  limit: number;
  cooldown?: number;
  conditions?: Condition[];
  outcomes: OutcomeDef[];
  risky?: boolean;
}

export const ACTIVITY_CATEGORIES: { id: ActivityCategory; name: string; icon: string; minAge: number }[] = [
  { id: 'health', name: 'Helse og trening', icon: 'heart-pulse', minAge: 4 },
  { id: 'sports', name: 'Idrett', icon: 'trophy', minAge: 6 },
  { id: 'entertainment', name: 'Underholdning', icon: 'clapperboard', minAge: 3 },
  { id: 'social', name: 'Sosialt', icon: 'users', minAge: 6 },
  { id: 'dating', name: 'Dating', icon: 'heart', minAge: 15 },
  { id: 'travel', name: 'Reise', icon: 'plane', minAge: 16 },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', minAge: 12 },
  { id: 'education', name: 'Læring', icon: 'book-open', minAge: 6 },
  { id: 'personal', name: 'Personlig utvikling', icon: 'sprout', minAge: 12 },
  { id: 'hobbies', name: 'Hobbyer', icon: 'palette', minAge: 6 },
  { id: 'medical', name: 'Medisinsk', icon: 'stethoscope', minAge: 0 },
  { id: 'cosmetic', name: 'Kosmetisk', icon: 'sparkles', minAge: 18 },
  { id: 'gambling', name: 'Spill og lotteri', icon: 'dices', minAge: 18 },
  { id: 'business', name: 'Næringsliv', icon: 'briefcase', minAge: 18 },
  { id: 'crime', name: 'Kriminalitet', icon: 'skull', minAge: 12 },
  { id: 'prison', name: 'Fengselsliv', icon: 'lock', minAge: 15 },
];

const st = (key: StatKey, delta: number): Effect => ({ t: 'stat', key, delta });
const ok = (text: string, effects: Effect[], weight = 1): OutcomeDef => ({ text, effects, weight, tone: 'positive' });
const bad = (text: string, effects: Effect[], weight = 1): OutcomeDef => ({ text, effects, weight, tone: 'negative' });
const neu = (text: string, effects: Effect[], weight = 1): OutcomeDef => ({ text, effects, weight, tone: 'neutral' });
const notPrison: Condition = { t: 'inPrison', value: false };

export const ACTIVITIES: ActivityDef[] = [
  // ── Health & fitness ──
  { id: 'gym', category: 'health', name: 'Gå på treningssenter', description: 'Styrke og kondisjon.', minAge: 14, cost: 600, limit: 4, outcomes: [ok('Du tok en knallhard økt på treningssenteret.', [st('fitness', 5), st('health', 1.5), st('stress', -3), st('appearance', 0.7)], 8), bad('Du strakk en muskel og måtte ta det rolig.', [st('fitness', 1), st('health', -2)], 1)] },
  { id: 'run', category: 'health', name: 'Løpetur', description: 'Gratis og effektivt.', minAge: 8, cost: 0, limit: 4, outcomes: [ok('Du løp en lang tur langs vannet.', [st('fitness', 4), st('health', 1), st('stress', -3), st('happiness', 1)], 9), bad('Du tråkket over på en rot.', [st('health', -3)], 1)] },
  { id: 'walk', category: 'health', name: 'Gå tur i skogen', description: 'Frisk luft og ro.', minAge: 4, cost: 0, limit: 5, outcomes: [ok('Du gikk en lang tur i marka og fant roen.', [st('stress', -5), st('happiness', 2), st('fitness', 1.5), st('health', 0.5)])] },
  { id: 'yoga', category: 'health', name: 'Yoga', description: 'Smidighet og indre ro.', minAge: 12, cost: 250, limit: 3, outcomes: [ok('Etter yogatimen kjente du deg som et nytt menneske.', [st('stress', -6), st('fitness', 2), st('happiness', 2)])] },
  { id: 'diet', category: 'health', name: 'Legg om kostholdet', description: 'Mer grønnsaker, mindre godteri.', minAge: 14, cost: 3_000, limit: 1, outcomes: [ok('Du har spist sunt hele året.', [st('health', 4), st('appearance', 1.5), st('fitness', 1.5), st('discipline', 2)], 4), neu('Du sprakk etter tre uker og endte med pizza.', [st('happiness', 1)], 1)] },
  { id: 'meditate', category: 'health', name: 'Meditere', description: 'Pust inn. Pust ut.', minAge: 10, cost: 0, limit: 3, outcomes: [ok('Du mediterte og kjente stresset slippe.', [st('stress', -5), st('happiness', 1.5), st('discipline', 1)])] },
  { id: 'quit_smoking', category: 'health', name: 'Prøv å slutte å røyke', description: 'Fri fra nikotinen.', minAge: 14, cost: 1_500, limit: 1, conditions: [{ t: 'flag', key: 'smoker' }], outcomes: [ok('Du klarte det! Røyken er historie.', [{ t: 'addiction', id: 'smoking', delta: -100 }, { t: 'unflag', key: 'smoker' }, st('health', 3), st('happiness', 3)], 1), bad('Abstinensene vant denne gangen.', [{ t: 'addiction', id: 'smoking', delta: -10 }, st('stress', 4)], 2)] },

  // ── Sports ──
  { id: 'football', category: 'sports', name: 'Fotballtrening', description: 'Lagspill og konkurranse.', minAge: 6, maxAge: 45, cost: 400, limit: 3, outcomes: [ok('Du scoret på treningen og laget jublet.', [st('fitness', 4), st('happiness', 2), st('reputation', 1)], 5), neu('Treningen var tung, men nyttig.', [st('fitness', 3)], 3), bad('Du fikk en takling og vrikket ankelen.', [st('health', -4), { t: 'addCondition', id: 'broken_bone', severity: 30 }], 0.4)] },
  { id: 'skiing', category: 'sports', name: 'Langrenn', description: 'Født med ski på beina.', minAge: 4, cost: 300, limit: 3, outcomes: [ok('Du gikk fem mil i strålende vintersol.', [st('fitness', 5), st('health', 1.5), st('happiness', 2)], 8), bad('Du falt i en utforbakke og slo deg.', [st('health', -3)], 1)] },
  { id: 'alpine', category: 'sports', name: 'Alpint', description: 'Fart i bakken.', minAge: 6, cost: 2_000, limit: 2, outcomes: [ok('Puddersnø og blå himmel – en perfekt dag!', [st('happiness', 4), st('fitness', 2)], 8), bad('Du kjørte inn i et gjerde.', [{ t: 'addCondition', id: 'broken_bone', severity: 50 }, st('health', -6)], 1)] },
  { id: 'climbing', category: 'sports', name: 'Klatring', description: 'For deg uten høydeskrekk.', minAge: 10, cost: 500, limit: 2, outcomes: [ok('Du klarte den vanskeligste ruta i hallen!', [st('fitness', 4), st('discipline', 1.5), st('happiness', 2)], 8), bad('Du falt og slo hodet.', [{ t: 'addCondition', id: 'concussion', severity: 40 }], 0.5)] },
  { id: 'marathon', category: 'sports', name: 'Løp maraton', description: '42,195 km. Bare kos.', minAge: 18, cost: 1_200, limit: 1, conditions: [{ t: 'stat', key: 'fitness', min: 60 }], outcomes: [ok('Du fullførte maraton! Beina hater deg, hjertet elsker deg.', [st('fitness', 4), st('happiness', 6), st('discipline', 3), st('reputation', 2), { t: 'flag', key: 'marathon' }], 4), bad('Du brøt etter 30 km.', [st('happiness', -3), st('health', -2)], 1)] },
  { id: 'swim', category: 'sports', name: 'Svømming', description: 'Skånsomt for leddene.', minAge: 4, cost: 150, limit: 3, outcomes: [ok('Du svømte 2 km uten pause.', [st('fitness', 3.5), st('health', 1.5), st('stress', -2)])] },

  // ── Entertainment ──
  { id: 'cinema', category: 'entertainment', name: 'Gå på kino', description: 'Popcorn og storskjerm.', minAge: 5, cost: 200, limit: 4, outcomes: [ok('Filmen var helt fantastisk.', [st('happiness', 3), st('stress', -2)], 3), neu('Filmen var ... grei.', [st('happiness', 1)], 2)] },
  { id: 'concert', category: 'entertainment', name: 'Konsert', description: 'Musikk på sitt beste.', minAge: 12, cost: 900, limit: 3, outcomes: [ok('For en konsert! Du sang med på alt.', [st('happiness', 5), st('stress', -3)])] },
  { id: 'gaming', category: 'entertainment', name: 'Spill dataspill', description: 'Bare én runde til …', minAge: 6, cost: 0, limit: 4, outcomes: [ok('Du hadde en episk spillkveld.', [st('happiness', 3), st('stress', -2), st('fitness', -0.5)], 6), bad('Du spilte hele natten og var helt ødelagt neste dag.', [st('health', -1), st('discipline', -1), { t: 'addiction', id: 'gaming', delta: 8 }], 1)] },
  { id: 'party', category: 'entertainment', name: 'Gå på fest', description: 'Kvelden er ung.', minAge: 15, cost: 500, limit: 3, conditions: [notPrison], outcomes: [ok('Festen var legendarisk. Du ble kjent med noen nye.', [st('happiness', 4), st('reputation', 2), { t: 'newRel', kind: 'friend' }], 3), neu('Du danset til solen sto opp.', [st('happiness', 3), st('health', -1)], 3), bad('Du drakk altfor mye og angret dagen derpå.', [st('health', -3), st('reputation', -2), { t: 'addiction', id: 'alcohol', delta: 6 }], 1.5)] },
  { id: 'theatre', category: 'entertainment', name: 'Teater', description: 'Kultur med stor K.', minAge: 8, cost: 700, limit: 2, outcomes: [ok('Forestillingen rørte deg dypt.', [st('happiness', 3), st('intelligence', 1)])] },
  { id: 'netflix', category: 'entertainment', name: 'Seriemaraton', description: 'Sofaen kaller.', minAge: 6, cost: 0, limit: 3, outcomes: [neu('Du så en hel sesong på én helg.', [st('stress', -3), st('happiness', 1), st('fitness', -1)])] },

  // ── Social ──
  { id: 'meet_friends', category: 'social', name: 'Møt nye folk', description: 'Kanskje en ny venn?', minAge: 6, cost: 300, limit: 3, conditions: [notPrison], outcomes: [ok('Du fikk en ny venn: {newPerson}!', [{ t: 'newRel', kind: 'friend' }, st('happiness', 2)], 3), neu('Det ble mye småprat, men ingen ny venn denne gangen.', [st('reputation', 0.5)], 2)] },
  { id: 'volunteer', category: 'social', name: 'Frivillig arbeid', description: 'Gi noe tilbake.', minAge: 12, cost: 0, limit: 2, outcomes: [ok('Du hjalp til på matsentralen. Det ga mening.', [st('happiness', 3), st('reputation', 3), st('stress', -1)], 4), ok('Du ble kjent med {newPerson} gjennom dugnaden.', [{ t: 'newRel', kind: 'friend' }, st('reputation', 2)], 1)] },
  { id: 'club', category: 'social', name: 'Bli med i en forening', description: 'Korps, sjakk eller bridge?', minAge: 8, cost: 1_000, limit: 1, outcomes: [ok('Du ble med i foreningen og fant din flokk.', [st('happiness', 3), { t: 'newRel', kind: 'friend' }, st('reputation', 1)])] },
  { id: 'dugnad', category: 'social', name: 'Dugnad i nabolaget', description: 'Den norske nasjonalsporten.', minAge: 10, cost: 0, limit: 1, outcomes: [ok('Du malte gjerdet og fikk vafler. Naboene elsker deg.', [st('reputation', 3), st('happiness', 1)])] },

  // ── Dating ──
  { id: 'dating_app', category: 'dating', name: 'Bruk datingapp', description: 'Sveip til høyre.', minAge: 18, cost: 0, limit: 3, conditions: [{ t: 'rel', kind: ['partner', 'spouse'], max: 0 }, notPrison], outcomes: [ok('Du matchet med {newPerson}, og første date gikk strålende!', [{ t: 'newRel', kind: 'partner' }, st('happiness', 5)], 1.2), neu('Mange matcher, men ingen gnist.', [st('happiness', -1)], 1.5), bad('Du ble ghostet etter tre dates.', [st('happiness', -3), st('stress', 2)], 1)], },
  { id: 'blind_date', category: 'dating', name: 'Blind date', description: 'En venn kjenner noen …', minAge: 18, cost: 800, limit: 2, conditions: [{ t: 'rel', kind: ['partner', 'spouse'], max: 0 }, notPrison], outcomes: [ok('Blind daten {newPerson} var fantastisk. Dere avtalte en ny date!', [{ t: 'newRel', kind: 'partner' }, st('happiness', 5)], 1), bad('Kleint. Veldig kleint.', [st('happiness', -2)], 1.4)] },
  { id: 'teen_crush', category: 'dating', name: 'Snakk med crushen din', description: 'Hjertet hamrer.', minAge: 13, maxAge: 17, cost: 0, limit: 2, conditions: [{ t: 'rel', kind: ['partner', 'spouse'], max: 0 }], outcomes: [ok('Crushen likte deg også! Dere er sammen nå – {newPerson}.', [{ t: 'newRel', kind: 'partner' }, st('happiness', 6)], 1), bad('Du stammet og løp din vei.', [st('happiness', -3), st('reputation', -1)], 1.5)] },
  { id: 'speed_dating', category: 'dating', name: 'Speed dating', description: 'Fem minutter per person.', minAge: 20, cost: 450, limit: 1, conditions: [{ t: 'rel', kind: ['partner', 'spouse'], max: 0 }, notPrison], outcomes: [ok('Du klikket umiddelbart med {newPerson}.', [{ t: 'newRel', kind: 'partner' }, st('happiness', 4)], 1.1), neu('Hyggelige folk, men ingen gnister.', [], 1)] },

  // ── Travel ──
  { id: 'trip_norway', category: 'travel', name: 'Tur i Norge', description: 'Fjorder og fjell.', minAge: 16, cost: 8_000, limit: 2, conditions: [notPrison], outcomes: [ok('Du reiste langs vestlandsfjordene. Norge er vakkert!', [st('happiness', 5), st('stress', -5)])] },
  { id: 'trip_europe', category: 'travel', name: 'Storbyferie i Europa', description: 'Paris, Roma eller Barcelona.', minAge: 18, cost: 18_000, limit: 2, conditions: [notPrison], outcomes: [ok('En fantastisk storbyferie med god mat og kultur.', [st('happiness', 6), st('stress', -6), st('intelligence', 1), { t: 'count', key: 'trips' }], 6), bad('Lommeboka ble stjålet på første dag.', [st('happiness', -2), { t: 'money', amount: -5_000, label: 'Stjålet på ferie' }], 1)] },
  { id: 'trip_exotic', category: 'travel', name: 'Langtur til tropene', description: 'Strender og eventyr.', minAge: 18, cost: 45_000, limit: 1, conditions: [notPrison], outcomes: [ok('Tre uker med eventyr i Sørøst-Asia. Du kom hjem forandret.', [st('happiness', 9), st('stress', -10), { t: 'count', key: 'trips' }], 6), bad('Du fikk matforgiftning og lå på hotellrommet i en uke.', [st('health', -5), st('happiness', -2)], 1)] },
  { id: 'interrail', category: 'travel', name: 'Interrail', description: 'Europa på skinner.', minAge: 17, maxAge: 30, cost: 12_000, limit: 1, conditions: [notPrison], outcomes: [ok('En sommer med tog, hostels og nye venner – deriblant {newPerson}!', [st('happiness', 7), { t: 'newRel', kind: 'friend' }, { t: 'count', key: 'trips' }])] },
  { id: 'cabin_trip', category: 'travel', name: 'Hyttetur', description: 'Kvikk Lunsj og kortspill.', minAge: 4, cost: 1_500, limit: 2, conditions: [notPrison], outcomes: [ok('En klassisk hyttetur med peis, ski og kortspill.', [st('happiness', 4), st('stress', -5), st('fitness', 1)])] },

  // ── Shopping ──
  { id: 'clothes', category: 'shopping', name: 'Kjøp nye klær', description: 'Ny stil, ny deg.', minAge: 12, cost: 3_000, limit: 2, outcomes: [ok('Du fornyet garderoben og føler deg fresh.', [st('appearance', 2), st('happiness', 2)])] },
  { id: 'phone', category: 'shopping', name: 'Kjøp ny mobil', description: 'Siste modell.', minAge: 10, cost: 12_000, limit: 1, cooldown: 2, outcomes: [ok('Den nye mobilen er rask og skinnende.', [st('happiness', 3)])] },
  { id: 'splurge', category: 'shopping', name: 'Shoppingrus', description: 'Kortet går varmt.', minAge: 16, cost: 15_000, limit: 1, outcomes: [ok('Du kjøpte alt du hadde lyst på. Herlig – helt til regningen kom.', [st('happiness', 5), st('discipline', -2)])] },

  // ── Education / learning ──
  { id: 'study', category: 'education', name: 'Studer ekstra', description: 'Lekser og repetisjon.', minAge: 6, cost: 0, limit: 3, conditions: [{ t: 'student', value: true }], outcomes: [ok('Du pugget og forsto endelig stoffet.', [{ t: 'schoolPerf', delta: 6 }, st('intelligence', 1), st('stress', 2), st('discipline', 1)])] },
  { id: 'library', category: 'education', name: 'Gå på biblioteket', description: 'Bøker, bøker, bøker.', minAge: 6, cost: 0, limit: 3, outcomes: [ok('Du leste en bok du ikke klarte å legge fra deg.', [st('intelligence', 2), st('stress', -1)])] },
  { id: 'tutor', category: 'education', name: 'Privatlærer', description: 'Hjelp med skolearbeidet.', minAge: 8, cost: 6_000, limit: 1, conditions: [{ t: 'student', value: true }], outcomes: [ok('Privatlæreren hjalp deg et stort steg fram.', [{ t: 'schoolPerf', delta: 10 }, st('intelligence', 2)])] },
  { id: 'online_course', category: 'education', name: 'Nettkurs', description: 'Lær noe nytt i eget tempo.', minAge: 14, cost: 2_500, limit: 2, outcomes: [ok('Du fullførte et nettkurs i programmering.', [st('intelligence', 2), st('discipline', 1), { t: 'performance', delta: 3 }], 3), neu('Du ga opp halvveis.', [], 1)] },
  { id: 'language', category: 'education', name: 'Lær et nytt språk', description: '¡Hola!', minAge: 10, cost: 3_000, limit: 1, outcomes: [ok('Du kan nå føre en enkel samtale på spansk.', [st('intelligence', 3), st('reputation', 1)])] },

  // ── Personal development ──
  { id: 'journal', category: 'personal', name: 'Skriv dagbok', description: 'Tanker på papir.', minAge: 10, cost: 0, limit: 2, outcomes: [ok('Å skrive ned tankene hjalp.', [st('stress', -3), st('discipline', 1)])] },
  { id: 'therapy', category: 'personal', name: 'Gå til psykolog', description: 'Snakk om det.', minAge: 12, cost: 2_500, limit: 3, outcomes: [ok('Psykologen hjalp deg å se ting i et nytt lys.', [st('stress', -7), st('happiness', 3), { t: 'removeCondition', id: 'anxiety' }], 1), ok('Timen var tung, men nyttig.', [st('stress', -4), st('happiness', 1)], 2)] },
  { id: 'self_help', category: 'personal', name: 'Les selvhjelpsbok', description: '7 vaner for … noe.', minAge: 14, cost: 300, limit: 1, outcomes: [ok('Boken ga deg et par nyttige råd.', [st('discipline', 2)], 2), neu('Den var mest bare tull.', [], 1)] },
  { id: 'networking', category: 'personal', name: 'Bygg nettverk', description: 'Kaffe med de rette folkene.', minAge: 18, cost: 1_000, limit: 2, conditions: [notPrison], outcomes: [ok('Du knyttet verdifulle kontakter.', [st('reputation', 3), { t: 'flag', key: 'network' }, { t: 'performance', delta: 2 }])] },
  { id: 'public_speaking', category: 'personal', name: 'Kurs i å holde foredrag', description: 'Bli trygg på scenen.', minAge: 16, cost: 4_000, limit: 1, outcomes: [ok('Du holdt et foredrag uten å skjelve!', [st('reputation', 4), st('stress', -2), st('discipline', 1)])] },

  // ── Hobbies ──
  { id: 'music', category: 'hobbies', name: 'Øv på et instrument', description: 'Gitar, piano eller fiolin.', minAge: 6, cost: 300, limit: 3, outcomes: [ok('Du lærte en ny sang.', [st('happiness', 2), st('intelligence', 1), st('discipline', 1)])] },
  { id: 'painting', category: 'hobbies', name: 'Mal et bilde', description: 'Pensel og lerret.', minAge: 4, cost: 400, limit: 2, outcomes: [ok('Du malte noe du er skikkelig stolt av.', [st('happiness', 3), st('stress', -3)])] },
  { id: 'fishing', category: 'hobbies', name: 'Fisketur', description: 'Stang og stillhet.', minAge: 5, cost: 200, limit: 2, outcomes: [ok('Du fikk en fin torsk!', [st('happiness', 3), st('stress', -4)], 3), neu('Ikke napp, men fin natur.', [st('stress', -3)], 2)] },
  { id: 'cooking', category: 'hobbies', name: 'Lag gourmetmiddag', description: 'Fra bunnen av.', minAge: 10, cost: 800, limit: 2, outcomes: [ok('Middagen ble en suksess!', [st('happiness', 2), st('health', 1)], 3), bad('Du brente sausen og røykvarsleren gikk.', [st('happiness', -1)], 1)] },
  { id: 'gardening', category: 'hobbies', name: 'Hagearbeid', description: 'Grønne fingre.', minAge: 8, cost: 300, limit: 2, outcomes: [ok('Tomatplantene dine trives.', [st('stress', -3), st('happiness', 2), st('fitness', 1)])] },
  { id: 'writing', category: 'hobbies', name: 'Skriv på en roman', description: 'Kapittel én …', minAge: 12, cost: 0, limit: 2, outcomes: [ok('Du skrev et kapittel du er stolt av.', [st('intelligence', 1.5), st('happiness', 2)], 4), ok('Et forlag viste interesse for manuset ditt!', [st('reputation', 4), { t: 'money', amount: 30_000, label: 'Forskudd fra forlag' }, { t: 'flag', key: 'author' }], 0.2)] },

  // ── Medical ──
  { id: 'checkup', category: 'medical', name: 'Helsesjekk hos fastlegen', description: 'Forebygging er best.', minAge: 0, cost: 350, limit: 1, outcomes: [ok('Legen sa at alt så fint ut.', [st('health', 2), st('stress', -2)], 3), neu('Legen anbefalte mer mosjon og mindre stress.', [st('discipline', 1)], 2)] },
  { id: 'dentist', category: 'medical', name: 'Tannlegetime', description: 'Ingen hull, forhåpentligvis.', minAge: 3, cost: 1_200, limit: 1, outcomes: [ok('Ingen hull! Tannlegen ga deg et klistremerke.', [st('appearance', 1), st('health', 1)], 3), bad('Du hadde tre hull. Au.', [st('happiness', -2), { t: 'money', amount: -4_000, label: 'Tannbehandling' }], 1)] },
  { id: 'physio', category: 'medical', name: 'Fysioterapi', description: 'Ryggen takker deg.', minAge: 12, cost: 700, limit: 2, outcomes: [ok('Fysioterapien hjalp på plagene.', [st('health', 3), { t: 'removeCondition', id: 'back_pain' }], 1), ok('Litt bedre, men ikke helt bra.', [st('health', 1.5)], 2)] },
  { id: 'alt_medicine', category: 'medical', name: 'Alternativ behandling', description: 'Krystaller og urter.', minAge: 16, cost: 3_000, limit: 1, outcomes: [neu('Du følte deg litt bedre. Placebo er også en effekt.', [st('stress', -2)], 3), bad('Behandleren solgte deg dyre piller som ikke virket.', [{ t: 'money', amount: -3_000, label: 'Urtemedisin' }], 1)] },

  // ── Cosmetic ──
  { id: 'haircut', category: 'cosmetic', name: 'Ny frisyre', description: 'Hos en dyr frisør.', minAge: 12, cost: 1_500, limit: 2, outcomes: [ok('Den nye frisyren kler deg!', [st('appearance', 2), st('happiness', 1)], 4), bad('Frisøren gikk litt for langt.', [st('appearance', -1), st('happiness', -2)], 1)] },
  { id: 'teeth_whitening', category: 'cosmetic', name: 'Tannbleking', description: 'Hollywood-smil.', minAge: 18, cost: 6_000, limit: 1, cooldown: 3, outcomes: [ok('Smilet ditt lyser opp rommet.', [st('appearance', 3)])] },
  { id: 'botox', category: 'cosmetic', name: 'Botox', description: 'Glatt og glinsende.', minAge: 25, cost: 5_000, limit: 1, outcomes: [ok('Rynkene forsvant – for en stund.', [st('appearance', 3), st('happiness', 1)], 4), bad('Ansiktet ble litt … stivt.', [st('appearance', -2)], 1)] },
  { id: 'plastic_surgery', category: 'cosmetic', name: 'Plastisk kirurgi', description: 'Stor endring, stor risiko.', minAge: 18, cost: 90_000, limit: 1, cooldown: 3, risky: true, outcomes: [ok('Operasjonen var en suksess. Du kjenner deg nesten ikke igjen!', [st('appearance', 12), st('happiness', 4)], 6), bad('Komplikasjoner førte til et lengre sykehusopphold.', [st('appearance', -6), st('health', -10), { t: 'addCondition', id: 'injury', severity: 35 }], 1.2)] },

  // ── Gambling (fictional in-game currency only) ──
  { id: 'lotto', category: 'gambling', name: 'Lotto hele året', description: 'Én kupong i uka.', minAge: 18, cost: 2_600, limit: 1, outcomes: [neu('Ingen gevinster i år. Som vanlig.', [], 90), ok('Du vant 5 000 kr på lotto!', [{ t: 'money', amount: 5_000, label: 'Lottogevinst' }], 8), ok('Fem rette pluss tilleggstall! Du vant 400 000 kr!', [{ t: 'money', amount: 400_000, label: 'Lottogevinst' }, st('happiness', 10)], 0.3), ok('SJU RETTE! Du vant 18 millioner kroner!', [{ t: 'money', amount: 18_000_000, label: 'Lotto-jackpot' }, st('happiness', 20), { t: 'flag', key: 'lotteryWin' }], 0.01)] },
  { id: 'poker', category: 'gambling', name: 'Pokerkveld (10 000 kr)', description: 'Bløff eller fold.', minAge: 18, cost: 10_000, limit: 2, risky: true, outcomes: [bad('Du tapte alt på river.', [{ t: 'addiction', id: 'gambling', delta: 5 }, st('happiness', -2)], 5), ok('Du vant 25 000 kr!', [{ t: 'money', amount: 25_000, label: 'Pokergevinst' }, { t: 'addiction', id: 'gambling', delta: 6 }, st('happiness', 3)], 3.5), ok('Du knuste bordet og vant 80 000 kr!', [{ t: 'money', amount: 80_000, label: 'Pokergevinst' }, { t: 'addiction', id: 'gambling', delta: 8 }], 0.5)] },
  { id: 'horse_betting', category: 'gambling', name: 'Hestespill (3 000 kr)', description: 'V75 på lørdag.', minAge: 18, cost: 3_000, limit: 2, risky: true, outcomes: [bad('Hesten din stoppet ved første sving.', [{ t: 'addiction', id: 'gambling', delta: 3 }], 6), ok('Du traff og vant 12 000 kr!', [{ t: 'money', amount: 12_000, label: 'Hestespill' }, { t: 'addiction', id: 'gambling', delta: 4 }], 2.5)] },
  { id: 'scratch', category: 'gambling', name: 'Skrapelodd', description: 'Kjøp en bunke.', minAge: 18, cost: 500, limit: 3, outcomes: [neu('Ingenting. Bare sølvstøv på fingrene.', [], 7), ok('Du vant 2 000 kr!', [{ t: 'money', amount: 2_000, label: 'Skrapelodd' }], 2)] },

  // ── Business ──
  { id: 'side_hustle', category: 'business', name: 'Sidegesjeft', description: 'Selg ting på nett.', minAge: 16, cost: 2_000, limit: 1, conditions: [notPrison], outcomes: [ok('Sidegesjeften ga en hyggelig ekstrainntekt.', [{ t: 'money', amount: 18_000, label: 'Sidegesjeft' }, st('discipline', 1)], 3), bad('Ingen ville kjøpe noe.', [st('happiness', -1)], 2)] },
  { id: 'freelance', category: 'business', name: 'Frilansoppdrag', description: 'Ekstra jobb på kveldstid.', minAge: 18, cost: 0, limit: 2, conditions: [notPrison, { t: 'eduLevel', min: 'upperSecondary' }], outcomes: [ok('Kunden var fornøyd og betalte godt.', [{ t: 'money', amount: 25_000, label: 'Frilansoppdrag' }, st('stress', 4)], 3), bad('Kunden betalte aldri fakturaen.', [st('stress', 5), st('happiness', -2)], 1)] },
  { id: 'business_course', category: 'business', name: 'Gründerkurs', description: 'Lær å starte bedrift.', minAge: 18, cost: 5_000, limit: 1, outcomes: [ok('Du lærte mye om budsjett og markedsføring.', [st('intelligence', 2), st('discipline', 2), { t: 'flag', key: 'businessCourse' }])] },

  // ── Crime (abstract and narrative) ──
  { id: 'shoplift', category: 'crime', name: 'Naske i butikken', description: 'Spenning – og risiko.', minAge: 12, cost: 0, limit: 2, risky: true, conditions: [notPrison], outcomes: [ok('Du slapp unna med en sjokolade og et par solbriller.', [st('happiness', 1), st('reputation', -0.5)], 3), bad('Vakten stoppet deg ved døra.', [{ t: 'crime', crime: 'shoplifting', severity: 1 }], 2)] },
  { id: 'vandalize', category: 'crime', name: 'Tagge på en vegg', description: 'Gatekunst eller hærverk?', minAge: 12, cost: 300, limit: 1, risky: true, conditions: [notPrison], outcomes: [ok('Kunstverket ditt ble lagt merke til i nabolaget.', [st('happiness', 2)], 3), bad('Politiet tok deg på fersk gjerning.', [{ t: 'crime', crime: 'vandalism', severity: 1 }], 2)] },
  { id: 'burglary', category: 'crime', name: 'Innbrudd', description: 'En villa står tom i ferien.', minAge: 16, cost: 0, limit: 1, risky: true, conditions: [notPrison], outcomes: [ok('Du kom deg unna med verdisaker verdt 35 000 kr.', [{ t: 'money', amount: 35_000, label: 'Tyvegods' }, st('stress', 6)], 4), bad('Alarmen gikk.', [{ t: 'crime', crime: 'burglary', severity: 3 }, st('stress', 10)], 3)] },
  { id: 'fraud', category: 'crime', name: 'Svindel på nett', description: 'Falske annonser.', minAge: 16, cost: 1_000, limit: 1, risky: true, conditions: [notPrison], outcomes: [ok('Svindelen ga en stor fortjeneste.', [{ t: 'money', amount: 60_000, label: 'Svindel' }, st('stress', 6)], 3), bad('Økokrim fulgte pengesporet.', [{ t: 'crime', crime: 'fraud', severity: 3 }], 2.5)] },
  { id: 'tax_evasion', category: 'crime', name: 'Skjul inntekt for skatten', description: 'Svarte penger.', minAge: 20, cost: 0, limit: 1, risky: true, conditions: [notPrison, { t: 'employed', value: true }], outcomes: [ok('Du sparte en del skatt i år.', [{ t: 'salaryPct', pct: 0.08, fallback: 20_000, label: 'Unndratt skatt' }], 3), bad('Skatteetaten oppdaget avviket.', [{ t: 'crime', crime: 'tax_fraud', severity: 2 }], 2)] },
  { id: 'smuggle', category: 'crime', name: 'Smugle varer over grensa', description: 'Svensk sprit og sigaretter.', minAge: 18, cost: 8_000, limit: 1, risky: true, conditions: [notPrison], outcomes: [ok('Tolleren vinket deg forbi. Du tjente godt.', [{ t: 'money', amount: 40_000, label: 'Smuglervarer' }], 3), bad('Tollhunden fant alt.', [{ t: 'crime', crime: 'smuggling', severity: 2 }], 2)] },
  { id: 'hack', category: 'crime', name: 'Datainnbrudd', description: 'For de teknisk begavede.', minAge: 15, cost: 0, limit: 1, risky: true, conditions: [notPrison, { t: 'stat', key: 'intelligence', min: 70 }], outcomes: [ok('Du fant en sårbarhet og solgte informasjonen.', [{ t: 'money', amount: 90_000, label: 'Datainnbrudd' }], 3), bad('Sporene ledet rett til deg.', [{ t: 'crime', crime: 'cyber', severity: 3 }], 2)] },
  { id: 'robbery', category: 'crime', name: 'Ran', description: 'Den store kuppet.', minAge: 18, cost: 0, limit: 1, risky: true, conditions: [notPrison], outcomes: [ok('Kuppet lyktes. Du har aldri vært så redd og rik på en gang.', [{ t: 'money', amount: 250_000, label: 'Ransutbytte' }, st('stress', 15)], 2), bad('Ranet gikk galt.', [{ t: 'crime', crime: 'robbery', severity: 5 }, st('stress', 15)], 3)] },

  // ── Prison ──
  { id: 'prison_gym', category: 'prison', name: 'Tren i fengselsgården', description: 'Det er lite annet å gjøre.', minAge: 15, cost: 0, limit: 3, conditions: [{ t: 'inPrison', value: true }], outcomes: [ok('Du trente hardt. Kroppen blir sterkere.', [st('fitness', 5), st('stress', -2)])] },
  { id: 'prison_study', category: 'prison', name: 'Ta fag i fengselet', description: 'Utdanning bak murene.', minAge: 15, cost: 0, limit: 2, conditions: [{ t: 'inPrison', value: true }], outcomes: [ok('Du tok et fag og fikk god karakter.', [st('intelligence', 2), st('discipline', 2), st('reputation', 1)])] },
  { id: 'prison_behave', category: 'prison', name: 'Vis god oppførsel', description: 'Kanskje du slipper tidligere.', minAge: 15, cost: 0, limit: 1, conditions: [{ t: 'inPrison', value: true }], outcomes: [ok('Vokterne la merke til den gode oppførselen din.', [st('discipline', 4), { t: 'prisonTime', delta: -1 }], 1), neu('Ingen ser ut til å legge merke til det.', [st('discipline', 2)], 2)] },
  { id: 'prison_fight', category: 'prison', name: 'Slåss om respekt', description: 'Farlig, men gir status.', minAge: 15, cost: 0, limit: 1, risky: true, conditions: [{ t: 'inPrison', value: true }], outcomes: [ok('Du vant slåsskampen. Ingen tuller med deg nå.', [st('reputation', 3), st('health', -3)], 2), bad('Du tapte og fikk ekstra soning.', [st('health', -10), { t: 'prisonTime', delta: 1 }], 2)] },
];

export function getActivity(id: string): ActivityDef | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}
