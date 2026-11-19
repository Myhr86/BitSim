import type { EventDef } from '@/types/events';
import { C, bad, bias, choice, cond, delayed, disc, ev, fit, flag, gain, good, happy, health, later, mod, money, out, pay, perf, pick, rel, rep, school, smart, stress } from './helpers';

/** Young adulthood: 18–29. Independence, studies, conscription, first jobs and serious love. */
export const YOUNG_ADULT_EVENTS: EventDef[] = [
  ev({ id: 'ya_military', category: 'milestone', title: 'Førstegangstjeneste', text: 'Innkallingen til sesjon har kommet. Forsvaret vil ha deg.', minAge: 19, maxAge: 20, weight: 40, priority: true, tone: 'milestone', icon: 'shield',
    conditions: [C.stat('health', 50), C.prison(false), C.flag('militaryDecided', false)],
    choices: [
      choice('Avtjene verneplikten', [good('Et tøft, men lærerikt år i Hæren. Du kom hjem sterkere.', [{ t: 'military', serve: true }, fit(8), disc(6), rep(3), { t: 'newRel', kind: 'friend' }, flag('militaryDecided'), money(45_000, 'Dimpenger')], { w: 4 }), bad('Du skadet deg under en øvelse og ble dimittert tidlig.', [{ t: 'military', serve: true }, cond('injury', 35), flag('militaryDecided')], { w: 1 })]),
      pick('Søke fritak', 'Du fikk fritak og kunne starte med studier eller jobb med en gang.', [{ t: 'military', serve: false }, flag('militaryDecided')], 'neutral'),
      pick('Søke om å bli befal', 'Du ble tatt opp på befalsskolen. Lederskap og ansvar fra første dag.', [{ t: 'military', serve: true }, disc(8), rep(5), fit(6), flag('officerTraining'), flag('militaryDecided')], 'positive', { cond: [C.stat('fitness', 55), C.stat('discipline', 50)] }),
    ] }),
  ev({ id: 'ya_move_out', category: 'milestone', title: 'Flytte hjemmefra?', text: 'Du er voksen, men bor fortsatt hjemme. En venn har et ledig rom i et kollektiv.', minAge: 19, maxAge: 28, weight: 8, tone: 'neutral', icon: 'home', conditions: [C.home(), C.money(15_000)], cooldown: 3, maxOccurrences: 2,
    choices: [
      pick('Flytte inn i kollektivet', 'Første kveld i eget rom! Oppvasken er allerede et problem.', [{ t: 'moveOut' }, happy(5), disc(2), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Bli hjemme og spare', 'Mamma vasker klærne dine fortsatt. Sparekontoen vokser.', [disc(-1), rep(-1)], 'neutral'),
    ] }),
  ev({ id: 'ya_student_life', category: 'social', title: 'Fadderuke', text: 'Fadderuka på studiestedet er i gang!', minAge: 18, maxAge: 26, weight: 12, tone: 'positive', icon: 'party-popper', conditions: [C.enrolled(['bachelor', 'master'])], maxOccurrences: 1,
    choices: [
      pick('Gå all in', 'En uke med fester, nye venner og null søvn.', [happy(6), rep(3), { t: 'newRel', kind: 'friend' }, { t: 'newRel', kind: 'friend' }, health(-2)], 'positive'),
      pick('Delta litt', 'Du fikk et par gode venner og sov innimellom.', [happy(3), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Begynne å lese med en gang', 'Pensum er pensum.', [school(5), disc(2)], 'neutral'),
    ] }),
  ev({ id: 'ya_exam_stress', category: 'school', title: 'Eksamensperiode', text: 'Eksamen nærmer seg, og du ligger bakpå med pensum.', minAge: 18, maxAge: 35, weight: 8, tone: 'neutral', icon: 'book-open', conditions: [C.enrolled(['bachelor', 'master', 'phd', 'upperSecondary'])], cooldown: 2, maxOccurrences: 4,
    choices: [
      choice('Lese natt og dag', [good('Du klarte deg strålende!', [school(8), stress(6), health(-1)], { bias: [bias('intelligence', 0.5)] }), out('Du klarte deg, men var helt utslitt.', [school(4), stress(8)])]),
      pick('Danne kollokviegruppe', 'Sammen gikk det mye lettere.', [school(5), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Ta det som det kommer', 'Det gikk sånn passe.', [school(-3), stress(-2)], 'neutral'),
    ] }),
  ev({ id: 'ya_student_job', category: 'career', title: 'Studentjobb', text: 'Du kan få deltidsjobb ved siden av studiene.', minAge: 18, maxAge: 29, weight: 6, tone: 'financial', icon: 'briefcase', conditions: [C.enrolled(['bachelor', 'master'])], cooldown: 2, maxOccurrences: 2,
    choices: [
      pick('Ta jobben', 'Ekstra penger, men mindre tid til lesing.', [money(60_000, 'Studentjobb'), school(-4), stress(3), disc(1)], 'financial'),
      pick('Fokusere på studiene', 'Nudler til middag, men gode karakterer.', [school(3)], 'neutral'),
    ] }),
  ev({ id: 'ya_flatmate_conflict', category: 'social', title: 'Kollektivkrangel', text: 'Romkameraten din spiser maten din og vasker aldri opp.', minAge: 18, maxAge: 30, weight: 4, tone: 'negative', icon: 'utensils', conditions: [C.home(false), C.homeowner(false)], maxOccurrences: 1,
    choices: [
      pick('Lage vaskeliste', 'Det funket i to uker. Så var det like ille.', [stress(2)], 'neutral'),
      pick('Ta et oppgjør', 'Det ble en kjempekrangel, men nå er det rent.', [stress(3), rep(-1), happy(1)], 'neutral'),
      pick('Flytte ut', 'Du fant en hybel for deg selv. Dyrere, men fredelig.', [money(-10_000, 'Flytting'), happy(3)], 'positive'),
    ] }),
  ev({ id: 'ya_serious_relationship', category: 'love', title: 'Noe seriøst', text: 'Du møtte noen spesielle på en venns bursdag.', minAge: 19, maxAge: 35, weight: 7, tone: 'relationship', icon: 'heart', conditions: [C.noPartner(), C.prison(false)], cooldown: 2,
    mods: [mod(C.stat('appearance', 60), 1.5), mod(C.trait('charismatic'), 1.5), mod(C.trait('shy'), 0.6)],
    choices: [
      choice('Be om nummeret', [good('Dere har vært sammen hver dag siden. {newPerson} er noe for seg selv.', [{ t: 'newRel', kind: 'partner' }, happy(7)], { w: 2, bias: [bias('appearance', 0.4)] }), bad('Du fikk nummeret – til et pizzeria.', [happy(-2)], { w: 1 })]),
      pick('Vente på at de tar kontakt', 'De gjorde det aldri.', [happy(-1)], 'neutral'),
    ] }),
  ev({ id: 'ya_move_in_together', category: 'love', title: 'Flytte sammen?', text: '{target} spør om dere skal flytte sammen.', minAge: 18, maxAge: 60, weight: 6, tone: 'relationship', icon: 'home', target: { kinds: ['partner'], minStrength: 60 }, maxOccurrences: 1,
    choices: [
      pick('Ja!', 'Dere fant en leilighet sammen. IKEA-møbler ble satt sammen med kun én krangel.', [rel('bound', 10), { t: 'moveOut' }, happy(5), flag('cohabiting')], 'positive'),
      pick('Ikke ennå', '{target} ble litt såret, men forsto.', [rel('bound', -6)], 'neutral'),
    ] }),
  ev({ id: 'ya_partner_proposes', category: 'love', title: 'Frieri', text: '{target} går ned på kne og spør om du vil gifte deg.', minAge: 20, maxAge: 70, weight: 5, tone: 'milestone', icon: 'gem', target: { kinds: ['partner'], minStrength: 65 }, maxOccurrences: 2,
    conditions: [C.married(false)],
    choices: [
      choice('Si ja – stort bryllup', [good('Et bryllup med 120 gjester, bunad og tale fra bestemor!', [{ t: 'marry' }, money(-180_000, 'Bryllup'), rep(3)])], { cost: 180_000 }),
      pick('Si ja – lite bryllup', 'Et intimt bryllup med de nærmeste. Perfekt.', [{ t: 'marry' }, money(-30_000, 'Bryllup')], 'milestone'),
      pick('Si nei', 'Det ble stille lenge. Forholdet tok seg aldri helt opp igjen.', [rel('bound', -30), happy(-6)], 'negative'),
    ] }),
  ev({ id: 'ya_cheating_temptation', category: 'love', title: 'Fristelse', text: 'En kollega flørter heftig med deg på julebordet. {partner} er hjemme.', minAge: 20, maxAge: 60, weight: 4, tone: 'neutral', icon: 'wine', conditions: [C.rel(['partner', 'spouse']), C.employed()], cooldown: 6,
    choices: [
      choice('Gi etter', [out('Ingen fant ut av det. Men samvittigheten gnager.', [happy(-2), stress(4), later('ya_affair_discovered', 2)], { w: 2 }), bad('{partner} fant ut av det samme kveld.', [rel('partner', -40, -40), happy(-8)], { w: 1 })]),
      pick('Dra hjem', 'Du dro hjem og ga {partner} en klem.', [rel('partner', 4), disc(2)], 'positive'),
    ] }),
  ev({ id: 'ya_affair_discovered', category: 'love', title: 'Avslørt', text: '{partner} har funnet meldinger på telefonen din.', minAge: 20, maxAge: 70, weight: 0, scheduledOnly: true, tone: 'negative', icon: 'smartphone', conditions: [C.rel(['partner', 'spouse'])],
    choices: [
      choice('Innrømme alt og be om tilgivelse', [out('Dere går i parterapi. Tilliten må bygges opp igjen.', [rel('partner', -25, -40), stress(6)], { w: 1 }), bad('Det var over. {partner} pakket kofferten.', [{ t: 'endRel', target: 'partner', to: 'ex' }, happy(-8)], { w: 1 })]),
      choice('Benekte alt', [bad('Løgnen gjorde det bare verre. Det ble brudd.', [{ t: 'endRel', target: 'partner', to: 'ex' }, happy(-10), rep(-3)], { w: 2 }), out('{partner} valgte å tro deg. For nå.', [rel('partner', -10, -20)], { w: 1 })]),
    ] }),
  ev({ id: 'ya_unplanned_pregnancy', category: 'love', title: 'Overraskelse', text: 'Graviditetstesten er positiv. Dere hadde ikke planlagt dette.', minAge: 18, maxAge: 40, weight: 2, tone: 'milestone', icon: 'baby', conditions: [C.rel(['partner', 'spouse']), C.children(0, 0)], maxOccurrences: 1,
    choices: [
      pick('Beholde barnet', 'Livet ble snudd på hodet – på den beste måten.', [{ t: 'baby' }, stress(6)], 'milestone'),
      pick('Vente med barn', 'Dere tok et vanskelig valg sammen. Det ble ikke barn denne gang.', [stress(5), happy(-3), rel('partner', -3)], 'neutral'),
    ] }),
  ev({ id: 'ya_first_apartment_offer', category: 'money', title: 'Leilighet til salgs', text: 'En liten leilighet i et populært strøk er lagt ut for salg.', minAge: 20, maxAge: 35, weight: 4, tone: 'financial', icon: 'building', conditions: [C.homeowner(false), C.employed(), C.money(250_000)], maxOccurrences: 1,
    choices: [
      pick('Kjøpe den via Økonomi-fanen', 'Du har noen dager på deg. Gå til Økonomi → Eiendom for å by.', [flag('lookingForHome')], 'neutral'),
      pick('Fortsette å leie', 'Kanskje boligprisene faller.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_bsu', category: 'money', title: 'Boligsparing for ungdom', text: 'Banken anbefaler BSU med skattefradrag.', minAge: 18, maxAge: 33, weight: 3, tone: 'financial', icon: 'piggy-bank', maxOccurrences: 1, conditions: [C.money(30_000)],
    choices: [
      pick('Sette inn 27 500 kr i året', 'Skattefradraget gir deg litt ekstra hvert år.', [money(-27_500, 'BSU-innskudd'), { t: 'delayed', years: 3, text: 'BSU-kontoen har vokst med renter og skattefradrag.', tone: 'financial', effects: [money(95_000, 'BSU utbetalt')] }, disc(2)], 'financial'),
      pick('Bruke pengene nå', 'YOLO.', [happy(1)], 'neutral'),
    ] }),
  ev({ id: 'ya_credit_card', category: 'money', title: 'Kredittkort', text: 'Du får tilbud om et kredittkort med 50 000 kr i ramme og «gratis» reiseforsikring.', minAge: 18, maxAge: 40, weight: 4, tone: 'financial', icon: 'credit-card', maxOccurrences: 1,
    choices: [
      choice('Ta kortet og bruke det', [bad('Du handlet mer enn du burde. Renta er brutal.', [{ t: 'debt', kind: 'consumer', amount: 35_000, label: 'Kredittkortgjeld' }, happy(3)], { w: 2, mods: [mod(C.trait('impulsive'), 2)] }), good('Du betalte alltid i tide og fikk bonuspoeng.', [disc(2)], { w: 1, mods: [mod(C.trait('frugal'), 3)] })]),
      pick('Takke nei', 'Du holder deg til debetkort.', [disc(1)], 'positive'),
    ] }),
  ev({ id: 'ya_crypto', category: 'money', title: 'Kryptofeber', text: 'En venn har tjent seg rik på en ny kryptovaluta og vil at du skal investere {amount}.', minAge: 18, maxAge: 50, weight: 3, tone: 'financial', icon: 'bitcoin', maxOccurrences: 1,
    vars: { amount: { t: 'range', min: 10_000, max: 50_000, step: 1000 } }, conditions: [C.money(10_000)],
    choices: [
      choice('Investere', [good('Kursen gikk til himmels! Du solgte med tidobbel gevinst.', [{ t: 'moneyVar', v: 'amount', mult: 9, label: 'Kryptogevinst' }, happy(6)], { w: 1 }), bad('Kursen krasjet. Pengene er borte.', [pay('amount', 'Kryptotap'), happy(-4)], { w: 3 }), out('Kursen gikk opp og ned. Du kom ut i null.', [], { w: 1 })], { cost: 'amount' }),
      pick('Holde deg unna', 'Du sover godt om natta.', [disc(1)], 'neutral'),
    ] }),
  ev({ id: 'ya_job_interview_nerves', category: 'career', title: 'Jobbintervju', text: 'Du har jobbintervju i morgen for en stilling du virkelig ønsker deg.', minAge: 18, maxAge: 40, weight: 4, tone: 'neutral', icon: 'mic', maxOccurrences: 1, conditions: [C.employed(false), C.student(false)],
    choices: [
      choice('Forberede deg grundig', [good('Intervjuet gikk strålende. De ringer deg!', [rep(3), flag('network'), happy(3)], { bias: [bias('discipline', 0.5)] }), out('Det gikk greit. Du lærte mye.', [disc(1)])]),
      pick('Improvisere', 'Det ble mye «ehh». De valgte noen andre.', [happy(-2)], 'negative'),
    ] }),
  ev({ id: 'ya_quarter_life_crisis', category: 'random', title: 'Hva gjør jeg med livet?', text: 'Alle andre ser ut til å ha funnet sin vei. Du føler deg fastlåst.', minAge: 24, maxAge: 30, weight: 4, tone: 'neutral', icon: 'compass', maxOccurrences: 1,
    choices: [
      pick('Reise jorda rundt', 'Seks måneder med ryggsekk. Du fant ut hva som betyr noe.', [money(-60_000, 'Jordomseiling'), happy(8), stress(-8), smart(2), { t: 'count', key: 'trips' }], 'positive'),
      pick('Begynne i terapi', 'Det var nyttig å sortere tankene.', [stress(-6), happy(3)], 'positive'),
      pick('Bite det i deg', 'Det gikk over. Mer eller mindre.', [stress(3)], 'neutral'),
    ] }),
  ev({ id: 'ya_wedding_invite', category: 'social', title: 'Bryllupssesong', text: 'Du er invitert i tre bryllup i sommer.', minAge: 24, maxAge: 40, weight: 4, tone: 'neutral', icon: 'gem', maxOccurrences: 2, cooldown: 4,
    choices: [
      pick('Gå i alle', 'Gaver, kjoler/dresser og hotell kostet en formue. Men så gøy!', [money(-18_000, 'Bryllupsgjest'), happy(4), rel('friend', 6)], 'positive'),
      pick('Velge ett', 'Du gikk i det viktigste.', [money(-5_000, 'Bryllupsgjest'), happy(2)], 'neutral'),
    ] }),
  ev({ id: 'ya_friend_loan', category: 'money', title: 'Lån til en venn', text: 'Din gode venn {target} har kommet i pengetrøbbel og spør om å låne {amount}.', minAge: 18, maxAge: 70, weight: 6, tone: 'financial', icon: 'hand-coins',
    target: { kinds: ['friend', 'bestFriend'], minAge: 18 }, vars: { amount: { t: 'range', min: 10_000, max: 25_000, step: 1000 } }, cooldown: 5,
    choices: [
      choice('Låne ut hele beløpet', [good('{target} var utrolig takknemlig og betalte tilbake etter ett år.', [rel('bound', 10, 10), delayed(1, '{target} betalte tilbake lånet. Vennskapet er sterkere enn noensinne.', 'positive', [gain('amount', 'Tilbakebetalt lån'), rel('bound', 5)])], { w: 2 }), bad('{target} fikk pengene – og sluttet å svare på meldinger.', [{ t: 'lend', target: 'bound', v: 'amount', mult: 1 }, rel('bound', -10, -30)], { w: 1 })], { cost: 'amount' }),
      pick('Avslå høflig', '{target} forsto, men det ble litt kjølig en stund.', [rel('bound', -6)], 'neutral'),
      pick('Låne ut halvparten', '{target} ble glad for hjelpen.', [{ t: 'lend', target: 'bound', v: 'amount', mult: 0.5 }, rel('bound', 5)], 'neutral'),
      choice('Kreve renter', [out('{target} godtok rentene, men syntes du var kald.', [{ t: 'lend', target: 'bound', v: 'amount', mult: 1 }, rel('bound', -8)], { w: 1 })], { cost: 'amount' }),
    ] }),
  ev({ id: 'ya_side_project', category: 'career', title: 'Sideprosjekt', text: 'Du har en idé til en app som kan løse et irriterende problem.', minAge: 18, maxAge: 45, weight: 3, tone: 'neutral', icon: 'lightbulb', maxOccurrences: 1,
    choices: [
      choice('Bruke kveldene på å bygge den', [good('Appen fikk tusenvis av brukere, og et selskap kjøpte den!', [money(400_000, 'Salg av app'), rep(5), smart(2)], { w: 1, bias: [bias('intelligence', 0.8)] }), out('Appen fikk noen få brukere. Lærerikt!', [smart(3), stress(3)], { w: 3 })]),
      pick('Glemme idéen', 'Tre år senere lanserte noen andre den samme idéen.', [happy(-2)], 'neutral'),
    ] }),
  ev({ id: 'ya_roadtrip', category: 'social', title: 'Biltur', text: 'Vennegjengen vil kjøre Nordkapp rundt på tre uker.', minAge: 18, maxAge: 35, weight: 3, tone: 'positive', icon: 'car', maxOccurrences: 1, conditions: [C.flag('license')],
    choices: [
      pick('Bli med', 'Midnattssol, reinsdyr på veien og venner for livet.', [money(-12_000, 'Biltur'), happy(7), rel('friend', 10), stress(-6)], 'positive'),
      pick('Jobbe i stedet', 'Du tjente penger, men så bildene på Instagram.', [money(20_000, 'Sommerjobb'), happy(-2)], 'neutral'),
    ] }),
  ev({ id: 'ya_drunk_driving', category: 'crime', title: 'Etter festen', text: 'Du har drukket et par øl, og det er langt å gå hjem. Bilen står rett utenfor.', minAge: 18, maxAge: 70, weight: 2, tone: 'neutral', icon: 'car', conditions: [C.flag('license')], maxOccurrences: 1,
    choices: [
      choice('Kjøre likevel', [out('Du kom hjem uten problemer, men skjelvende.', [disc(-4)], { w: 2 }), bad('Politikontroll.', [{ t: 'crime', crime: 'dui', severity: 2 }, { t: 'unflag', key: 'license' }], { w: 2 }), bad('Du kjørte av veien og skadet deg alvorlig.', [cond('injury', 70), health(-20), { t: 'crime', crime: 'dui', severity: 3 }], { w: 0.5 })]),
      pick('Ta taxi', 'Dyrt, men riktig.', [money(-900, 'Taxi'), disc(2)], 'positive'),
    ] }),
  ev({ id: 'ya_parental_help_money', category: 'family', title: 'Hjelp fra foreldrene', text: 'Foreldrene dine tilbyr å hjelpe deg med egenkapital til bolig.', minAge: 22, maxAge: 40, weight: 5, tone: 'financial', icon: 'hand-heart', conditions: [C.homeowner(false), C.bg(['wealthy', 'middle'])], maxOccurrences: 1,
    choices: [
      pick('Ta imot', 'Du fikk {amount} som forskudd på arv.', [gain('amount', 'Forskudd på arv'), rel('mother', 4), rel('father', 4)], 'financial'),
      pick('Klare deg selv', 'Du ville stå på egne bein. Foreldrene dine respekterte det.', [disc(3), rep(1)], 'positive'),
    ], vars: { amount: { t: 'range', min: 150_000, max: 600_000, step: 10_000 } }, mods: [mod(C.bg('wealthy'), 2)] }),
  ev({ id: 'ya_sick_leave', category: 'health', title: 'Utslitt', text: 'Du er konstant sliten og har vondt i hodet hver dag.', minAge: 20, maxAge: 64, weight: 3, tone: 'negative', icon: 'battery-low', conditions: [C.stat('stress', 70), C.employed()], cooldown: 3,
    choices: [
      pick('Ta sykemelding', 'To ukers hvile hjalp deg å hente deg inn.', [stress(-15), perf(-4), health(3)], 'positive'),
      pick('Presse gjennom', 'Du klarte deg – men kroppen protesterte.', [stress(5), health(-5), cond('burnout', 45)], 'negative'),
    ] }),
  ev({ id: 'ya_cohabitant_fight', category: 'love', title: 'Krangel om husarbeid', text: '{target} mener du ikke gjør din del hjemme.', minAge: 18, maxAge: 80, weight: 5, tone: 'relationship', icon: 'home', target: { kinds: ['partner', 'spouse'] }, cooldown: 3,
    choices: [
      pick('Ta mer ansvar', 'Huset ble renere, og {target} smilte mer.', [rel('bound', 6), disc(2), stress(1)], 'positive'),
      pick('Foreslå vaskehjelp', 'Det kostet litt, men freden var verdt det.', [money(-20_000, 'Vaskehjelp'), rel('bound', 4)], 'neutral'),
      pick('Forsvare deg', 'Dere la dere sure.', [rel('bound', -8), stress(2)], 'negative'),
    ] }),
  ev({ id: 'ya_phd_offer', category: 'career', title: 'Stipendiatstilling', text: 'Veilederen din spør om du vil ta doktorgrad.', minAge: 23, maxAge: 40, weight: 4, tone: 'positive', icon: 'scroll', conditions: [C.edu('master'), C.stat('intelligence', 68), C.student(false)], maxOccurrences: 1,
    choices: [
      pick('Si ja', 'Du begynner som stipendiat – med lønn!', [{ t: 'enroll', programId: 'phd' }, rep(3)], 'positive'),
      pick('Gå ut i arbeidslivet', 'Du vil heller tjene penger.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_dropout_doubt', category: 'school', title: 'Feil studium?', text: 'Du trives ikke på studiet ditt og lurer på om du har valgt feil.', minAge: 18, maxAge: 30, weight: 4, tone: 'neutral', icon: 'help-circle', conditions: [C.enrolled(['bachelor', 'master'])], maxOccurrences: 1,
    choices: [
      pick('Fullføre likevel', 'Du bet tennene sammen.', [disc(3), stress(3)], 'neutral'),
      pick('Snakke med studieveileder', 'Veilederen hjalp deg å se nye muligheter innen faget.', [school(4), happy(2)], 'positive'),
      pick('Slutte og finne noe annet', 'Du sluttet. Nå kan du søke på noe nytt via Karriere-fanen.', [{ t: 'flag', key: 'droppedOutUni' }, happy(1)], 'neutral'),
    ] }),
  ev({ id: 'ya_new_city', category: 'random', title: 'Ny by?', text: 'Du får lyst til å prøve livet i en annen by.', minAge: 20, maxAge: 35, weight: 2, tone: 'neutral', icon: 'map', maxOccurrences: 1, conditions: [C.homeowner(false)],
    choices: [
      pick('Flytte!', 'Ny by, nye muligheter. Du savner vennene dine, men har det spennende.', [happy(3), rel('friend', -15), { t: 'newRel', kind: 'friend' }, money(-15_000, 'Flytting')], 'neutral'),
      pick('Bli der du er', 'Hjemme er hjemme.', [rel('friend', 3)], 'neutral'),
    ] }),
  ev({ id: 'ya_festival', category: 'social', title: 'Festival', text: 'Billettene til årets store musikkfestival er sluppet.', minAge: 18, maxAge: 40, weight: 4, tone: 'positive', icon: 'music', cooldown: 3,
    choices: [
      pick('Kjøpe festivalpass', 'Tre dager med musikk, gjørme og lykke.', [money(-4_500, 'Festival'), happy(6), stress(-4), health(-1)], 'positive'),
      pick('Se på strømming', 'Ikke det samme, men billig.', [happy(1)], 'neutral'),
    ] }),
  ev({ id: 'ya_gym_injury', category: 'health', title: 'Skade på trening', text: 'Du løftet for tungt på treningssenteret.', minAge: 18, maxAge: 55, weight: 2, tone: 'negative', icon: 'dumbbell', conditions: [C.stat('fitness', 55)], maxOccurrences: 1,
    outcomes: [bad('Ryggen sa stopp. Det ble fysioterapi i månedsvis.', [cond('back_pain', 50), fit(-5), happy(-3)])] }),
  ev({ id: 'ya_lost_friend_contact', category: 'social', title: 'Gamle venner', text: 'Du innser at du ikke har snakket med {target} på et år.', minAge: 20, maxAge: 70, weight: 4, tone: 'relationship', icon: 'phone', target: { kinds: ['friend', 'bestFriend'], maxStrength: 45 }, cooldown: 4,
    choices: [
      pick('Ringe {targetHim}', 'Dere pratet i to timer, som om ingen tid hadde gått.', [rel('bound', 15), happy(3)], 'positive'),
      pick('La det være', 'Noen vennskap har sin tid.', [rel('bound', -10)], 'neutral'),
    ] }),
  ev({ id: 'ya_scam_call', category: 'money', title: 'Mistenkelig telefon', text: '«Banken» ringer og sier kontoen din er hacket. De trenger BankID-koden din.', minAge: 18, maxAge: 100, weight: 3, tone: 'negative', icon: 'phone-off', cooldown: 10,
    mods: [mod({ t: 'stat', key: 'intelligence', max: 40 }, 2)],
    choices: [
      choice('Gi dem koden', [bad('Det var svindlere. De tømte kontoen for {amount}.', [pay('amount', 'Svindel'), happy(-6), stress(6)], { w: 4 }), out('Banken stoppet transaksjonen i siste liten.', [stress(4)], { w: 1 })]),
      pick('Legge på og ringe banken selv', 'Det var svindel. Banken takket for varselet.', [disc(2), smart(1)], 'positive'),
    ], vars: { amount: { t: 'range', min: 8_000, max: 40_000, step: 1000 } } }),
  ev({ id: 'ya_ex_returns', category: 'love', title: 'Eksen tar kontakt', text: '{target} sender deg en melding: «Jeg har tenkt mye på oss.»', minAge: 18, maxAge: 60, weight: 3, tone: 'relationship', icon: 'message-circle-heart', target: { kinds: ['ex'] }, cooldown: 5,
    choices: [
      choice('Gi det en ny sjanse', [good('Dere fant tilbake til hverandre!', [{ t: 'promoteRel', target: 'bound', kind: 'partner' }, rel('bound', 30), { t: 'rel', target: 'bound', attraction: 30 }, happy(5)], { w: 1 }), bad('Det var like ille som sist.', [rel('bound', -10), happy(-3)], { w: 1 })], { cond: [C.noPartner()] }),
      pick('Ignorere meldingen', 'Det som var, var.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_parents_divorce_late', category: 'family', title: 'Sølvbryllup – eller ikke', text: 'Foreldrene dine forteller at de skal skilles etter mange år.', minAge: 18, maxAge: 45, weight: 1, tone: 'negative', icon: 'heart-crack', conditions: [C.rel('mother'), C.rel('father'), C.flag('parentsDivorced', false), C.not(C.bg('single'))], maxOccurrences: 1,
    outcomes: [bad('Julen blir aldri den samme. Men begge virker lettere til sinns.', [happy(-4), stress(3), flag('parentsDivorced')])] }),
  ev({ id: 'ya_student_loan_letter', category: 'money', title: 'Brev fra Lånekassen', text: 'Første nedbetalingsbrev fra Lånekassen har kommet.', minAge: 21, maxAge: 35, weight: 5, tone: 'financial', icon: 'mail', conditions: [C.debt(50_000, undefined, 'student'), C.student(false)], maxOccurrences: 1,
    choices: [
      pick('Betale ned ekstra', 'Du betalte ned mer enn minimum. Fremtidige deg takker.', [{ t: 'debt', kind: 'student', amount: -20_000, label: 'Studielån' }, disc(2)], 'financial'),
      pick('Følge nedbetalingsplanen', 'Fast trekk hver måned.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_flatmate_romance', category: 'love', title: 'Romkamerat-romanse', text: 'Du og romkameraten din har begynt å se på hverandre på en ny måte.', minAge: 18, maxAge: 30, weight: 2, tone: 'relationship', icon: 'heart', conditions: [C.noPartner(), C.home(false)], maxOccurrences: 1,
    choices: [
      choice('Ta sjansen', [good('Det ble deg og {newPerson}. Husleia ble delt på to – på en ny måte.', [{ t: 'newRel', kind: 'partner' }, happy(6)], { w: 2 }), bad('Det ble kleint. Én av dere måtte flytte.', [happy(-4), money(-8_000, 'Flytting')], { w: 1 })]),
      pick('Holde det profesjonelt', 'Kollektivfred er hellig.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_apprentice_praise', category: 'career', title: 'Mesterens ros', text: 'Læremesteren din er imponert over arbeidet ditt.', minAge: 17, maxAge: 22, weight: 6, tone: 'positive', icon: 'hammer', conditions: [C.enrolled('vocational')], maxOccurrences: 1,
    outcomes: [good('Du får tilbud om fast jobb etter fagbrevet!', [school(6), rep(3), flag('network')])] }),
  ev({ id: 'ya_volunteer_abroad', category: 'social', title: 'Frivillig i utlandet', text: 'En organisasjon søker frivillige til et skoleprosjekt i Afrika.', minAge: 19, maxAge: 30, weight: 2, tone: 'positive', icon: 'globe', maxOccurrences: 1, conditions: [C.employed(false)],
    choices: [
      pick('Reise ut et halvt år', 'Du lærte mer om verden enn noen bok kunne lære deg.', [rep(5), smart(3), happy(5), money(-20_000, 'Frivillig tjeneste'), { t: 'count', key: 'trips' }], 'positive'),
      pick('Ikke nå', 'Kanskje en dag.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_engagement_pressure', category: 'love', title: 'Når skal dere gifte dere?', text: 'Familien maser om at du og {target} burde gifte dere.', minAge: 24, maxAge: 45, weight: 3, tone: 'relationship', icon: 'gem', target: { kinds: ['partner'], minStrength: 55 }, maxOccurrences: 1, conditions: [C.married(false)],
    choices: [
      pick('Fri selv', 'Gå til Relasjoner og fri når øyeblikket føles riktig!', [rel('bound', 3)], 'neutral'),
      pick('Si at dere har det fint som samboere', 'Familien sukket, men slo seg til ro.', [rel('bound', 2)], 'neutral'),
    ] }),
  ev({ id: 'ya_lottery_ticket_found', category: 'random', title: 'Gammelt lodd', text: 'Du finner en gammel lottokupong i en jakkelomme.', minAge: 18, maxAge: 100, weight: 1.5, tone: 'neutral', icon: 'ticket', maxOccurrences: 1,
    outcomes: [out('Den var ikke verdt noe. Selvfølgelig.', [], { w: 9 }), good('Den hadde 5 rette! Du vant {amount}!', [gain('amount', 'Lottogevinst'), happy(5)], { w: 1 })], vars: { amount: { t: 'range', min: 20_000, max: 60_000, step: 1000 } } }),
  ev({ id: 'ya_unemployed_struggle', category: 'career', title: 'Arbeidsledig', text: 'Du har søkt jobber i månedsvis uten hell. NAV kaller deg inn til møte.', minAge: 19, maxAge: 60, weight: 6, tone: 'negative', icon: 'briefcase', conditions: [C.employed(false), C.student(false), C.retired(false), C.prison(false)], cooldown: 2,
    choices: [
      pick('Ta et arbeidsmarkedskurs', 'Kurset ga deg nye ferdigheter og et kontaktnett.', [smart(2), flag('network'), disc(2)], 'positive'),
      pick('Ta hvilken som helst jobb', 'Du fikk jobb på et lager inntil videre. Søk via Karriere for noe bedre.', [money(80_000, 'Midlertidig jobb'), happy(-1), disc(2)], 'neutral'),
      pick('Ta en pause', 'Du trengte litt tid for deg selv.', [stress(-4), happy(-2)], 'neutral'),
    ] }),
  ev({ id: 'ya_bachelor_party', category: 'social', title: 'Utdrikningslag', text: 'Du skal planlegge utdrikningslaget til {target}.', minAge: 22, maxAge: 45, weight: 3, tone: 'positive', icon: 'party-popper', target: { kinds: ['bestFriend', 'friend', 'sibling'], minAge: 22 }, maxOccurrences: 1,
    choices: [
      choice('En helg i Riga', [good('Legendarisk! {target} vil aldri glemme det (men husker ingenting).', [money(-8_000, 'Utdrikningslag'), rel('bound', 12), happy(5)], { w: 3 }), bad('{target} brakk armen på gokartbanen.', [rel('bound', -4), money(-8_000, 'Utdrikningslag')], { w: 1 })]),
      pick('Rolig middag og quiz', 'Koselig og minneverdig.', [money(-2_000, 'Utdrikningslag'), rel('bound', 8)], 'positive'),
    ] }),
  ev({ id: 'ya_mentor_offer', category: 'career', title: 'Mentor', text: 'En erfaren leder tilbyr seg å være mentoren din.', minAge: 21, maxAge: 40, weight: 3, tone: 'positive', icon: 'user-check', conditions: [C.employed()], maxOccurrences: 1,
    choices: [
      pick('Takke ja', 'Mentoren åpnet dører du ikke visste fantes.', [perf(10), rep(3), flag('network'), smart(1)], 'positive'),
      pick('Takke nei', 'Du vil klare deg selv.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_paid_internship', category: 'career', title: 'Sommerinternship', text: 'Et stort selskap tilbyr deg sommerjobb som praktikant.', minAge: 19, maxAge: 27, weight: 4, tone: 'positive', icon: 'building-2', conditions: [C.enrolled(['bachelor', 'master']), C.stat('intelligence', 55)], maxOccurrences: 1,
    choices: [
      choice('Ta internshipet', [good('Du imponerte alle og fikk løfte om fast jobb etter studiene!', [money(60_000, 'Internship'), flag('network'), rep(3)], { w: 2, bias: [bias('discipline', 0.5)] }), out('Det var mye kaffehenting, men god erfaring.', [money(60_000, 'Internship'), disc(2)], { w: 2 })]),
      pick('Ta ferie', 'Du trengte hvilen.', [stress(-5), happy(3)], 'neutral'),
    ] }),
  ev({ id: 'ya_hostel_romance', category: 'love', title: 'Feriekjærlighet', text: 'På ferie møter du noen som får hjertet ditt til å banke.', minAge: 18, maxAge: 35, weight: 2, tone: 'relationship', icon: 'tree-palm', conditions: [C.noPartner()], maxOccurrences: 1,
    choices: [
      choice('Prøve langdistanse', [good('Det holdt! {newPerson} flyttet til Norge for deg.', [{ t: 'newRel', kind: 'partner' }, happy(6)], { w: 1 }), bad('Det ble for vanskelig. Dere glemmer aldri sommeren.', [happy(-3)], { w: 2 })]),
      pick('Nyte øyeblikket', 'En sommer å huske.', [happy(4)], 'positive'),
    ] }),
  ev({ id: 'ya_skill_burnout_student', category: 'health', title: 'Studiestress', text: 'Du har panikkangst før hver forelesning.', minAge: 18, maxAge: 30, weight: 3, tone: 'negative', icon: 'heart-pulse', conditions: [C.student(), C.stat('stress', 65)], maxOccurrences: 1,
    choices: [
      pick('Ta kontakt med studenthelsetjenesten', 'Samtaler og verktøy hjalp deg å mestre det.', [stress(-10), happy(3)], 'positive'),
      pick('Ta permisjon et semester', 'Du hentet deg inn, men ble forsinket.', [stress(-15), school(-6)], 'neutral'),
      pick('Ignorere det', 'Det utviklet seg til en angstlidelse.', [cond('anxiety', 50), happy(-5)], 'negative'),
    ] }),
  ev({ id: 'ya_dog_adoption', category: 'random', title: 'Hund?', text: 'Dyrebeskyttelsen har en hund som trenger et hjem.', minAge: 20, maxAge: 75, weight: 2, tone: 'positive', icon: 'dog', conditions: [C.flag('pet', false), C.home(false)], maxOccurrences: 1,
    choices: [
      pick('Adoptere', 'Tassen ble familiens midtpunkt. Turer hver dag!', [{ t: 'adoptPet' }, happy(6), fit(3), money(-10_000, 'Hund')], 'positive'),
      pick('Ikke nå', 'Det er en stor forpliktelse.', [], 'neutral'),
    ] }),
  ev({ id: 'ya_health_check_young', category: 'health', title: 'Bedriftshelsetjenesten', text: 'Arbeidsgiveren tilbyr gratis helsesjekk.', minAge: 20, maxAge: 64, weight: 3, tone: 'neutral', icon: 'stethoscope', conditions: [C.employed()], cooldown: 8,
    outcomes: [good('Alt så fint ut. Fortsett sånn!', [stress(-2)], { w: 3, bias: [bias('health', 0.6)] }), bad('Blodtrykket var høyt. Legen ba deg ta det på alvor.', [cond('hypertension', 30)], { w: 1 })] }),
];

