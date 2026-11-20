import type { EventDef } from '@/types/events';
import { C, bad, bias, choice, cond, disc, ev, fit, flag, gain, good, happy, health, later, looks, money, out, pay, perf, pick, rel, rep, school, smart, stress } from './helpers';

/** Additional everyday events across all life stages (content pack 2). */
export const EVERYDAY_EVENTS: EventDef[] = [
  // ── Early childhood ──────────────────────────────────────
  ev({ id: 'e2_knitted_sweater', category: 'family', title: 'Strikkegenser', text: '{target} har strikket en ullgenser til deg. Den klør fryktelig.', minAge: 2, maxAge: 9, weight: 5, tone: 'relationship', icon: 'shirt', target: { kinds: ['grandparent'] }, maxOccurrences: 1,
    choices: [
      pick('Bruke den likevel', '{target} lyste opp hver gang du hadde den på.', [rel('bound', 10), happy(-1)], 'positive'),
      pick('Gjemme den i skapet', '{target} spurte etter genseren ved hvert besøk.', [rel('bound', -4)], 'neutral'),
    ] }),
  ev({ id: 'e2_afraid_dark', category: 'family', title: 'Monsteret under senga', text: 'Du er sikker på at det bor et monster under senga.', minAge: 3, maxAge: 7, weight: 5, tone: 'neutral', icon: 'ghost', maxOccurrences: 1,
    choices: [
      pick('Rope på mamma hver natt', 'Mamma ble trøtt, men monsteret forsvant til slutt.', [rel('mother', 3), stress(2)], 'neutral'),
      pick('Lage monsterfelle av lego', 'Fella fungerte! Ingen monstre er sett siden.', [smart(2), disc(1), happy(2)], 'positive'),
    ] }),
  ev({ id: 'e2_lost_teddy', category: 'random', title: 'Bamsen er borte', text: 'Kosebamsen din ble glemt igjen på bussen.', minAge: 2, maxAge: 7, weight: 4, tone: 'negative', icon: 'heart-crack', maxOccurrences: 1,
    outcomes: [good('Bussjåføren leverte den på hittegods. Gjensynsgleden var enorm!', [happy(4)], { w: 1 }), bad('Bamsen var borte for alltid. Du sørget lenge.', [happy(-5)], { w: 1 })] }),
  ev({ id: 'e2_first_snow', category: 'random', title: 'Første snø', text: 'Det har snødd for første gang i vinter, og du står i vinduet.', minAge: 2, maxAge: 6, weight: 4, tone: 'positive', icon: 'snowflake', maxOccurrences: 1,
    outcomes: [good('Du lagde din første snøengel og spiste minst like mye snø.', [happy(4), fit(1)])] }),
  ev({ id: 'e2_health_station', category: 'health', title: 'Helsestasjonen', text: 'Helsesykepleieren måler, veier og stiller spørsmål.', minAge: 0, maxAge: 4, weight: 5, tone: 'neutral', icon: 'stethoscope', maxOccurrences: 1, conditions: [C.year(1950)],
    outcomes: [good('Alt så fint ut. Du er litt over snittet på høyde!', [health(2)], { w: 3 }), out('Hun anbefalte litt mer frukt og mindre saft.', [disc(1)], { w: 1 })] }),

  // ── Childhood ────────────────────────────────────────────
  ev({ id: 'e2_class_pet', category: 'school', title: 'Klassens marsvin', text: 'Du får ta med klassens marsvin hjem i høstferien.', minAge: 6, maxAge: 10, weight: 4, tone: 'neutral', icon: 'heart', maxOccurrences: 1,
    choices: [
      choice('Passe på det som en skatt', [good('Marsvinet koste seg. Læreren ga deg et diplom.', [disc(2), rep(2)], { w: 4 }), bad('Marsvinet rømte inn i veggen. Det ble funnet etter tre dager.', [stress(4), rep(-1)], { w: 1 })]),
      pick('Overlate det til lillesøsken', 'Det gikk … overraskende bra.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_choir', category: 'school', title: 'Barnekoret', text: 'Musikklæreren mener du har en fin stemme og vil ha deg med i koret.', minAge: 7, maxAge: 12, weight: 4, tone: 'positive', icon: 'music', maxOccurrences: 1,
    choices: [
      pick('Bli med', 'Du sang solo på julekonserten. Bestemor gråt.', [flag('musical'), rep(3), happy(3)], 'positive'),
      pick('Nei, kor er kleint', 'Du holdt deg til fotballen.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_strawberry_job', category: 'money', title: 'Jordbærplukking', text: 'Bonden i bygda trenger hjelp til å plukke jordbær i sommer.', minAge: 10, maxAge: 15, weight: 5, tone: 'financial', icon: 'cherry', maxOccurrences: 2, cooldown: 2,
    choices: [
      choice('Plukke hele sommeren', [good('Ryggen verket, men du tjente {amount}!', [gain('amount', 'Jordbærplukking'), disc(3), fit(1)], { w: 3 }), out('Du spiste mer enn du plukket. Bonden var ikke imponert.', [money(500, 'Jordbærplukking'), happy(2)], { w: 1 })]),
      pick('Ha sommerferie', 'Ferien er for å ha fri.', [happy(2)], 'neutral'),
    ], vars: { amount: { t: 'range', min: 2_000, max: 5_000, step: 100 } } }),
  ev({ id: 'e2_bike_stolen_kid', category: 'crime', title: 'Sykkelen er stjålet', text: 'Den nye sykkelen din er borte fra skolegården.', minAge: 7, maxAge: 14, weight: 4, tone: 'negative', icon: 'bike', maxOccurrences: 1,
    choices: [
      pick('Lete i hele nabolaget', 'Du fant den i et buskas – uten sete. Bedre enn ingenting.', [happy(1), disc(1)], 'neutral'),
      pick('Spare til en ny', 'Det tok et halvt år med ukepenger.', [disc(3), happy(-2)], 'neutral'),
    ] }),
  ev({ id: 'e2_sleepover', category: 'social', title: 'Første overnatting', text: 'Du er invitert til å sove over hos en venn for første gang.', minAge: 6, maxAge: 10, weight: 5, tone: 'positive', icon: 'tent', maxOccurrences: 1,
    choices: [
      choice('Dra!', [good('Dere snakket til langt på natt og spiste popcorn i senga.', [happy(4), rel('friend', 8)], { w: 3 }), bad('Du fikk hjemlengsel og ble hentet klokka elleve.', [happy(-2), rep(-1)], { w: 1 })]),
      pick('Heller invitere vennen hjem til deg', 'Din seng, dine regler. Perfekt.', [happy(3), rel('friend', 5)], 'positive'),
    ] }),
  ev({ id: 'e2_math_competition', category: 'school', title: 'Mattekonkurranse', text: 'Skolen skal sende ett lag til fylkesfinalen i matematikk.', minAge: 9, maxAge: 15, weight: 4, tone: 'neutral', icon: 'calculator', maxOccurrences: 1, conditions: [C.stat('intelligence', 55), C.student()],
    choices: [
      choice('Melde deg på', [good('Laget ditt vant fylkesfinalen!', [smart(3), rep(4), school(5)], { bias: [bias('intelligence', 0.8)] }), out('Dere kom på femteplass. Lærerikt!', [smart(2)])]),
      pick('Stå over', 'Konkurranser er ikke din greie.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_fishing_grandparent', category: 'family', title: 'Fisketur med besteforelder', text: '{target} tar deg med ut i robåten for å fiske.', minAge: 5, maxAge: 14, weight: 5, tone: 'relationship', icon: 'ship', target: { kinds: ['grandparent'] }, cooldown: 4,
    outcomes: [good('Dere fikk fem makrell og satt stille i timevis. {target} fortalte historier fra gamle dager.', [rel('bound', 10), happy(4), stress(-3)], { w: 3 }), out('Ingen fisk, men dere fikk se en nise!', [rel('bound', 6), happy(2)], { w: 1 })] }),
  ev({ id: 'e2_teacher_favorite', category: 'school', title: 'Lærerens yndling', text: 'Klassekameratene kaller deg «lærerens yndling».', minAge: 8, maxAge: 15, weight: 3, tone: 'neutral', icon: 'apple', maxOccurrences: 1, conditions: [C.stat('discipline', 60), C.student()],
    choices: [
      pick('Bry deg ikke', 'De ga seg etter hvert. Karakterene dine var gode.', [school(3)], 'neutral'),
      pick('Tulle litt i timen for å passe inn', 'Du fikk venner, men en anmerkning.', [rep(2), school(-2), disc(-2)], 'neutral'),
    ] }),

  // ── Teen ─────────────────────────────────────────────────
  ev({ id: 'e2_tattoo', category: 'social', title: 'Tatovering', text: 'Du har lyst på en tatovering. Foreldrene dine er sterkt imot.', minAge: 16, maxAge: 30, weight: 4, tone: 'neutral', icon: 'pen-tool', maxOccurrences: 1, conditions: [C.year(1970)],
    choices: [
      choice('Ta den likevel', [good('Den ble kjempefin. Du har aldri angret.', [happy(3), looks(1), rel('mother', -3), money(-2_500, 'Tatovering')], { w: 3 }), bad('Kinesiske tegn som skulle bety «styrke». Det betyr «suppe».', [happy(-3), money(-2_500, 'Tatovering')], { w: 1 })]),
      pick('Vente til du er eldre', 'Lysten gikk over. Eller gjorde den?', [disc(1)], 'neutral'),
    ] }),
  ev({ id: 'e2_hosting_party', category: 'social', title: 'Huset for deg selv', text: 'Foreldrene dine er bortreist i helgen. Du har huset for deg selv.', minAge: 15, maxAge: 18, weight: 5, tone: 'neutral', icon: 'party-popper', maxOccurrences: 1, conditions: [C.home()],
    choices: [
      choice('Holde fest', [good('Den beste festen noensinne. Ingen skader!', [rep(5), happy(5)], { w: 1 }), bad('Femti ukjente folk dukket opp, og stuebordet knakk.', [rep(3), money(-8_000, 'Nytt stuebord'), rel('mother', -10), rel('father', -10)], { w: 2 })]),
      pick('Invitere to venner på film', 'En rolig og koselig helg.', [happy(3), rel('friend', 5)], 'positive'),
      pick('Rydde huset som en overraskelse', 'Foreldrene dine trodde de hadde gått inn i feil hus.', [rel('mother', 8), rel('father', 8), disc(3)], 'positive'),
    ] }),
  ev({ id: 'e2_hair_dye', category: 'random', title: 'Ny hårfarge', text: 'Du vurderer å farge håret knallblått.', minAge: 13, maxAge: 22, weight: 4, tone: 'neutral', icon: 'palette', maxOccurrences: 1,
    choices: [
      choice('Gjøre det!', [good('Det kledde deg. Du ble lagt merke til i gangene.', [looks(2), rep(2), happy(3)], { w: 2 }), bad('Det ble grønt. Grisegrønt.', [looks(-3), happy(-3)], { w: 1 })]),
      pick('Holde deg til naturlig', 'Klassisk.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_climate_strike', category: 'social', title: 'Skolestreik', text: 'Elever over hele landet streiker for miljøet. Vennene dine skal i tog i morgen.', minAge: 13, maxAge: 19, weight: 5, tone: 'neutral', icon: 'megaphone', maxOccurrences: 1, conditions: [C.year(2018), C.student()],
    choices: [
      pick('Bli med i toget', 'Du holdt en appell foran Stortinget. Lokalavisa siterte deg.', [rep(4), flag('politicsInterest'), school(-2)], 'positive'),
      pick('Gå på skolen', 'Du hadde kjemiprøve. Prioriteringer.', [school(2)], 'neutral'),
    ] }),
  ev({ id: 'e2_learn_cook', category: 'family', title: 'Middag fra bunnen', text: 'Det er din tur til å lage middag for familien.', minAge: 12, maxAge: 17, weight: 4, tone: 'neutral', icon: 'utensils', maxOccurrences: 1, conditions: [C.home()],
    choices: [
      choice('Prøve en ny oppskrift', [good('Lasagnen ble en suksess! Du har fått fast middagsdag.', [rel('mother', 5), disc(2), happy(3)], { w: 2 }), bad('Brannalarmen gikk. Det ble pizza.', [happy(-1)], { w: 1 })]),
      pick('Lage taco som alle andre fredager', 'Ingen klaget.', [rel('father', 2)], 'neutral'),
    ] }),
  ev({ id: 'e2_driving_lesson_parent', category: 'family', title: 'Kjøretime med pappa', text: '{father} skal lære deg å kjøre. Han er ikke kjent for tålmodighet.', minAge: 16, maxAge: 18, weight: 4, tone: 'relationship', icon: 'car', maxOccurrences: 1, conditions: [C.rel('father'), C.year(1950)],
    choices: [
      pick('Ta det med humor', 'Mye roping, mye latter. Dere ble nærmere.', [rel('father', 8), flag('drivingPractice')], 'positive'),
      pick('Be om en ekte kjørelærer i stedet', 'Fred i bilen, men dyrere.', [money(-6_000, 'Kjøretimer'), flag('drivingPractice')], 'neutral'),
    ] }),
  ev({ id: 'e2_sports_quit', category: 'social', title: 'Slutte på idretten?', text: 'Treneren krever mer og mer, og du har mistet gløden.', minAge: 13, maxAge: 17, weight: 4, tone: 'neutral', icon: 'trophy', maxOccurrences: 1, conditions: [C.flag('sporty_kid')],
    choices: [
      pick('Slutte', 'Mer fritid, men også mindre trening.', [stress(-4), fit(-3), happy(1)], 'neutral'),
      pick('Bite tennene sammen', 'Du fant gleden igjen etter en tøff vinter.', [fit(4), disc(4)], 'positive'),
      pick('Bytte idrett', 'Klatring var akkurat det du trengte.', [fit(2), happy(3)], 'positive'),
    ] }),
  ev({ id: 'e2_summer_love', category: 'love', title: 'Sommerforelskelse', text: 'På hytta i sommer har du møtt noen som får deg til å glemme tid og sted.', minAge: 14, maxAge: 19, weight: 4, tone: 'relationship', icon: 'sun', maxOccurrences: 1, conditions: [C.noPartner()],
    outcomes: [good('En sommer med bading, lange kvelder og ditt første «jeg elsker deg». Dere skrev brev hele høsten.', [happy(7)], { w: 2 }), out('Det var magisk – helt til ferien sluttet.', [happy(2)], { w: 1 })] }),

  // ── Young adult ──────────────────────────────────────────
  ev({ id: 'e2_car_breakdown', category: 'money', title: 'Bilen streiker', text: 'Bilen din sier stopp på motorveien. Verkstedet anslår {amount}.', minAge: 18, maxAge: 90, weight: 4, tone: 'financial', icon: 'car', conditions: [C.asset('car')], cooldown: 5, vars: { amount: { t: 'range', min: 8_000, max: 35_000, step: 500 } },
    choices: [
      pick('Reparere', 'Bilen går som ny. Lommeboka mindre.', [pay('amount', 'Bilreparasjon')], 'financial', { cost: 'amount' }),
      pick('Parkere den og ta bussen en stund', 'Bilen sto i oppkjørselen til du hadde råd. Bussen gikk – stort sett.', [happy(-2), stress(2)], 'neutral'),
      choice('Fikse det selv etter YouTube-videoer', [good('Det fungerte! Du er visst en mekaniker.', [smart(2), money(-1_500, 'Bildeler')], { w: 1, bias: [bias('intelligence', 0.5)] }), bad('Nå var det to ting som var ødelagt.', [pay('amount', 'Bilreparasjon'), money(-5_000, 'Ekstra skade')], { w: 1 })], { cond: [C.year(2008)] }),
    ] }),
  ev({ id: 'e2_wisdom_teeth', category: 'health', title: 'Visdomstenner', text: 'Visdomstennene vokser skjevt og må trekkes.', minAge: 17, maxAge: 30, weight: 4, tone: 'negative', icon: 'smile', maxOccurrences: 1,
    outcomes: [out('Du så ut som en hamster i en uke og levde på yoghurt.', [money(-4_000, 'Tanntrekking'), happy(-2)])] }),
  ev({ id: 'e2_startup_offer', category: 'career', title: 'Bli med i oppstart', text: 'En venn starter selskap og tilbyr deg jobb – lav lønn, men eierandeler.', minAge: 21, maxAge: 45, weight: 3, tone: 'neutral', icon: 'rocket', maxOccurrences: 1, conditions: [C.year(1975), C.edu('bachelor')],
    choices: [
      pick('Satse på eierandeler', 'Du jobber 60 timer i uka på et loft. Tiden vil vise om det var verdt det.', [stress(8), flag('startupEquity'), later('e2_startup_outcome', 4)], 'neutral'),
      pick('Takke nei', 'Du beholdt tryggheten.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_startup_outcome', category: 'career', title: 'Oppstartens skjebne', text: 'Det har gått fire år siden du ble med i vennens selskap.', minAge: 20, maxAge: 80, weight: 0, scheduledOnly: true, tone: 'neutral', icon: 'rocket',
    outcomes: [
      good('Selskapet ble kjøpt opp av en internasjonal gigant! Eierandelen din ble verdt en formue.', [money(2_500_000, 'Salg av eierandeler'), happy(12), rep(5)], { w: 1 }),
      out('Selskapet overlevde, men aksjene er lite verdt. Du lærte mer enn på noen skole.', [smart(4), money(80_000, 'Utbytte')], { w: 2 }),
      bad('Selskapet gikk konkurs. Fire år med slit for ingenting.', [happy(-8), stress(6)], { w: 2 }),
    ] }),
  ev({ id: 'e2_deposit_dispute', category: 'money', title: 'Depositumet', text: 'Utleieren nekter å gi tilbake depositumet ditt på grunn av «slitasje».', minAge: 18, maxAge: 40, weight: 4, tone: 'negative', icon: 'receipt', maxOccurrences: 1, conditions: [C.home(false), C.homeowner(false)], vars: { amount: { t: 'range', min: 15_000, max: 40_000, step: 1000 } },
    choices: [
      choice('Klage til Husleietvistutvalget', [good('Du vant saken og fikk igjen {amount}.', [gain('amount', 'Depositum tilbake'), disc(2)], { w: 2, bias: [bias('intelligence', 0.4)] }), bad('Utleieren hadde bilder av flekker på teppet. Du tapte.', [stress(4)], { w: 1 })], { cond: [C.year(1990)] }),
      pick('Gi opp', 'Dyr lærepenge.', [happy(-3)], 'negative'),
    ] }),
  ev({ id: 'e2_marathon_invite', category: 'social', title: 'Løpeutfordringen', text: '{target} utfordrer deg til å løpe halvmaraton sammen om et halvt år.', minAge: 20, maxAge: 60, weight: 3, tone: 'neutral', icon: 'activity', target: { kinds: ['friend', 'bestFriend', 'sibling', 'coworker'], minAge: 18 }, maxOccurrences: 1,
    choices: [
      choice('Godta utfordringen', [good('Dere kom i mål hånd i hånd. Medaljen henger på veggen.', [fit(8), rel('bound', 10), happy(5)], { bias: [bias('discipline', 0.6)] }), bad('Du skadet kneet på trening og måtte heie fra sidelinjen.', [cond('injury', 25), rel('bound', 4)])]),
      pick('Takke nei', 'Sofaen vinner igjen.', [rel('bound', -2)], 'neutral'),
    ] }),
  ev({ id: 'e2_second_degree', category: 'school', title: 'Ny retning?', text: 'Du drømmer om å studere noe helt annet enn det du jobber med.', minAge: 27, maxAge: 50, weight: 3, tone: 'neutral', icon: 'graduation-cap', maxOccurrences: 1, conditions: [C.employed(), C.student(false)],
    choices: [
      pick('Ta det som deltidsstudium', 'Kvelder og helger med lesing. Tungt, men givende.', [smart(3), stress(5), flag('lifelongLearner')], 'positive'),
      pick('Slutte og søke studieplass', 'Du sa opp. Søk på et studium under Karriere.', [{ t: 'loseJob', reason: 'fired' }, happy(3)], 'neutral'),
      pick('Det er for sent', 'Drømmen ble en drøm.', [happy(-2)], 'neutral'),
    ] }),
  ev({ id: 'e2_parent_birthday', category: 'family', title: 'Rund dag', text: '{target} fyller rundt og ønsker seg en tale fra deg.', minAge: 18, maxAge: 70, weight: 4, tone: 'relationship', icon: 'cake', target: { kinds: ['mother', 'father'], minAge: 50 }, cooldown: 10, maxOccurrences: 2,
    choices: [
      choice('Skrive en ordentlig tale', [good('Hele salen ble rørt. {target} klemte deg lenge.', [rel('bound', 12), rep(2)], { bias: [bias('intelligence', 0.3)] }), out('Du stammet litt, men budskapet nådde fram.', [rel('bound', 6)])]),
      pick('Holde det kort', 'Kort og godt.', [rel('bound', 2)], 'neutral'),
    ] }),
  ev({ id: 'e2_roommate_cat', category: 'random', title: 'Katten som kom', text: 'En forvillet katt følger deg hjem og nekter å gå.', minAge: 16, maxAge: 90, weight: 2, tone: 'positive', icon: 'heart', maxOccurrences: 1, conditions: [C.flag('pet', false)],
    choices: [
      pick('Beholde den', 'Pus flyttet inn og tok over sofaen.', [{ t: 'adoptPet' }, happy(5), stress(-3)], 'positive'),
      pick('Levere den til dyrebeskyttelsen', 'Katten fant et godt hjem.', [rep(1)], 'neutral'),
    ] }),

  // ── Adult ────────────────────────────────────────────────
  ev({ id: 'e2_fau', category: 'family', title: 'Foreldrerådet', text: 'Du blir spurt om å lede foreldrerådet på barnas skole.', minAge: 28, maxAge: 55, weight: 4, tone: 'neutral', icon: 'users', maxOccurrences: 1, conditions: [C.children(1)],
    choices: [
      pick('Si ja', 'Mange møter og kaffekopper, men skolegården fikk ny lekeplass.', [rep(5), stress(4), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Si nei', 'Noen andre fikk æren – og jobben.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_noisy_neighbors', category: 'social', title: 'Bråkete naboer', text: 'Naboene har fest til klokka fire hver helg.', minAge: 20, maxAge: 90, weight: 4, tone: 'negative', icon: 'music', maxOccurrences: 1, conditions: [C.home(false)],
    choices: [
      pick('Banke på og snakke pent', 'De beklaget og inviterte deg til neste fest.', [{ t: 'newRel', kind: 'friend' }, stress(-2)], 'positive'),
      pick('Klage til borettslaget', 'Det ble stille. Og kjølig i trappeoppgangen.', [stress(-2), rep(-1)], 'neutral'),
      pick('Spille høyere musikk tilbake', 'Krigen eskalerte. Ingen fikk sove.', [stress(5), { t: 'newRel', kind: 'enemy' }], 'negative'),
    ] }),
  ev({ id: 'e2_kid_wants_phone', category: 'family', title: 'Alle andre har mobil', text: '{target} sier at alle i klassen har mobil – unntatt {targetHim}.', minAge: 25, maxAge: 70, weight: 5, tone: 'relationship', icon: 'smartphone', target: { kinds: ['child'], minAge: 8, maxAge: 13 }, maxOccurrences: 1, conditions: [C.year(2005)],
    choices: [
      pick('Kjøpe mobil med strenge regler', '{target} var overlykkelig – og fulgte reglene (stort sett).', [money(-4_000, 'Mobil til barn'), rel('bound', 8)], 'positive'),
      pick('Vente til ungdomsskolen', '{target} surmulte, men overlevde.', [rel('bound', -5), { t: 'npcStat', target: 'bound', key: 'discipline', delta: 5 }], 'neutral'),
    ] }),
  ev({ id: 'e2_rich_classmate', category: 'social', title: 'Gamle klassekamerater', text: 'En gammel klassekamerat har blitt rik og skryter av hytta i Spania.', minAge: 30, maxAge: 60, weight: 3, tone: 'neutral', icon: 'gem', maxOccurrences: 1,
    choices: [
      pick('Unne hen det', 'Du kjente på glede for en gammel venn. Det sa noe om deg.', [happy(2), rep(1)], 'positive'),
      pick('Sammenligne deg', 'Du gikk hjem og så på kontoutskriften lenge.', [happy(-4), stress(3)], 'negative'),
    ] }),
  ev({ id: 'e2_company_car', category: 'career', title: 'Firmabil', text: 'Arbeidsgiveren tilbyr deg firmabil som en del av lønnspakken.', minAge: 25, maxAge: 65, weight: 3, tone: 'positive', icon: 'car', maxOccurrences: 1, conditions: [C.employed(), C.salary(700_000), C.year(1960)],
    choices: [
      pick('Takke ja', 'Ny bil hvert tredje år – og skatt på fordelen.', [happy(4), rep(2), money(-15_000, 'Skatt på firmabil')], 'positive'),
      pick('Heller høyere lønn', 'Fornuftig og kjedelig.', [{ t: 'salaryPct', pct: 0.03, fallback: 0, label: 'Lønnstillegg' }], 'financial'),
    ] }),
  ev({ id: 'e2_colleague_burnout', category: 'career', title: 'Kollega på kanten', text: '{target} har grått på toalettet flere ganger denne uka.', minAge: 20, maxAge: 67, weight: 4, tone: 'relationship', icon: 'heart-handshake', target: { kinds: ['coworker'] }, cooldown: 5,
    choices: [
      pick('Ta en prat', '{target} åpnet seg. Du hjalp {targetHim} med å be om hjelp.', [rel('bound', 15, 10), rep(2)], 'positive'),
      pick('Si fra til lederen', '{target} fikk avlastning, men følte seg utlevert.', [rel('bound', -5), perf(2)], 'neutral'),
      pick('Holde deg unna', 'Det er ikke din sak.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_teen_child_party', category: 'family', title: 'Tenåringsfest', text: '{target} kommer hjem full fra fest klokka tre om natta.', minAge: 30, maxAge: 70, weight: 4, tone: 'negative', icon: 'wine', target: { kinds: ['child'], minAge: 14, maxAge: 17 }, cooldown: 4,
    choices: [
      pick('Kjefte og gi husarrest', '{target} var sur i en måned.', [rel('bound', -8), { t: 'npcStat', target: 'bound', key: 'discipline', delta: 8 }], 'neutral'),
      pick('Ta en rolig prat neste dag', '{target} innrømmet at det ikke var så gøy likevel.', [rel('bound', 5), { t: 'npcStat', target: 'bound', key: 'discipline', delta: 4 }], 'positive'),
      pick('Late som du ikke merket det', '{target} lærte at det ikke har konsekvenser.', [{ t: 'npcStat', target: 'bound', key: 'discipline', delta: -6 }], 'negative'),
    ] }),
  ev({ id: 'e2_garden_project', category: 'random', title: 'Hageprosjekt', text: 'Du har lyst til å anlegge en stor kjøkkenhage.', minAge: 25, maxAge: 85, weight: 3, tone: 'positive', icon: 'sprout', maxOccurrences: 1, conditions: [C.homeowner()],
    outcomes: [good('Du høstet poteter, gulrøtter og stolthet.', [happy(4), fit(2), stress(-4), money(-3_000, 'Hagesenteret')], { w: 3 }), bad('Sneglene spiste alt. Absolutt alt.', [happy(-2), money(-3_000, 'Hagesenteret')], { w: 1 })] }),
  ev({ id: 'e2_crowdfunding', category: 'money', title: 'Lokal investering', text: 'Et lokalt bryggeri søker investorer. Minste innskudd er {amount}.', minAge: 25, maxAge: 75, weight: 3, tone: 'financial', icon: 'cup-soda', maxOccurrences: 1, conditions: [C.money(30_000)], vars: { amount: { t: 'range', min: 20_000, max: 60_000, step: 1000 } },
    choices: [
      choice('Investere', [good('Bryggeriet ble en suksess! Du fikk utbytte og gratis øl.', [{ t: 'moneyVar', v: 'amount', mult: 0.6, label: 'Utbytte bryggeri' }, happy(3)], { w: 1 }), bad('Bryggeriet gikk konkurs etter to år.', [pay('amount', 'Tapt investering'), happy(-3)], { w: 1 }), out('Det går greit. Pengene står fast, men trygt.', [], { w: 1 })], { cost: 'amount' }),
      pick('Stå over', 'Du kjøper heller en kasse når de åpner.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_old_flame', category: 'love', title: 'Gammel kjærlighet', text: 'Du støter på din første kjærlighet i matbutikken. Det er like mye gnist som før.', minAge: 30, maxAge: 70, weight: 2, tone: 'relationship', icon: 'heart', maxOccurrences: 1,
    choices: [
      pick('Ta en kaffe for gamle dagers skyld', 'Dere ble venner igjen – bare venner.', [{ t: 'newRel', kind: 'friend' }, happy(3)], 'positive', { cond: [C.rel(['partner', 'spouse'])] }),
      pick('Be hen ut', 'Det er aldri for sent. Dere er sammen igjen!', [{ t: 'newRel', kind: 'partner' }, happy(7)], 'relationship', { cond: [C.noPartner()] }),
      pick('Hilse og gå videre', 'Noen minner er best som minner.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_health_scare_adult', category: 'health', title: 'Klump', text: 'Du kjenner en klump som ikke var der før.', minAge: 30, maxAge: 80, weight: 3, tone: 'negative', icon: 'scan', maxOccurrences: 1,
    choices: [
      choice('Bestille legetime med en gang', [good('Den var godartet. Du sov godt for første gang på en uke.', [stress(-3)], { w: 4 }), out('Den var ondartet, men oppdaget tidlig. Behandlingen startet straks.', [cond('cancer', 25), stress(10)], { w: 1 })]),
      choice('Vente og se', [good('Den forsvant av seg selv.', [], { w: 3 }), bad('Da du endelig gikk til legen, var det kreft – og den hadde vokst.', [cond('cancer', 65), stress(12)], { w: 1 })]),
    ] }),

  // ── Senior ───────────────────────────────────────────────
  ev({ id: 'e2_grandchild_wedding', category: 'family', title: 'Barnebarnets bryllup', text: '{target} gifter seg og ber deg holde tale.', minAge: 60, maxAge: 110, weight: 5, tone: 'milestone', icon: 'gem', target: { kinds: ['grandchild'], minAge: 22 }, maxOccurrences: 2,
    choices: [
      pick('Holde en tale full av minner', 'Ingen tørre øyne i salen. Du danset til midnatt.', [rel('bound', 15), happy(8), rep(2)], 'positive'),
      pick('Gi en sjenerøs gave', '{target} ble rørt over gaven.', [money(-30_000, 'Bryllupsgave'), rel('bound', 10), happy(4)], 'positive'),
    ] }),
  ev({ id: 'e2_senior_dance', category: 'social', title: 'Seniordans', text: 'Pensjonistforeningen har startet gammeldansgruppe.', minAge: 62, maxAge: 95, weight: 4, tone: 'positive', icon: 'music', maxOccurrences: 1,
    choices: [
      pick('Danse hver tirsdag', 'Reinlender og vals holdt deg ung.', [fit(4), happy(5), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Se på fra stolen', 'Musikken var fin i alle fall.', [happy(1)], 'neutral'),
    ] }),
  ev({ id: 'e2_hometown_visit', category: 'random', title: 'Tilbake til barndommen', text: 'Du har lyst til å besøke stedet der du vokste opp.', minAge: 60, maxAge: 100, weight: 3, tone: 'neutral', icon: 'map-pin', maxOccurrences: 1,
    outcomes: [good('Barndomshjemmet sto der fortsatt. Du gikk de gamle stiene og husket alt.', [happy(6), stress(-4)], { w: 3 }), out('Alt var forandret. Butikken var borte, skolen revet.', [happy(-2)], { w: 1 })] }),
  ev({ id: 'e2_old_letters', category: 'family', title: 'Gamle brev', text: 'På loftet finner du en eske med gamle brev fra foreldrene dine.', minAge: 50, maxAge: 110, weight: 3, tone: 'relationship', icon: 'mail', maxOccurrences: 1,
    outcomes: [good('Brevene fortalte om kjærlighet, savn og drømmer du aldri visste om.', [happy(4), smart(1)])] }),
  ev({ id: 'e2_elder_license', category: 'health', title: 'Førerkortet', text: 'Legen er usikker på om du fortsatt bør kjøre bil.', minAge: 75, maxAge: 110, weight: 5, tone: 'neutral', icon: 'car', maxOccurrences: 1, conditions: [C.flag('license'), { t: 'stat', key: 'health', max: 65 }],
    choices: [
      pick('Levere inn førerkortet frivillig', 'Barna ble lettet. Du tar bussen og drosje.', [{ t: 'unflag', key: 'license' }, rel('child', 5), happy(-3)], 'neutral'),
      choice('Ta en ny test', [good('Du besto! Bilen er din en stund til.', [happy(3)], { w: 1, bias: [bias('health', 0.5)] }), bad('Du strøk. Førerkortet ble inndratt.', [{ t: 'unflag', key: 'license' }, happy(-5)], { w: 1 })]),
    ] }),
  ev({ id: 'e2_senior_course', category: 'school', title: 'Seniorstudier', text: 'Universitetet tilbyr gratis kurs for pensjonister.', minAge: 65, maxAge: 95, weight: 3, tone: 'positive', icon: 'book-open', maxOccurrences: 1, conditions: [C.retired()],
    choices: [
      pick('Ta kurs i historie', 'Du var den mest ivrige studenten i salen.', [smart(4), happy(4), { t: 'newRel', kind: 'friend' }], 'positive'),
      pick('Takke nei', 'Du har lest nok i ditt liv.', [], 'neutral'),
    ] }),
  ev({ id: 'e2_inheritance_talk', category: 'family', title: 'Arvesamtalen', text: 'Barna dine vil gjerne snakke om hva som skjer med huset når du er borte.', minAge: 70, maxAge: 110, weight: 4, tone: 'relationship', icon: 'scroll', maxOccurrences: 1, conditions: [C.children(2), C.homeowner()],
    choices: [
      pick('Ha en åpen og ærlig samtale', 'Det var tungt, men alle var enige etterpå.', [rel('child', 6), stress(-3)], 'positive'),
      pick('Avfeie det', '«Jeg er ikke død ennå!»', [rel('child', -3)], 'neutral'),
    ] }),
  ev({ id: 'e2_last_trip', category: 'random', title: 'Drømmereisen', text: 'Det er én reise du alltid har drømt om, men aldri tatt.', minAge: 65, maxAge: 95, weight: 3, tone: 'positive', icon: 'plane', maxOccurrences: 1, conditions: [C.money(60_000)],
    choices: [
      pick('Dra nå – før det er for sent', 'Du sto på toppen av en pyramide/under nordlyset/ved Taj Mahal og tenkte: endelig.', [money(-50_000, 'Drømmereise'), happy(10), { t: 'count', key: 'trips' }], 'positive'),
      pick('Spare pengene til barnebarna', 'Barnebarna vil ha glede av dem.', [rel('grandchild', 4)], 'neutral'),
    ] }),
];

