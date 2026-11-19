/**
 * Player-action facade. Every function takes an immutable GameState and returns a new
 * GameState plus a short result message. The UI never mutates state directly.
 */
import type { GameState, Lifestyle } from '@/types/game';
import { BALANCE } from '@/data/balance';
import { addTx, beginSim, changeStat, endSim, log, playerAge, type Sim } from './helpers';
import { postActionChecks } from './checks';
import { doActivity } from '../activities/activities';
import { interact, type InteractionId } from '../relationships/interactions';
import { acceptOffer, applyForJob, askForRaise, declineOffer, endJob, negotiateOffer, retire, setWorkEffort } from '../careers/careers';
import { dropOut, enroll, setEffort } from '../education/education';
import { buyAsset, repairAsset, sellAsset, startBusiness, toggleRent } from '../assets/assets';
import { rehab, treatCondition } from '../health/health';
import { coverShortfall } from '../economy/finance';
import { formatNOK } from '@/utils/format';

export interface ActionResult {
  state: GameState;
  message: string;
  ok: boolean;
  tone?: 'positive' | 'negative' | 'neutral';
}

function run(state: GameState, fn: (sim: Sim) => { ok: boolean; message: string; tone?: ActionResult['tone'] }): ActionResult {
  if (state.death) return { state, ok: false, message: 'Livet er over.' };
  const sim = beginSim(state);
  const r = fn(sim);
  if (!r.ok) return { state, ok: false, message: r.message };
  postActionChecks(sim);
  return { state: endSim(sim), ok: true, message: r.message, tone: r.tone };
}

