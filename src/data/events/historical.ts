import type { EventDef } from '@/types/events';
import { C, bad, bias, choice, cond, delayed, disc, ev, fit, flag, good, happy, health, later, money, out, pick, rel, rep, smart, stress } from './helpers';

/**
 * Historical events, keyed to calendar years. Norway is fictionalised: no real people are
 * named, and the events are simplified to the experience of an ordinary family.
 */
export const HISTORICAL_EVENTS: EventDef[] = [
  // ── 1900–1930 ────────────────────────────────────────────
  ev({ id: 'hist_electricity', category: 'world', title: 'Elektrisk lys', text: 'Kraftselskapet tilbyr å legge inn elektrisk strøm i huset for {amount}.', minAge: 6, maxAge: 100, weight: 14, tone: 'neutral', icon: 'lightbulb', maxOccurrences: 1,
    conditions: [C.year(1900, 1925)], vars: { amount: { t: 'range', min: 150_000, max: 250_000, step: 1000 } },
    choices: [
      pick('Bli med på det nye', 'Den første kvelden med lyspære i taket satt hele familien og bare så på den.', [happy(5), smart(2), money(-60_000, 'Strøminnlegging')], 'positive'),
      pick('Parafinlampen holder', 'Naboene lo litt, men du sparte pengene.', [disc(1)], 'neutral'),
    ] }),
  ev({ id: 'hist_emigration', category: 'world', title: 'Amerikabåten', text: 'Mange fra bygda reiser til Amerika. {target} har bestemt seg for å emigrere.', minAge: 8, maxAge: 70, weight: 12, tone: 'relationship', icon: 'ship', maxOccurrences: 1,
    conditions: [C.year(1900, 1928)], target: { kinds: ['sibling', 'friend', 'bestFriend'], minAge: 17 },
    choices: [
      pick('Ta farvel på kaia', 'Dere skrev brev i mange år. Et av dem inneholdt dollar.', [rel('bound', -20), happy(-4), delayed(5, 'Et brev fra Amerika kom med noen dollar og et bilde av en stor gård.', 'positive', [money(15_000, 'Penger fra Amerika'), happy(3)])], 'relationship'),
      choice('Reise med i et par år', [good('Du jobbet på en fabrikk i Chicago og kom hjem med sparepenger og nye ideer.', [money(120_000, 'Sparepenger fra Amerika'), smart(3), rep(3), flag('wasInAmerica')], { w: 3 }), bad('Arbeidet var knallhardt og lønna dårlig. Du kom hjem slitent og blakk.', [health(-6), happy(-4)], { w: 1 })], { cond: [C.stat('health', 50)] }),
    ] }),
  ev({ id: 'hist_womens_vote', category: 'world', title: 'Stemmerett', text: 'Kvinner har fått allmenn stemmerett! Valgdagen nærmer seg.', minAge: 25, maxAge: 100, weight: 30, priority: true, tone: 'milestone', icon: 'vote', maxOccurrences: 1,
    conditions: [C.year(1913, 1915), C.gender('female')],
    choices: [
      pick('Stemme med stolthet', 'Du tok på deg søndagsklærne og la stemmeseddelen i urnen. Historisk.', [happy(6), rep(3), flag('politicsInterest')], 'milestone'),
      pick('Hjelpe andre kvinner til valglokalet', 'Du organiserte skyss for hele grenda.', [rep(6), happy(4), flag('politicsInterest')], 'positive'),
    ] }),
  ev({ id: 'hist_wartime_scarcity', category: 'world', title: 'Dyrtid', text: 'Verdenskrigen raser i Europa. Norge er nøytralt, men prisene stiger og varer blir rasjonert.', minAge: 8, maxAge: 100, weight: 12, tone: 'financial', icon: 'wallet', maxOccurrences: 1,
    conditions: [C.year(1916, 1918)],
    choices: [
      pick('Leve sparsomt', 'Grøt, sild og poteter. Det holdt.', [health(-1), disc(2)], 'neutral'),
      choice('Spekulere i aksjer', [good('Skipsaksjene steg til himmels. Du var en «jobber»!', [money(150_000, 'Aksjespekulasjon'), happy(4)], { w: 1 }), bad('Boblen sprakk. Pengene forsvant.', [money(-80_000, 'Spekulasjonstap'), happy(-6)], { w: 1 })], { cond: [C.money(50_000)] }),
    ] }),
  ev({ id: 'hist_spanish_flu', category: 'health', title: 'Spanskesyken', text: 'En dødelig influensa herjer i landet. Skoler og forsamlingshus stenger.', minAge: 0, maxAge: 110, weight: 50, priority: true, tone: 'negative', icon: 'thermometer', maxOccurrences: 1,
    conditions: [C.year(1918, 1919)],
    choices: [
      choice('Holde deg hjemme', [out('Du unngikk smitte. Mange i bygda var ikke like heldige.', [stress(4), happy(-3)], { w: 3 }), bad('Influensaen fant deg likevel. Du lå til sengs i ukevis.', [cond('pneumonia', 55), health(-10)], { w: 1 })]),
      choice('Pleie de syke', [good('Du hjalp naboer gjennom sykdommen og slapp selv unna. Folk glemmer det ikke.', [rep(8), happy(2)], { w: 1, bias: [bias('health', 0.6)] }), bad('Du ble alvorlig smittet.', [cond('pneumonia', 75), health(-15), rep(5)], { w: 1 })]),
    ] }),
  ev({ id: 'hist_prohibition', category: 'crime', title: 'Forbudstiden', text: 'Brennevin er forbudt, men en bekjent smugler sprit fra båter i skjærgården og trenger hjelp.', minAge: 18, maxAge: 70, weight: 10, tone: 'neutral', icon: 'wine', maxOccurrences: 1,
    conditions: [C.year(1917, 1927)],
    choices: [
      choice('Bli med på smuglingen', [good('Du tjente godt på «heimbrent» og kortspill-gevinster.', [money(60_000, 'Smuglerinntekt'), stress(4)], { w: 2 }), bad('Tollvesenet lå i bakhold.', [{ t: 'crime', crime: 'smuggling', severity: 2 }], { w: 1 })]),
      pick('Holde deg unna', 'Du drakk kaffe og holdt deg til loven.', [disc(2)], 'positive'),
    ] }),
  ev({ id: 'hist_radio', category: 'world', title: 'Radioen', text: 'Radioapparatet er kommet til butikken i byen. Det koster mye, men tenk å høre nyheter og musikk hjemme!', minAge: 8, maxAge: 100, weight: 10, tone: 'positive', icon: 'radio', maxOccurrences: 1,
    conditions: [C.year(1925, 1938)],
    choices: [
      pick('Kjøpe radio', 'Lørdagskveldene ble aldri de samme. Naboene kom på besøk for å lytte.', [money(-40_000, 'Radioapparat'), happy(5), smart(1), rep(2)], 'positive'),
      pick('Lytte hos naboen', 'Du ble en fast gjest i naboens stue.', [happy(2)], 'neutral'),
    ] }),
  ev({ id: 'hist_depression', category: 'world', title: 'Krisetidene', text: 'Krakket i Amerika har nådd Norge. Fabrikker stenger, og arbeidsledigheten er rekordhøy.', minAge: 16, maxAge: 100, weight: 30, priority: true, tone: 'negative', icon: 'trending-down', maxOccurrences: 1,
    conditions: [C.year(1930, 1934)],
    choices: [
      choice('Ta lønnskutt for å beholde jobben', [out('Du beholdt jobben, men det ble trangt.', [{ t: 'salaryPct', pct: -0.15, fallback: 0, label: 'Lønnskutt' }, stress(5)], { w: 3 }), bad('Fabrikken stengte likevel.', [{ t: 'loseJob', reason: 'laidOff' }], { w: 1 })], { cond: [C.employed()] }),
      pick('Dyrke egen mat', 'Potetåker og høner hjalp familien gjennom krisen.', [fit(3), disc(3), happy(-2)], 'neutral'),
      pick('Delta i arbeidsløsmarsjen', 'Du gikk i tog for arbeid og brød. Det ga fellesskap og håp.', [rep(3), happy(1), flag('politicsInterest')], 'neutral'),
    ] }),

  // ── 1940–1945: The occupation ────────────────────────────
  ev({ id: 'hist_invasion', category: 'world', title: '9. april', text: 'Tyske tropper har invadert Norge. Kongen og regjeringen har flyktet nordover. Alt er usikkert.', minAge: 4, maxAge: 110, weight: 100, priority: true, tone: 'milestone', icon: 'siren', maxOccurrences: 1,
    conditions: [C.year(1940, 1940)],
    choices: [
      pick('Holde familien samlet', 'Dere pakket det nødvendigste og ventet. Livet under okkupasjon hadde begynt.', [stress(12), happy(-8), flag('occupationLived')], 'negative'),
      pick('Evakuere til slekt på landet', 'Dere dro til en gård i innlandet. Tryggere, men trangt.', [stress(8), happy(-5), fit(2), flag('occupationLived')], 'negative'),
      pick('Melde deg til kampene', 'Du kjempet i noen uker før kapitulasjonen. Du så ting du aldri glemmer.', [stress(15), rep(6), fit(3), health(-5), flag('occupationLived'), flag('fought1940')], 'negative', { cond: [{ t: 'stat', key: 'fitness', min: 30 }, C.gender('male'), { t: 'not', c: { t: 'stat', key: 'health', max: 30 } }] }),
    ] }),
  ev({ id: 'hist_rationing', category: 'world', title: 'Rasjonering', text: 'Mat, klær og tobakk er rasjonert. Kø overalt, og kaffeerstatning smaker forferdelig.', minAge: 4, maxAge: 110, weight: 14, tone: 'negative', icon: 'utensils', maxOccurrences: 1,
    conditions: [C.year(1940, 1945)],
    choices: [
      pick('Følge rasjoneringen', 'Du ble tynnere, men holdt deg til reglene.', [health(-4), disc(2)], 'neutral'),
      choice('Handle på svartebørsen', [out('Familien fikk smør og egg. Prisen var høy.', [money(-25_000, 'Svartebørs'), health(2), happy(2)], { w: 3 }), bad('Du ble tatt med ulovlige varer.', [{ t: 'crime', crime: 'smuggling', severity: 1 }], { w: 1 })]),
      pick('Dyrke kålrot og sanke bær', 'Hagen ble en matkilde. Hele familien hjalp til.', [fit(3), health(1), happy(1)], 'positive'),
    ] }),
  ev({ id: 'hist_resistance', category: 'world', title: 'Hjemmefronten', text: 'En du stoler på spør forsiktig om du vil hjelpe motstandsbevegelsen med illegale aviser.', minAge: 15, maxAge: 70, weight: 18, tone: 'neutral', icon: 'newspaper', maxOccurrences: 1,
    conditions: [C.year(1941, 1944)],
    choices: [
      choice('Si ja', [good('Du delte ut aviser i over et år uten å bli tatt. Du var en del av noe større.', [flag('resistance'), stress(10), rep(2)], { w: 3, bias: [bias('discipline', 0.5)] }), bad('Statspolitiet fant avisene. Du satt i fangeleir resten av krigen.', [flag('resistance'), { t: 'prisonTime', delta: 1 }, health(-12), stress(15)], { w: 1 })]),
      pick('Hjelpe i det små', 'Du holdt munn og sendte matpakker til de som trengte det.', [rep(2), stress(3)], 'neutral'),
      pick('Holde hodet lavt', 'Det viktigste var at familien overlevde.', [stress(-2)], 'neutral'),
      choice('Samarbeide med okkupantene', [out('Du fikk en godt betalt jobb hos de nye makthaverne. Folk begynte å snu ryggen til deg.', [money(80_000, 'Lønn fra okkupasjonsmakten'), rep(-15), flag('collaborator'), later('hist_collab_trial', 3)], { w: 1 })]),
    ] }),
  ev({ id: 'hist_flight', category: 'world', title: 'Flukten', text: '{target} er etterlyst og må flykte til Sverige. Kan du hjelpe?', minAge: 15, maxAge: 80, weight: 10, tone: 'relationship', icon: 'trees', maxOccurrences: 1,
    conditions: [C.year(1942, 1944)], target: { kinds: ['friend', 'bestFriend', 'sibling', 'coworker'], minAge: 15 },
    choices: [
      choice('Følge {targetHim} over grensen', [good('Dere gikk gjennom skogen i tre netter. {target} kom trygt over.', [rel('bound', 30, 30), rep(6), fit(2), flag('resistance')], { w: 3 }), bad('Dere ble beskutt ved grensen. {target} slapp unna, men du ble skadet.', [rel('bound', 25, 25), cond('injury', 50), health(-10)], { w: 1 })]),
      pick('Gi mat og klær', '{target} kom seg av gårde med hjelp fra andre.', [rel('bound', 12), stress(4)], 'positive'),
      pick('Si nei – det er for farlig', 'Du har barn å tenke på. {target} forsto, men det gjorde vondt.', [rel('bound', -12)], 'neutral'),
    ] }),
  ev({ id: 'hist_liberation', category: 'milestone', title: 'Freden!', text: '8. mai: Tyskland har kapitulert! Flaggene kommer fram, og folk danser i gatene.', minAge: 3, maxAge: 110, weight: 100, priority: true, tone: 'milestone', icon: 'flag', maxOccurrences: 1,
    conditions: [C.year(1945, 1945)],
    outcomes: [
      good('Du feiret som aldri før. Hjemmefrontens folk ble hyllet som helter – og du var en av dem.', [happy(15), stress(-15), rep(12)], { mods: [{ when: C.flag('resistance', false), mult: 0 }] }),
      good('Du gråt av glede da flaggene ble heist igjen. Fem år med frykt var over.', [happy(14), stress(-14)], { mods: [{ when: C.any(C.flag('collaborator'), C.flag('resistance')), mult: 0 }] }),
      bad('Mens andre feiret, ble du hentet av hjemmestyrkene. Folk spyttet etter deg.', [stress(15), happy(-10), rep(-10)], { mods: [{ when: C.flag('collaborator', false), mult: 0 }] }),
    ] }),
  ev({ id: 'hist_collab_trial', category: 'crime', title: 'Landssvikoppgjøret', text: 'Etter krigen må alle som samarbeidet med okkupantene stå til rette.', minAge: 15, maxAge: 110, weight: 0, scheduledOnly: true, tone: 'negative', icon: 'scale',
    choices: [
      pick('Erkjenne skyld', 'Du fikk bot og mistet rettigheter i noen år. Skammen bar du lenge.', [money(-50_000, 'Bot – landssvik'), rep(-10), happy(-6)], 'negative'),
      choice('Påstå at du ble tvunget', [out('Retten trodde deg delvis. Du slapp med en mindre bot.', [money(-20_000, 'Bot – landssvik'), rep(-5)], { w: 1 }), bad('Vitner fortalte en annen historie. Du fikk fengsel.', [{ t: 'prisonTime', delta: 2 }, rep(-12)], { w: 1 })]),
    ] }),

  // ── 1946–1980 ────────────────────────────────────────────
  ev({ id: 'hist_rebuilding', category: 'world', title: 'Gjenreisningen', text: 'Landet skal bygges opp igjen. Det er jobb å få for alle som vil ta i et tak – og husbanklån til egen bolig.', minAge: 18, maxAge: 60, weight: 16, tone: 'positive', icon: 'hammer', maxOccurrences: 1,
    conditions: [C.year(1946, 1956)],
    choices: [
      pick('Bygge eget hus på dugnad', 'Med venner og naboer reiste du et hus på et år. Gunstig husbanklån gjorde det mulig.', [{ t: 'gainAsset', catalogId: 'rowhouse' }, { t: 'debt', kind: 'mortgage', amount: 4_200_000, label: 'Husbanklån', financesAsset: true }, fit(4), happy(6)], 'milestone', { cond: [C.homeowner(false)] }),
      pick('Ta ekstra skift på byggeplassen', 'Godt betalt, tungt arbeid.', [money(70_000, 'Overtid gjenreisning'), fit(2), stress(4)], 'financial'),
      pick('Utdanne deg for fremtiden', 'Du tok kveldskurs. Kunnskap skulle bli den nye rikdommen.', [smart(4), disc(2)], 'positive'),
    ] }),
  ev({ id: 'hist_polio', category: 'health', title: 'Poliofrykt', text: 'Det er utbrudd av polio. Foreldre holder barna borte fra badeplasser.', minAge: 1, maxAge: 15, weight: 14, tone: 'negative', icon: 'shield-alert', maxOccurrences: 1,
    conditions: [C.year(1950, 1956)],
    outcomes: [out('Du slapp unna, men sommeren var lang og kjedelig.', [happy(-3)], { w: 8 }), bad('Du ble syk og fikk varige plager i det ene beinet.', [health(-12), fit(-10), cond('injury', 40)], { w: 1 })] }),
  ev({ id: 'hist_polio_vaccine', category: 'health', title: 'Poliovaksinen', text: 'Den nye poliovaksinen er kommet! Alle barn skal vaksineres.', minAge: 0, maxAge: 18, weight: 30, priority: true, tone: 'positive', icon: 'syringe', maxOccurrences: 1,
    conditions: [C.year(1956, 1958)],
    outcomes: [good('Et lite stikk – og en stor lettelse for hele landet.', [health(3), stress(-3)])] }),
  ev({ id: 'hist_first_car', category: 'money', title: 'Bil på rasjoneringskort', text: 'Bilsalget er endelig fritt! En brukt bil koster {amount}.', minAge: 20, maxAge: 80, weight: 10, tone: 'financial', icon: 'car', maxOccurrences: 1,
    conditions: [C.year(1960, 1966), C.asset('car', false)], vars: { amount: { t: 'range', min: 90_000, max: 140_000, step: 1000 } },
    choices: [
      pick('Kjøpe bil', 'Søndagsturer med matpakke og termos. Frihet!', [{ t: 'gainAsset', catalogId: 'used_car' }, { t: 'moneyVar', v: 'amount', mult: -1, label: 'Bilkjøp' }, happy(6), rep(2)], 'positive', { cost: 'amount' }),
      pick('Sykle videre', 'Sykkelen har aldri punktert lommeboka.', [fit(2)], 'neutral'),
    ] }),
  ev({ id: 'hist_tv', category: 'world', title: 'Fjernsynet', text: 'NRK har startet med fjernsyn! Et apparat koster en hel månedslønn.', minAge: 5, maxAge: 100, weight: 12, tone: 'positive', icon: 'tv', maxOccurrences: 1,
    conditions: [C.year(1960, 1968)],
    choices: [
      pick('Kjøpe TV', 'Hele nabolaget samlet seg i stua di på lørdagskvelden.', [money(-45_000, 'Fjernsynsapparat'), happy(5), rep(3)], 'positive'),
      pick('Vente til det blir billigere', 'Du fortsatte med radioen og kortspill.', [disc(1)], 'neutral'),
    ] }),
  ev({ id: 'hist_cuba', category: 'world', title: 'Atomfrykt', text: 'Supermaktene står på randen av atomkrig. Radioen snakker ikke om annet.', minAge: 8, maxAge: 100, weight: 12, tone: 'negative', icon: 'alert-triangle', maxOccurrences: 1,
    conditions: [C.year(1962, 1962)],
    choices: [
      pick('Fylle kjelleren med hermetikk', 'Krisen gikk over. Du spiste hermetiske pølser i et år.', [money(-6_000, 'Beredskapslager'), stress(5)], 'neutral'),
      pick('Leve som normalt', 'Du nektet å la frykten styre. Klokt, viste det seg.', [disc(2)], 'neutral'),
    ] }),
  ev({ id: 'hist_moon_landing', category: 'world', title: 'Mennesker på månen', text: 'Hele verden følger med: mennesker skal lande på månen i natt!', minAge: 4, maxAge: 100, weight: 30, priority: true, tone: 'milestone', icon: 'star', maxOccurrences: 1,
    conditions: [C.year(1969, 1969)],
    choices: [
      pick('Holde deg våken og se det live', 'Kornete bilder, knitrende lyd – og et øyeblikk du aldri glemmer.', [happy(6), smart(2), flag('dreamScience')], 'positive'),
      pick('Sove og lese om det i avisen', 'Du fikk med deg historien over frokosten.', [smart(1)], 'neutral'),
    ] }),
  ev({ id: 'hist_oil', category: 'world', title: 'Olje i Nordsjøen!', text: 'Det er funnet store mengder olje utenfor kysten. Oljeselskapene trenger folk – og investorer.', minAge: 18, maxAge: 60, weight: 16, tone: 'financial', icon: 'factory', maxOccurrences: 1,
    conditions: [C.year(1970, 1976)],
    choices: [
      pick('Søke jobb offshore', 'Oljeeventyret har startet. Du finner offshorejobber i Karriere-fanen (krever fagbrev).', [flag('network'), happy(2)], 'neutral'),
      choice('Kjøpe aksjer i oljeselskap', [good('Aksjene ble verdt mange ganger innskuddet.', [money(250_000, 'Oljeaksjer'), happy(5)], { w: 2 }), bad('Selskapet du valgte fant bare tørre brønner.', [money(-60_000, 'Tap på oljeaksjer'), happy(-3)], { w: 1 })], { cond: [C.money(60_000)] }),
      pick('Bli der du er', 'Ikke alle trenger å bli oljearbeidere.', [], 'neutral'),
    ] }),
  ev({ id: 'hist_ef_vote', category: 'world', title: 'Folkeavstemning om Europa', text: 'Landet er splittet i spørsmålet om medlemskap i det europeiske fellesskapet. Middagsselskapene blir hete.', minAge: 18, maxAge: 110, weight: 25, priority: true, tone: 'neutral', icon: 'vote', maxOccurrences: 2, cooldown: 10,
    conditions: [C.any(C.year(1972, 1972), C.year(1994, 1994))],
    choices: [
      pick('Stemme ja', 'Du stemte for. Nei-siden vant – igjen. Noen i familien snakket ikke med deg på en uke.', [rel('sibling', -4), flag('politicsInterest')], 'neutral'),
      pick('Stemme nei', 'Nei-siden vant. Du feiret med kaffe og bløtkake.', [happy(3), flag('politicsInterest')], 'neutral'),
      pick('Holde deg hjemme', 'Du ble lei av hele diskusjonen.', [stress(-1)], 'neutral'),
    ] }),
  ev({ id: 'hist_charter', category: 'world', title: 'Syden for folk flest', text: 'Charterturer til Mallorca har gjort Syden til noe vanlige folk kan unne seg.', minAge: 18, maxAge: 90, weight: 10, tone: 'positive', icon: 'tree-palm', maxOccurrences: 1,
    conditions: [C.year(1965, 1980)],
    choices: [
      pick('Bestille tur', 'Sangria, sol og den første solbrentheten. Du var solgt.', [money(-25_000, 'Syden-tur'), happy(7), stress(-6), { t: 'count', key: 'trips' }], 'positive'),
      pick('Telttur i Norge', 'Regn og mygg, men billig og koselig.', [happy(2), fit(1)], 'neutral'),
    ] }),

  // ── 1980–2026 ────────────────────────────────────────────
  ev({ id: 'hist_yuppie', category: 'money', title: 'Jappetid', text: 'Bankene låner ut penger til alt og alle. Kollegaene kjøper seilbåter og aksjer på kreditt.', minAge: 20, maxAge: 70, weight: 14, tone: 'financial', icon: 'trending-up', maxOccurrences: 1,
    conditions: [C.year(1984, 1987)],
    choices: [
      pick('Låne for å kjøpe aksjer', 'Du lånte 200 000 kr og kjøpte aksjer. Kursene stiger! Du føler deg genial. Foreløpig.', [{ t: 'debt', kind: 'consumer', amount: 200_000, label: 'Lån – jappetid' }, money(-200_000, 'Aksjekjøp på kreditt'), happy(4), later('hist_bank_crisis_hit', 3)], 'financial'),
      pick('Holde igjen', 'Du sparte mens andre festet. Din tid skulle komme.', [disc(3), flag('prudent80s')], 'positive'),
    ] }),
  ev({ id: 'hist_bank_crisis_hit', category: 'money', title: 'Bankkrisen', text: 'Boblen har sprukket. Bankene krever pengene sine tilbake, og aksjene er nesten verdiløse.', minAge: 20, maxAge: 80, weight: 0, scheduledOnly: true, tone: 'negative', icon: 'trending-down',
    choices: [
      pick('Selge aksjene for det du får', 'Aksjene var verdt en tredjedel. Gjelden består, men nå vet du hva den koster.', [money(65_000, 'Salg av aksjer etter krakket'), stress(10), happy(-6), disc(3)], 'negative'),
      pick('Beholde aksjene og håpe', 'Du ventet i ti år. De kom aldri helt tilbake.', [stress(12), happy(-4), delayed(8, 'De gamle jappetid-aksjene ble til slutt solgt for en brøkdel.', 'financial', [money(40_000, 'Gamle aksjer solgt')])], 'negative'),
    ] }),
  ev({ id: 'hist_housing_crash', category: 'money', title: 'Boligkrakk', text: 'Boligprisene faller som en stein. Huset ditt er verdt mindre enn lånet.', minAge: 20, maxAge: 100, weight: 14, tone: 'negative', icon: 'home', maxOccurrences: 1,
    conditions: [C.year(1988, 1992), C.homeowner()],
    choices: [
      pick('Sitte stille i båten', 'Det tok ti år, men prisene kom tilbake – og vel så det.', [stress(6), disc(3)], 'neutral'),
      pick('Selge før det blir verre', 'Du solgte med tap – akkurat i bunnen.', [money(-150_000, 'Tap ved boligsalg'), happy(-5)], 'negative'),
    ] }),
  ev({ id: 'hist_mobile_phone', category: 'world', title: 'Mobiltelefonen', text: 'Mobiltelefoner er blitt lommestørrelse og alle snakker om SMS.', minAge: 12, maxAge: 100, weight: 12, tone: 'positive', icon: 'smartphone', maxOccurrences: 1,
    conditions: [C.year(1995, 2001)],
    choices: [
      pick('Kjøpe mobil', 'Du sendte din første SMS: «hei :)». Snake ble din nye avhengighet.', [money(-8_000, 'Mobiltelefon'), happy(4), rep(1)], 'positive'),
      pick('Klare deg med fasttelefonen', 'Folk må bare ringe hjem.', [], 'neutral'),
    ] }),
  ev({ id: 'hist_internet', category: 'world', title: 'Internett!', text: 'Modemet piper og skriker: familien har fått internett.', minAge: 8, maxAge: 100, weight: 14, tone: 'positive', icon: 'globe', maxOccurrences: 1,
    conditions: [C.year(1996, 2002)],
    choices: [
      pick('Lære deg å lage nettsider', 'HTML ble ditt hemmelige språk. Det skulle vise seg nyttig.', [smart(4), flag('techKid')], 'positive'),
      pick('Chatte med folk over hele verden', 'Du fikk en brevvenn i Australia og en enorm telefonregning.', [happy(4), money(-3_000, 'Telefonregning')], 'neutral'),
      pick('Spille dataspill på nett', 'Nettene ble lange.', [happy(3), { t: 'addiction', id: 'gaming', delta: 10 }], 'neutral'),
    ] }),
  ev({ id: 'hist_olympics', category: 'world', title: 'OL på hjemmebane', text: 'Vinter-OL arrangeres i Norge! Hele landet er i ekstase.', minAge: 5, maxAge: 100, weight: 30, priority: true, tone: 'positive', icon: 'trophy', maxOccurrences: 1,
    conditions: [C.year(1994, 1994)],
    choices: [
      pick('Reise og se på', 'Du sto i kulda med flagg i kinnet og heiet til stemmen forsvant.', [money(-6_000, 'OL-tur'), happy(8), rep(1)], 'positive'),
      pick('Bli frivillig', 'Du delte ut startnumre og fikk en jakke du brukte i 20 år.', [rep(4), happy(6), { t: 'newRel', kind: 'friend' }], 'positive', { cond: [{ t: 'stat', key: 'health', min: 20 }] }),
      pick('Se alt på TV', 'Gull, gull og mer gull. For en vinter!', [happy(5)], 'positive'),
    ] }),
  ev({ id: 'hist_y2k', category: 'world', title: 'År 2000-problemet', text: 'Eksperter advarer om at datamaskiner vil bryte sammen ved nyttår.', minAge: 10, maxAge: 100, weight: 25, priority: true, tone: 'neutral', icon: 'alert-triangle', maxOccurrences: 1,
    conditions: [C.year(1999, 1999)],
    choices: [
      pick('Hamstre vann og hermetikk', 'Ingenting skjedde. Du hadde hermetikk til 2003.', [money(-4_000, 'Beredskapslager'), stress(2)], 'neutral'),
      pick('Feire som vanlig', 'Klokka slo tolv, lyset var fortsatt på. Godt nytt årtusen!', [happy(4)], 'positive'),
      pick('Jobbe overtid med å fikse systemer', 'IT-folk tjente godt det året.', [money(60_000, 'Overtid år 2000'), stress(5)], 'financial', { cond: [C.occ('tech')] }),
    ] }),
  ev({ id: 'hist_dotcom', category: 'money', title: 'Dot-com-feberen', text: 'Alle IT-aksjer går til himmels. Kollegaen din har blitt «papirmillionær».', minAge: 18, maxAge: 80, weight: 12, tone: 'financial', icon: 'line-chart', maxOccurrences: 1,
    conditions: [C.year(1998, 2000), C.money(40_000)], vars: { amount: { t: 'range', min: 30_000, max: 100_000, step: 1000 } },
    choices: [
      choice('Kjøpe IT-aksjer for {amount}', [bad('Boblen sprakk året etter. Aksjene ble nesten verdiløse.', [{ t: 'moneyVar', v: 'amount', mult: -0.85, label: 'Dot-com-krakk' }, happy(-5)], { w: 3 }), good('Du solgte på toppen! Ren flaks – eller geni?', [{ t: 'moneyVar', v: 'amount', mult: 2, label: 'IT-aksjegevinst' }, happy(6)], { w: 1 })], { cost: 'amount' }),
      pick('Stå over', 'Det kjedelige valget viste seg å være det kloke.', [disc(2)], 'positive'),
    ] }),
  ev({ id: 'hist_finance_crisis', category: 'world', title: 'Finanskrisen', text: 'En amerikansk storbank har gått konkurs. Børsene stuper over hele verden.', minAge: 18, maxAge: 100, weight: 30, priority: true, tone: 'negative', icon: 'trending-down', maxOccurrences: 1,
    conditions: [C.year(2008, 2009)],
    choices: [
      pick('Kjøpe fond mens det er billig', 'Det var nervepirrende. Om noen år skulle det vise seg å lønne seg.', [stress(5), flag('boughtTheDip'), delayed(4, 'Fondene du kjøpte under finanskrisen har steget kraftig.', 'positive', [money(80_000, 'Gevinst etter finanskrisen'), happy(4)])], 'neutral', { cond: [C.money(50_000)] }),
      pick('Ikke se på kontoen', 'Du lot sparepengene ligge og prøvde å glemme dem.', [stress(2)], 'neutral'),
      pick('Selge alt i panikk', 'Du solgte i bunnen.', [money(-30_000, 'Tap i finanskrisen'), happy(-4)], 'negative'),
    ] }),
  ev({ id: 'hist_smartphone', category: 'world', title: 'Smarttelefonen', text: 'Den nye telefonen har berøringsskjerm og «apper». Alle må ha en.', minAge: 10, maxAge: 100, weight: 12, tone: 'positive', icon: 'smartphone', maxOccurrences: 1,
    conditions: [C.year(2008, 2012)],
    choices: [
      pick('Kjøpe den med en gang', 'Du har ikke kjedet deg et sekund siden. Kanskje det er et problem.', [money(-6_000, 'Smarttelefon'), happy(3), { t: 'addiction', id: 'gaming', delta: 5 }], 'positive'),
      pick('Beholde den gamle', 'Batteriet varer jo i en uke.', [disc(1)], 'neutral'),
    ] }),
  ev({ id: 'hist_oil_price_fall', category: 'world', title: 'Oljeprisfallet', text: 'Oljeprisen har halvert seg. Oljebyene merker det først.', minAge: 20, maxAge: 66, weight: 14, tone: 'negative', icon: 'trending-down', maxOccurrences: 1,
    conditions: [C.year(2014, 2016), C.employed(), C.occ('industry')],
    choices: [
      choice('Håpe det går over', [out('Du beholdt jobben, men bonusen forsvant.', [stress(6)], { w: 2 }), bad('Du ble permittert.', [{ t: 'loseJob', reason: 'laidOff' }], { w: 1 })]),
      pick('Omskolere deg', 'Du begynte å se etter noe nytt mens du fortsatt hadde jobb.', [smart(2), disc(2), stress(3)], 'neutral'),
    ] }),
  ev({ id: 'hist_lockdown', category: 'world', title: 'Nedstengning', text: 'Et nytt virus sprer seg. Landet stenger ned: hjemmekontor, hjemmeskole og avlyste bursdager.', minAge: 3, maxAge: 110, weight: 50, priority: true, tone: 'negative', icon: 'home', maxOccurrences: 1,
    conditions: [C.year(2020, 2020)],
    choices: [
      pick('Bake surdeigsbrød og gå turer', 'Du fant roen – og en ny hobby.', [happy(2), fit(2), stress(-2)], 'positive'),
      pick('Ringe noen hver dag', 'Videosamtaler holdt kontakten varm.', [rel('mother', 5), rel('friend', 5)], 'positive'),
      pick('Sitte inne og scrolle', 'Det ble et langt og grått år.', [happy(-5), fit(-3), stress(4)], 'negative'),
    ] }),
];
