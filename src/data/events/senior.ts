import type { EventDef } from '@/types/events';
import { C, bad, bias, choice, cond, ev, fit, good, happy, health, money, out, pay, pick, rel, rep, smart, stress } from './helpers';

/** Senior life: 60+. Retirement, grandchildren, health decline and legacy. */
export const SENIOR_EVENTS: EventDef[] = [
  ev({ id: 'sn_retirement_offer', category: 'career', title: 'Pensjonsalder', text: 'Du har nådd pensjonsalderen. Vil du gå av?', minAge: 67, maxAge: 74, weight: 40, priority: true, tone: 'milestone', icon: 'sunset', conditions: [C.retired(false), C.employed()], cooldown: 2, maxOccurrences: 3,
    choices: [
      pick('Gå av med pensjon', 'Avskjedsfest med kake og tale. Et nytt kapittel begynner.', [{ t: 'retire' }], 'milestone'),
      pick('Jobbe noen år til', 'Du er ikke klar ennå. Pensjonen blir høyere.', [stress(2), rep(1)], 'neutral'),
    ] }),
  ev({ id: 'sn_early_retirement', category: 'career', title: 'Tidligpensjon?', text: 'Du kan ta ut pensjon fra 62 år – med redusert utbetaling.', minAge: 62, maxAge: 66, weight: 5, tone: 'neutral', icon: 'sunset', conditions: [C.retired(false)], maxOccurrences: 1,
    choices: [
      pick('Gå av tidlig', 'Du valgte fritid fremfor penger.', [{ t: 'retire' }, happy(4)], 'positive'),
      pick('Fortsette', 'Noen år til i sele.', [], 'neutral'),
    ] }),
  ev({ id: 'sn_grandchild_visit', category: 'family', title: 'Barnebarnsbesøk', text: '{target} kommer på besøk hele helgen.', minAge: 50, maxAge: 110, weight: 6, tone: 'relationship', icon: 'heart', target: { kinds: ['grandchild'], maxAge: 16 }, cooldown: 2,
    choices: [
      pick('Bake boller og spille kort', 'Den beste helgen på lenge.', [rel('bound', 12), happy(5)], 'positive'),
      pick('Ta med på fisketur', '{target} fikk sin første fisk!', [rel('bound', 14), happy(5), fit(1)], 'positive'),
      pick('Gi en pengegave', '{target} ble glad, men gikk fort hjem igjen.', [money(-2_000, 'Gave til barnebarn'), rel('bound', 4)], 'neutral'),
    ] }),
  ev({ id: 'sn_babysit', category: 'family', title: 'Barnevakt', text: '{target} spør om du kan passe barna hver onsdag.', minAge: 55, maxAge: 85, weight: 4, tone: 'relationship', icon: 'baby', target: { kinds: ['child'], minAge: 25 }, conditions: [C.rel('grandchild')], maxOccurrences: 1,
    choices: [
      pick('Ja, gjerne!', 'Onsdagene ble ukens høydepunkt.', [rel('bound', 10), rel('grandchild', 10), happy(4), stress(2)], 'positive'),
      pick('Nei, jeg har egne planer', '{target} ble skuffet.', [rel('bound', -6)], 'negative'),
    ] }),
  ev({ id: 'sn_fall', category: 'health', title: 'Fall', text: 'Du skled på isen utenfor butikken.', minAge: 65, maxAge: 110, weight: 4, tone: 'negative', icon: 'snowflake', cooldown: 4,
    mods: [], outcomes: [bad('Du brakk hofta og måtte opereres.', [cond('broken_bone', 70), health(-10), fit(-5)], { w: 1, bias: [bias('fitness', -0.5)] }), out('Et blått merke og såret stolthet.', [health(-2)], { w: 2, bias: [bias('fitness', 0.5)] })] }),
  ev({ id: 'sn_memory', category: 'health', title: 'Glemsk', text: 'Du har glemt hvor du parkerte – tre ganger denne uka.', minAge: 68, maxAge: 110, weight: 4, tone: 'neutral', icon: 'brain', cooldown: 5,
    choices: [
      pick('Gå til legen', 'Legen mente det var normal aldring. Du fikk hjernetrim-oppgaver.', [smart(1), stress(-2)], 'neutral'),
      pick('Løse kryssord hver dag', 'Hjernen holder seg skarp.', [smart(2), happy(1)], 'positive'),
      pick('Ignorere det', 'Det gikk sikkert bra.', [], 'neutral'),
    ] }),
  ev({ id: 'sn_widow', category: 'family', title: 'Ensomhet', text: 'Huset føles tomt etter at ektefellen din døde.', minAge: 55, maxAge: 110, weight: 6, tone: 'negative', icon: 'cloud', conditions: [C.flag('widowed')], maxOccurrences: 1,
    choices: [
      pick('Bli med i pensjonistforeningen', 'Du fikk nye venner og en grunn til å komme deg ut.', [{ t: 'newRel', kind: 'friend', ageOffset: 0 }, happy(5)], 'positive'),
      pick('Flytte nærmere barna', 'Du ser barnebarna oftere nå.', [rel('child', 10), happy(3)], 'positive', { cond: [C.children(1)] }),
      pick('Trekke deg tilbake', 'Dagene ble lange og grå.', [happy(-6), cond('depression', 40)], 'negative'),
    ] }),
  ev({ id: 'sn_late_love', category: 'love', title: 'Kjærlighet i høst', text: 'En hyggelig person fra seniordansen har sendt deg en blomst.', minAge: 62, maxAge: 95, weight: 3, tone: 'relationship', icon: 'flower-2', conditions: [C.noPartner()], cooldown: 5,
    choices: [
      pick('Invitere på kaffe', 'Det er aldri for sent for kjærlighet. Du og {newPerson} er kjærester!', [{ t: 'newRel', kind: 'partner' }, happy(8)], 'positive'),
      pick('Takke høflig', 'Du er fornøyd alene.', [], 'neutral'),
    ] }),
  ev({ id: 'sn_will', category: 'family', title: 'Testamente', text: 'Advokaten anbefaler deg å skrive testament.', minAge: 60, maxAge: 110, weight: 4, tone: 'neutral', icon: 'scroll', maxOccurrences: 1,
    choices: [
      pick('Skrive testament', 'Arven fordeles ryddig. Familien slipper krangel.', [money(-8_000, 'Advokat'), stress(-4), rel('child', 3)], 'positive'),
      pick('Gi bort penger mens du lever', 'Barna fikk en god start.', [money(-100_000, 'Gave til barna'), rel('child', 12), happy(4)], 'positive', { cond: [C.children(1), C.money(300_000)] }),
      pick('Utsette det', 'Det haster vel ikke.', [], 'neutral'),
    ] }),
  ev({ id: 'sn_pension_trip', category: 'random', title: 'Cruise', text: 'Et cruise til Middelhavet for pensjonister er på tilbud for {amount}.', minAge: 62, maxAge: 95, weight: 4, tone: 'positive', icon: 'ship', conditions: [C.retired()], cooldown: 3,
    vars: { amount: { t: 'range', min: 25_000, max: 60_000, step: 1000 } },
    choices: [
      pick('Bestille', 'Sol, sjøluft og buffet. Fantastisk!', [pay('amount', 'Cruise'), happy(7), stress(-6), { t: 'count', key: 'trips' }], 'positive', { cost: 'amount' }),
      pick('Holde deg hjemme', 'Hytta er god nok.', [], 'neutral'),
    ] }),
  ev({ id: 'sn_tech_struggle', category: 'random', title: 'Ny teknologi', text: 'Banken har lagt om til en ny app, og du skjønner ingenting.', minAge: 70, maxAge: 110, weight: 4, tone: 'neutral', icon: 'smartphone', maxOccurrences: 2, cooldown: 5,
    choices: [
      pick('Be barnebarna om hjelp', 'Etter tre forklaringer gikk det.', [rel('grandchild', 4), smart(1)], 'positive', { cond: [C.rel('grandchild')] }),
      pick('Gå på datakurs på biblioteket', 'Du ble en ekspert på videosamtaler.', [smart(2), happy(2)], 'positive'),
      pick('Klage til banken', 'De sendte deg en papirbrosjyre.', [stress(2)], 'neutral'),
    ] }),
  ev({ id: 'sn_volunteer', category: 'social', title: 'Frivillig pensjonist', text: 'Frivilligsentralen søker besøksvenner.', minAge: 65, maxAge: 90, weight: 3, tone: 'positive', icon: 'hand-heart', conditions: [C.retired()], maxOccurrences: 1,
    choices: [
      pick('Bli besøksvenn', 'Du fikk mening i hverdagen og en ny venn.', [happy(5), rep(4), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Ikke nå', 'Kanskje senere.', [], 'neutral'),
    ] }),
  ev({ id: 'sn_heart_scare', category: 'health', title: 'Brystsmerter', text: 'Du får trykk i brystet mens du måker snø.', minAge: 55, maxAge: 110, weight: 3, tone: 'negative', icon: 'heart-pulse', cooldown: 6,
    choices: [
      choice('Ringe 113 med en gang', [good('Det var et lite hjerteinfarkt, men du fikk hjelp i tide.', [cond('heart_disease', 40), health(-6)], { w: 2 }), out('Det var bare muskelsmerter. Bedre føre var.', [stress(2)], { w: 2 })]),
      choice('Ta det med ro og vente', [bad('Det var et hjerteinfarkt. Ventetiden gjorde skaden større.', [cond('heart_disease', 70), health(-15)], { w: 1 }), out('Smertene ga seg. Heldigvis.', [stress(2)], { w: 2 })]),
    ] }),
  ev({ id: 'sn_downsizing', category: 'money', title: 'For stort hus', text: 'Huset er stort og tungvint nå som barna har flyttet ut.', minAge: 60, maxAge: 95, weight: 3, tone: 'neutral', icon: 'home', conditions: [C.homeowner(), C.asset('house')], maxOccurrences: 1,
    choices: [
      pick('Selge og flytte i leilighet', 'Gå til Økonomi → Eiendom for å selge huset og kjøpe en leilighet.', [stress(-2)], 'neutral'),
      pick('Bli boende', 'Her er minnene.', [happy(1)], 'neutral'),
    ] }),
  ev({ id: 'sn_memoir', category: 'random', title: 'Memoarer', text: 'Barnebarna oppfordrer deg til å skrive ned livshistorien din.', minAge: 70, maxAge: 110, weight: 2, tone: 'positive', icon: 'book', maxOccurrences: 1,
    choices: [
      pick('Skrive boken', 'Familien fikk et uvurderlig minne. Et forlag ville til og med gi den ut!', [rep(5), happy(5), smart(1), money(25_000, 'Bokhonorar')], 'positive'),
      pick('Fortelle muntlig', 'Barnebarna tok opp alt på mobilen.', [rel('grandchild', 8), happy(3)], 'positive'),
    ] }),
  ev({ id: 'sn_old_friend_dies', category: 'social', title: 'Begravelse', text: 'En gammel venn fra ungdommen har gått bort.', minAge: 65, maxAge: 110, weight: 4, tone: 'negative', icon: 'flower', cooldown: 4,
    choices: [
      pick('Holde minnetale', 'Du fikk mange til å smile gjennom tårene.', [happy(-3), rep(2)], 'neutral'),
      pick('Ringe de andre fra gjengen', 'Dere avtalte å treffes oftere mens dere kan.', [happy(-2), rel('friend', 8)], 'neutral'),
    ] }),
  ev({ id: 'sn_garden', category: 'random', title: 'Hageglede', text: 'Du har fått en kolonihage.', minAge: 62, maxAge: 95, weight: 3, tone: 'positive', icon: 'flower', conditions: [C.retired()], maxOccurrences: 1,
    outcomes: [good('Du dyrker poteter, jordbær og vennskap.', [happy(5), fit(2), stress(-5), { t: 'newRel', kind: 'friend' }])] }),
  ev({ id: 'sn_grandchild_money', category: 'family', title: 'Studiehjelp', text: '{target} skal begynne å studere og trenger hjelp med husleien.', minAge: 60, maxAge: 110, weight: 3, tone: 'financial', icon: 'graduation-cap', target: { kinds: ['grandchild'], minAge: 18, maxAge: 25 }, maxOccurrences: 2,
    choices: [
      pick('Støtte med 50 000 kr', '{target} ble rørt og ringer deg hver søndag.', [money(-50_000, 'Støtte til barnebarn'), rel('bound', 15)], 'positive', { cost: 50_000 }),
      pick('Gi gode råd i stedet', 'Råd er gratis. {target} smilte høflig.', [rel('bound', 2)], 'neutral'),
    ] }),
  ev({ id: 'sn_senior_sports', category: 'health', title: 'Seniortrim', text: 'Kommunen tilbyr gratis styrketrening for seniorer.', minAge: 65, maxAge: 95, weight: 4, tone: 'positive', icon: 'dumbbell', maxOccurrences: 2, cooldown: 5,
    choices: [
      pick('Delta hver uke', 'Du ble sterkere og fikk nye venner.', [fit(6), health(4), happy(3)], 'positive'),
      pick('Holde deg til sofaen', 'Fjernkontrollen er tung nok.', [fit(-2)], 'neutral'),
    ] }),
  ev({ id: 'sn_care_home', category: 'health', title: 'Sykehjem?', text: 'Det blir vanskelig å klare seg alene hjemme.', minAge: 82, maxAge: 115, weight: 4, tone: 'neutral', icon: 'building-2', conditions: [C.stat('health', 0, 45)], maxOccurrences: 1,
    choices: [
      pick('Flytte på sykehjem', 'Trygghet og pleie døgnet rundt.', [health(4), happy(-3), stress(-4)], 'neutral'),
      pick('Få hjemmehjelp', 'Du blir boende hjemme med daglig hjelp.', [money(-30_000, 'Hjemmetjenester'), happy(2)], 'positive'),
    ] }),
  ev({ id: 'sn_great_grandchild', category: 'family', title: 'Oldebarn!', text: 'Et barnebarn har fått barn. Du er blitt oldeforelder!', minAge: 70, maxAge: 115, weight: 2, tone: 'milestone', icon: 'baby', conditions: [C.rel('grandchild')], maxOccurrences: 1,
    outcomes: [good('Fire generasjoner samlet på ett bilde. Du var lykkelig.', [happy(10), { t: 'flag', key: 'greatGrandparent' }])] }),
  ev({ id: 'sn_reflect', category: 'random', title: 'Ettertanke', text: 'Du sitter i godstolen og ser tilbake på livet.', minAge: 75, maxAge: 115, weight: 3, tone: 'neutral', icon: 'armchair', maxOccurrences: 1,
    choices: [
      pick('Ringe noen du har mistet kontakten med', 'Det ble en lang og god samtale.', [happy(4), stress(-4)], 'positive'),
      pick('Skrive brev til barna', 'Brevene vil bli lest mange ganger.', [rel('child', 10), happy(3)], 'positive', { cond: [C.children(1)] }),
      pick('Være takknemlig', 'Det har vært et godt liv.', [happy(3)], 'positive'),
    ] }),
  ev({ id: 'sn_scam_grandparent', category: 'money', title: '«Barnebarnet» ringer', text: 'En stemme som høres ut som barnebarnet ditt trenger {amount} akutt.', minAge: 70, maxAge: 115, weight: 2, tone: 'negative', icon: 'phone', cooldown: 10,
    vars: { amount: { t: 'range', min: 20_000, max: 80_000, step: 1000 } },
    choices: [
      choice('Overføre pengene', [bad('Det var en svindler. Pengene er borte.', [pay('amount', 'Svindel'), happy(-6)], { w: 1 })]),
      pick('Ringe barnebarnet direkte', 'Barnebarnet visste ingenting. Du avslørte svindelen!', [smart(2), rep(1)], 'positive'),
    ] }),
  ev({ id: 'sn_100_birthday', category: 'milestone', title: 'Hundreårsdag', text: 'Du fyller 100 år! Ordføreren kommer med blomster.', minAge: 100, maxAge: 100, weight: 100, priority: true, tone: 'milestone', icon: 'cake', maxOccurrences: 1,
    outcomes: [good('Et helt århundre! Lokalavisen skrev en lang artikkel om deg.', [happy(10), rep(10)])] }),
  ev({ id: 'sn_family_reunion', category: 'family', title: 'Slektstreff', text: 'Hele familien samles på hytta for et stort slektstreff.', minAge: 60, maxAge: 110, weight: 3, tone: 'relationship', icon: 'users', conditions: [C.children(1)], cooldown: 6,
    choices: [
      pick('Holde tale om familiens historie', 'Det ble stille i salen. Flere hadde tårer i øynene.', [rel('child', 8), rel('grandchild', 8), happy(5)], 'positive'),
      pick('Bare nyte det', 'Barnebarna lekte på tunet. Du smilte hele dagen.', [happy(4)], 'positive'),
    ] }),
  ev({ id: 'sn_inheritance_question', category: 'family', title: 'Hvem arver hytta?', text: 'Barna dine er uenige om hvem som skal arve hytta.', minAge: 65, maxAge: 110, weight: 2, tone: 'neutral', icon: 'tent-tree', conditions: [C.asset('cabin'), C.children(2)], maxOccurrences: 1,
    choices: [
      pick('Dele den likt', 'Et sameie kan gå bra – med en god kalender.', [rel('child', 3)], 'neutral'),
      pick('Selge hytta og dele pengene', 'Ingen krangel, men mange tårer.', [rel('child', -2), happy(-3)], 'neutral'),
    ] }),
  ev({ id: 'sn_hearing', category: 'health', title: 'Hørselen svikter', text: 'Du hører dårlig og må be folk gjenta seg selv.', minAge: 65, maxAge: 110, weight: 4, tone: 'neutral', icon: 'ear', maxOccurrences: 1,
    choices: [
      pick('Skaffe høreapparat', 'Verden ble full av lyd igjen. Fuglesangen!', [happy(4), rel('spouse', 3)], 'positive'),
      pick('Klare deg uten', '«Hæ?» ble ditt mest brukte ord.', [happy(-2), rep(-1)], 'negative'),
    ] }),
];