export const actions = {
  activity: (state: GameState, id: string) =>
    run(state, (sim) => {
      const r = doActivity(sim, id);
      return { ok: r.ok, message: r.text, tone: r.tone === 'negative' ? 'negative' : r.tone === 'positive' ? 'positive' : 'neutral' };
    }),
  interact: (state: GameState, personId: string, id: InteractionId) =>
    run(state, (sim) => {
      const r = interact(sim, personId, id);
      return { ok: r.ok, message: r.text };
    }),
  applyJob: (state: GameState, occupationId: string) =>
    run(state, (sim) => {
      const r = applyForJob(sim, occupationId);
      if (r.status === 'error') return { ok: false, message: r.reason };
      if (r.status === 'rejected') return { ok: true, message: r.reason, tone: 'negative' };
      return { ok: true, message: `Du fikk et tilbud: ${formatNOK(r.salary)} i året!`, tone: 'positive' };
    }),
  acceptOffer: (state: GameState) => run(state, (sim) => ({ ok: acceptOffer(sim), message: 'Gratulerer med ny jobb!', tone: 'positive' })),
  negotiateOffer: (state: GameState) =>
    run(state, (sim) => {
      const r = negotiateOffer(sim);
      const msg = { raised: 'De gikk med på høyere lønn!', withdrawn: 'Tilbudet ble trukket.', unchanged: 'De sto fast på tilbudet.', none: 'Ingen forhandling mulig.' }[r];
      return { ok: r !== 'none', message: msg, tone: r === 'raised' ? 'positive' : r === 'withdrawn' ? 'negative' : 'neutral' };
    }),
  declineOffer: (state: GameState) =>
    run(state, (sim) => {
      declineOffer(sim);
      return { ok: true, message: 'Du takket nei.' };
    }),
  quitJob: (state: GameState) =>
    run(state, (sim) => {
      if (!sim.s.career.job) return { ok: false, message: 'Du har ingen jobb.' };
      endJob(sim, 'resigned');
      return { ok: true, message: 'Du sa opp jobben.' };
    }),
  askRaise: (state: GameState) =>
    run(state, (sim) => {
      const r = askForRaise(sim);
      if (r === 'none') return { ok: false, message: 'Du har allerede spurt i år.' };
      return { ok: true, message: { raise: 'Du fikk lønnsøkning!', no: 'Ikke i år.', angry: 'Sjefen ble irritert.' }[r], tone: r === 'raise' ? 'positive' : 'negative' };
    }),
  workEffort: (state: GameState, effort: 'low' | 'normal' | 'high') =>
    run(state, (sim) => {
      setWorkEffort(sim, effort);
      return { ok: true, message: 'Arbeidsinnsats oppdatert.' };
    }),
  retire: (state: GameState) => run(state, (sim) => ({ ok: retire(sim), message: 'Du er pensjonist!', tone: 'positive' })),
  enroll: (state: GameState, programId: string) =>
    run(state, (sim) => {
      const r = enroll(sim, programId);
      return { ok: r.ok, message: r.ok ? 'Du er tatt opp!' : (r.error ?? 'Ikke mulig') };
    }),
  dropOut: (state: GameState) =>
    run(state, (sim) => {
      const r = dropOut(sim);
      return { ok: r.ok, message: r.ok ? 'Du sluttet på studiet.' : 'Kan ikke slutte nå.' };
    }),
  studyEffort: (state: GameState, effort: 'low' | 'normal' | 'high') =>
    run(state, (sim) => {
      setEffort(sim, effort);
      return { ok: true, message: 'Innsats oppdatert.' };
    }),
  buyAsset: (state: GameState, catalogId: string, mortgage: boolean) =>
    run(state, (sim) => {
      const r = buyAsset(sim, catalogId, mortgage);
      const errors: Record<string, string> = {
        notEnoughCash: 'Du har ikke nok penger.',
        notEnoughEquity: 'Du har ikke nok egenkapital (15 %).',
        debtToIncome: 'Banken mener inntekten din er for lav for dette lånet.',
        tooYoung: 'Du er for ung.',
        inPrison: 'Ikke mulig i fengsel.',
      };
      return { ok: r.ok, message: r.ok ? 'Kjøpet er gjennomført!' : (errors[r.error ?? ''] ?? 'Kjøpet feilet.'), tone: 'positive' };
    }),
  sellAsset: (state: GameState, assetId: string) =>
    run(state, (sim) => {
      const r = sellAsset(sim, assetId);
      return { ok: r.ok, message: r.ok ? 'Solgt!' : 'Salget feilet.' };
    }),
  toggleRent: (state: GameState, assetId: string) =>
    run(state, (sim) => {
      const r = toggleRent(sim, assetId);
      return { ok: r.ok, message: 'Oppdatert.' };
    }),
  repairAsset: (state: GameState, assetId: string) =>
    run(state, (sim) => {
      const r = repairAsset(sim, assetId);
      return { ok: r.ok, message: r.ok ? 'Oppusset!' : 'Du har ikke råd.' };
    }),
  startBusiness: (state: GameState, businessId: string, loan: boolean) =>
    run(state, (sim) => {
      const r = startBusiness(sim, businessId, loan);
      const errors: Record<string, string> = { notEnoughCash: 'Du har ikke nok egenkapital.', tooYoung: 'Du er for ung.', tooMany: 'Du har nok bedrifter.' };
      return { ok: r.ok, message: r.ok ? 'Bedriften er startet!' : (errors[r.error ?? ''] ?? 'Ikke mulig.'), tone: 'positive' };
    }),
  treat: (state: GameState, conditionId: string, privateClinic: boolean) =>
    run(state, (sim) => {
      const r = treatCondition(sim, conditionId, privateClinic);
      return { ok: r.ok, message: r.text };
    }),
  rehab: (state: GameState, addictionId: string) =>
    run(state, (sim) => {
      const r = rehab(sim, addictionId);
      return { ok: r.ok, message: r.text };
    }),
  setLifestyle: (state: GameState, lifestyle: Lifestyle) =>
    run(state, (sim) => {
      sim.s.finances.lifestyle = lifestyle;
      return { ok: true, message: 'Livsstil oppdatert.' };
    }),
  moveOut: (state: GameState) =>
    run(state, (sim) => {
      const { s } = sim;
      if (!s.livingWithParents || playerAge(s) < 18) return { ok: false, message: 'Ikke mulig.' };
      s.livingWithParents = false;
      s.flags.movedOut = s.year;
      changeStat(s.people[s.playerId], 'happiness', 4);
      log(s, 'Du flyttet hjemmefra! Første kveld i egen leilighet: pizza på gulvet.', 'milestone', 'Flyttet ut', 'home');
      return { ok: true, message: 'Du har flyttet hjemmefra!', tone: 'positive' };
    }),
  moveHome: (state: GameState) =>
    run(state, (sim) => {
      const { s } = sim;
      const parentsAlive = Object.values(s.relationships).some((r) => (r.kind === 'mother' || r.kind === 'father') && r.status === 'active' && s.people[r.personId]?.alive);
      if (s.livingWithParents || !parentsAlive || s.assets.some((a) => a.residence)) return { ok: false, message: 'Ikke mulig.' };
      s.livingWithParents = true;
      changeStat(s.people[s.playerId], 'reputation', -2);
      log(s, 'Du flyttet hjem til foreldrene igjen for å spare penger.', 'neutral', 'Hjem igjen', 'home');
      return { ok: true, message: 'Du bor hjemme igjen.' };
    }),
  deposit: (state: GameState, target: 'savingsAccount' | 'funds' | 'stocks' | 'pensionSavings', amount: number) =>
    run(state, (sim) => {
      const f = sim.s.finances;
      const a = Math.floor(Math.min(amount, f.cash));
      if (a <= 0) return { ok: false, message: 'Ingen penger å flytte.' };
      if (target === 'stocks' && playerAge(sim.s) < 18) return { ok: false, message: 'Du må være 18 år.' };
      f.cash -= a;
      f[target] += a;
      return { ok: true, message: `Flyttet ${formatNOK(a)}.` };
    }),
  withdraw: (state: GameState, source: 'savingsAccount' | 'funds' | 'stocks', amount: number) =>
    run(state, (sim) => {
      const f = sim.s.finances;
      const a = Math.floor(Math.min(amount, f[source]));
      if (a <= 0) return { ok: false, message: 'Ingenting å ta ut.' };
      f[source] -= a;
      // Capital gains tax approximated on withdrawals from market investments.
      const tax = source === 'savingsAccount' ? 0 : Math.round(a * 0.1);
      f.cash += a - tax;
      if (tax > 0) addTx(sim.s, 0, 'tax', 'Gevinstskatt');
      return { ok: true, message: `Tok ut ${formatNOK(a - tax)}${tax ? ` (etter skatt)` : ''}.` };
    }),
  repayDebt: (state: GameState, debtId: string, amount: number) =>
    run(state, (sim) => {
      const { s } = sim;
      const d = s.finances.debts.find((x) => x.id === debtId);
      if (!d) return { ok: false, message: 'Fant ikke lånet.' };
      const a = Math.floor(Math.min(amount, d.principal, s.finances.cash));
      if (a <= 0) return { ok: false, message: 'Ingen penger tilgjengelig.' };
      addTx(s, -a, 'debt', `Ekstra nedbetaling: ${d.label}`);
      d.principal -= a;
      s.finances.debts = s.finances.debts.filter((x) => x.principal > 1);
      return { ok: true, message: `Betalte ned ${formatNOK(a)}.` };
    }),
  takeLoan: (state: GameState, amount: number) =>
    run(state, (sim) => {
      const { s } = sim;
      if (playerAge(s) < 18) return { ok: false, message: 'Du må være 18 år.' };
      const max = Math.round(500_000 * s.economy.priceIndex);
      const existing = s.finances.debts.filter((d) => d.kind === 'consumer').reduce((a, d) => a + d.principal, 0);
      if (existing + amount > max) return { ok: false, message: `Banken gir maks ${formatNOK(max)} i forbrukslån.` };
      s.finances.debts.push({ id: `d_${s.idCounter++}`, kind: 'consumer', label: 'Forbrukslån', principal: amount, rate: BALANCE.economy.consumerDebtRate, termYears: 5 });
      addTx(s, amount, 'debt', 'Forbrukslån');
      coverShortfall(sim);
      return { ok: true, message: `Lånte ${formatNOK(amount)} – til ${Math.round(BALANCE.economy.consumerDebtRate * 100)} % rente.` };
    }),
};
