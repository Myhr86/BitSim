import type { EventDef } from '@/types/events';
import { C, bad, bias, choice, cond, disc, ev, gain, good, happy, health, money, out, pay, pick, rel, rep, smart, stress } from './helpers';

/** Events for any age: world, justice, prison, random luck and family-wide moments. */
export const GENERAL_EVENTS: EventDef[] = [
  // ── Justice (raised by the crime system) ──
  ev({ id: 'justice_trial', category: 'crime', title: 'Rettssak', text: 'Du er tiltalt.', minAge: 0, maxAge: 120, weight: 0, scheduledOnly: true, tone: 'negative', icon: 'scale',
    // Raised directly by the crime system, which fills in these variables.
    vars: { severity: { t: 'range', min: 1, max: 5, step: 1 }, cost: { t: 'range', min: 60_000, max: 300_000, step: 1000 } },
    choices: [
      pick('Erklære deg skyldig', 'Du tilsto og fikk strafferabatt.', [{ t: 'trial', mode: 'plead' }], 'negative'),
      pick('Forsvare deg selv', 'Du sto alene foran dommeren.', [{ t: 'trial', mode: 'defend' }], 'neutral'),
      pick('Hyre en dyr advokat', 'En kjent forsvarer tok saken din.', [{ t: 'trial', mode: 'lawyer' }], 'neutral', { cost: 'cost' }),
    ] }),
  // ── Prison life ──
  ev({ id: 'prison_cellmate', category: 'crime', title: 'Cellekamerat', text: 'Du har fått ny cellekamerat. Han er stor og stirrer på deg.', minAge: 15, maxAge: 120, weight: 8, tone: 'neutral', icon: 'lock', conditions: [C.prison()], cooldown: 3,
    choices: [
      choice('Være vennlig', [good('Dere ble gode venner. {newPerson} passer på deg.', [{ t: 'newRel', kind: 'friend' }, stress(-4)], { w: 2 }), bad('Han utnyttet vennligheten din.', [money(-2_000, 'Kantinepenger'), stress(4)], { w: 1 })]),
      pick('Holde avstand', 'Dere lot hverandre være i fred.', [], 'neutral'),
    ] }),
  ev({ id: 'prison_riot', category: 'crime', title: 'Uro i fengselet', text: 'Det bryter ut bråk i fellesarealet.', minAge: 15, maxAge: 120, weight: 5, tone: 'negative', icon: 'flame', conditions: [C.prison()], cooldown: 3,
    choices: [
      pick('Gå inn på cella', 'Du holdt deg unna. Vokterne la merke til det.', [disc(3)], 'positive'),
      choice('Bli med', [bad('Du ble tatt med på bråket og fikk lengre straff.', [{ t: 'prisonTime', delta: 1 }, health(-5)], { w: 2 }), out('Ingen så at du var med.', [rep(1), stress(4)], { w: 1 })]),
    ] }),
  ev({ id: 'prison_education', category: 'crime', title: 'Skole bak murene', text: 'Fengselet tilbyr fagbrev-kurs.', minAge: 16, maxAge: 120, weight: 6, tone: 'positive', icon: 'graduation-cap', conditions: [C.prison()], maxOccurrences: 1,
    choices: [
      pick('Ta kurset', 'Du fikk ny kunnskap og en grunn til å stå opp om morgenen.', [smart(3), disc(4), happy(2), { t: 'flag', key: 'prisonEducation' }], 'positive'),
      pick('Ligge på cella', 'Dagene ble lange.', [happy(-2)], 'neutral'),
    ] }),
  ev({ id: 'prison_visit', category: 'family', title: 'Besøk', text: '{target} kommer på besøk i fengselet.', minAge: 15, maxAge: 120, weight: 6, tone: 'relationship', icon: 'users', target: { kinds: ['mother', 'father', 'spouse', 'partner', 'sibling', 'bestFriend', 'child'] }, conditions: [C.prison()], cooldown: 2,
    choices: [
      pick('Be om tilgivelse', '{target} holdt deg i hånden. Det ga deg håp.', [rel('bound', 10), happy(4)], 'positive'),
      pick('Være kald og avvisende', '{target} gikk i tårer.', [rel('bound', -12)], 'negative'),
    ] }),
  ev({ id: 'prison_release_job', category: 'career', title: 'Ny start', text: 'Etter løslatelsen tilbyr en organisasjon hjelp til å finne jobb.', minAge: 16, maxAge: 70, weight: 6, tone: 'positive', icon: 'sunrise', conditions: [C.flag('released'), C.prison(false), C.employed(false)], maxOccurrences: 1,
    choices: [
      pick('Ta imot hjelpen', 'Du fikk et nettverk og en realistisk plan.', [flag_('network'), rep(3), disc(3)], 'positive'),
      pick('Gå tilbake til gamle venner', 'De gamle vennene har gamle vaner.', [rep(-3), disc(-3)], 'negative'),
    ] }),

  // ── Random luck & world ──
  ev({ id: 'gen_found_money', category: 'random', title: 'Heldig dag', text: 'Du fant {amount} i en gammel lommebok du hadde glemt.', minAge: 8, maxAge: 120, weight: 2, tone: 'positive', icon: 'banknote', cooldown: 10,
    vars: { amount: { t: 'range', min: 200, max: 2000, step: 50 } }, outcomes: [good('Kaffe på deg selv i dag.', [gain('amount', 'Funnet penger'), happy(2)])] }),
  ev({ id: 'gen_pandemic', category: 'world', title: 'Pandemi', text: 'Et nytt virus sprer seg, og samfunnet stenger ned.', minAge: 0, maxAge: 120, weight: 0.6, tone: 'negative', icon: 'shield-alert', maxOccurrences: 1,
    choices: [
      pick('Følge rådene nøye', 'Du holdt deg frisk, men ensomheten tæret.', [happy(-4), stress(4), health(1)], 'neutral'),
      choice('Leve som normalt', [bad('Du ble smittet og lå syk i tre uker.', [cond('pneumonia', 50), health(-8)], { w: 1 }), out('Du slapp unna denne gangen.', [rep(-2)], { w: 2 })]),
    ] }),
  ev({ id: 'gen_storm', category: 'world', title: 'Ekstremvær', text: 'Et kraftig uvær har herjet med hele regionen.', minAge: 0, maxAge: 120, weight: 1.5, tone: 'negative', icon: 'cloud-lightning', cooldown: 8,
    outcomes: [bad('Taket ditt fikk skader. Forsikringen dekket mesteparten.', [money(-12_000, 'Egenandel stormskade'), stress(4)], { w: 1, mods: [{ when: C.homeowner(), mult: 2 }] }), out('Strømmen var borte i to døgn. Stearinlys og brettspill.', [happy(1)], { w: 2 })] }),
  ev({ id: 'gen_birthday_surprise', category: 'social', title: 'Overraskelsesfest', text: 'Vennene dine har planlagt en overraskelsesfest for deg!', minAge: 16, maxAge: 100, weight: 3, tone: 'positive', icon: 'party-popper', conditions: [C.rel(['friend', 'bestFriend'], 2)], cooldown: 5,
    outcomes: [good('Du ble helt satt ut. For en gjeng du har!', [happy(6), rel('friend', 8)])] }),
  ev({ id: 'gen_good_samaritan', category: 'social', title: 'Hjelpsom', text: 'En turist har gått seg vill og spør deg om veien.', minAge: 10, maxAge: 100, weight: 2, tone: 'positive', icon: 'map', cooldown: 8,
    choices: [
      pick('Følge dem helt fram', 'De var så takknemlige at de tok et bilde med deg.', [rep(1), happy(2)], 'positive'),
      pick('Peke i en retning', 'Forhåpentligvis riktig retning.', [], 'neutral'),
    ] }),
  ev({ id: 'gen_tv_quiz', category: 'random', title: 'Quizshow', text: 'Du har fått plass i et quizprogram på TV.', minAge: 18, maxAge: 85, weight: 1, tone: 'neutral', icon: 'tv', maxOccurrences: 1,
    choices: [
      choice('Gå for storpremien', [good('Du svarte riktig på alt og vant 500 000 kr!', [money(500_000, 'Quizgevinst'), rep(5), happy(8)], { w: 1, bias: [bias('intelligence', 1.2)] }), bad('Du bommet på siste spørsmål og gikk hjem tomhendt.', [happy(-3), rep(1)], { w: 2 })]),
      pick('Ta de sikre pengene', 'Du gikk hjem med 50 000 kr.', [money(50_000, 'Quizgevinst'), happy(3)], 'positive'),
    ] }),
  ev({ id: 'gen_bike_stolen', category: 'crime', title: 'Stjålet sykkel', text: 'Sykkelen din er stjålet fra bakgården.', minAge: 8, maxAge: 90, weight: 3, tone: 'negative', icon: 'bike', cooldown: 6,
    choices: [
      pick('Anmelde det', 'Politiet henla saken, men forsikringen betalte.', [money(-1_000, 'Egenandel'), stress(1)], 'neutral'),
      pick('Lete på bruktmarkedet på nett', 'Du fant den til salgs og fikk den tilbake med politiets hjelp!', [happy(3), smart(1)], 'positive', { cond: [C.year(2000)] }),
      pick('Henge opp lapper i nabolaget', 'En nabo hadde sett tyven. Sykkelen kom tilbake!', [happy(3), rep(1)], 'positive', { cond: [C.year(undefined, 1999)] }),
    ] }),
  ev({ id: 'gen_relative_visit_abroad', category: 'family', title: 'Slekt i Amerika', text: 'En fjern slektning fra USA vil besøke deg for å finne røttene sine.', minAge: 20, maxAge: 100, weight: 1.5, tone: 'positive', icon: 'globe', maxOccurrences: 1,
    choices: [
      pick('Vise fram hjembygda', 'Dere fant det gamle familiegården. Begge gråt.', [happy(5), smart(1), { t: 'newRel', kind: 'friend', ageOffset: 10 }], 'positive'),
      pick('Avslå høflig', 'Du hadde ikke tid.', [], 'neutral'),
    ] }),
  ev({ id: 'gen_health_mystery', category: 'health', title: 'Utmattelse', text: 'Du har vært uvanlig sliten i månedsvis.', minAge: 20, maxAge: 90, weight: 2, tone: 'negative', icon: 'battery-low', cooldown: 8,
    choices: [
      choice('Insistere på utredning', [good('Det var jernmangel. Tilskudd fikset det.', [health(4), happy(3)], { w: 3 }), bad('Utredningen fant diabetes type 2.', [cond('diabetes', 40)], { w: 1 })]),
      pick('Sove mer', 'Det hjalp litt.', [stress(-2)], 'neutral'),
    ] }),
  ev({ id: 'gen_karma_return', category: 'random', title: 'Det man gir, får man igjen', text: 'Noen du hjalp for lenge siden har ikke glemt deg.', minAge: 20, maxAge: 100, weight: 2, tone: 'positive', icon: 'sparkles', conditions: [C.stat('reputation', 70)], maxOccurrences: 1,
    outcomes: [good('Hen tipset deg om en jobb, introduserte deg for nye folk og sendte en gave.', [rep(3), happy(4), money(10_000, 'Gave'), flag_('network')])] }),
  ev({ id: 'gen_reputation_drop', category: 'social', title: 'Ryktet går', text: 'Folk snakker om deg bak ryggen din.', minAge: 14, maxAge: 100, weight: 2, tone: 'negative', icon: 'message-square-warning', conditions: [C.stat('reputation', 0, 30)], cooldown: 5,
    choices: [
      pick('Gjøre noe godt for lokalsamfunnet', 'Ryktet ditt begynte å snu.', [rep(6), stress(2)], 'positive'),
      pick('Gi blaffen', 'Du bryr deg ikke om hva andre mener.', [happy(-1)], 'neutral'),
    ] }),
  ev({ id: 'gen_pet_sick', category: 'family', title: 'Sykt kjæledyr', text: 'Kjæledyret ditt er sykt. Veterinæren sier operasjonen koster {amount}.', minAge: 10, maxAge: 100, weight: 2, tone: 'negative', icon: 'dog', conditions: [C.flag('pet')], cooldown: 6,
    vars: { amount: { t: 'range', min: 8_000, max: 30_000, step: 1000 } },
    choices: [
      pick('Betale for operasjonen', 'Operasjonen var vellykket. Halen logret igjen.', [pay('amount', 'Veterinær'), happy(3)], 'positive', { cost: 'amount' }),
      pick('Ta farvel', 'Det var en tung dag.', [happy(-6), { t: 'unflag', key: 'pet' }], 'negative'),
    ] }),
  ev({ id: 'gen_sibling_loan', category: 'family', title: 'Søsken i knipe', text: '{target} har fått økonomiske problemer og trenger {amount}.', minAge: 20, maxAge: 100, weight: 3, tone: 'financial', icon: 'hand-coins', target: { kinds: ['sibling'], minAge: 20 }, cooldown: 6,
    vars: { amount: { t: 'range', min: 20_000, max: 80_000, step: 1000 } },
    choices: [
      pick('Gi pengene', 'Familie er familie.', [pay('amount', 'Hjelp til søsken'), rel('bound', 15), { t: 'npcWealth', target: 'bound', amount: 30_000 }], 'positive', { cost: 'amount' }),
      pick('Låne ut med avtale', 'Dere skrev en avtale.', [{ t: 'lend', target: 'bound', v: 'amount', mult: 1 }, rel('bound', 5)], 'neutral', { cost: 'amount' }),
      pick('Si nei', '{target} ble skuffet og sint.', [rel('bound', -12)], 'negative'),
    ] }),
  ev({ id: 'gen_fitness_streak', category: 'health', title: 'Treningsglede', text: 'Treningen har blitt en del av hverdagen din.', minAge: 15, maxAge: 85, weight: 2, tone: 'positive', icon: 'activity', conditions: [C.stat('fitness', 75)], cooldown: 6,
    outcomes: [good('Du føler deg sterk, frisk og glad.', [health(3), happy(3), stress(-3)])] }),
  ev({ id: 'gen_bad_luck_day', category: 'random', title: 'Uflaks', text: 'Mobilen falt i do, bussen gikk og det regnet.', minAge: 10, maxAge: 100, weight: 2, tone: 'negative', icon: 'cloud-rain', cooldown: 6,
    outcomes: [bad('Ny mobil, våte sokker og dårlig humør.', [money(-6_000, 'Ny mobil'), happy(-2)])] }),
];

function flag_(key: string) {
  return { t: 'flag' as const, key };
}

