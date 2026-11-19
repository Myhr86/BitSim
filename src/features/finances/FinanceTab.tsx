import { useMemo, useState } from 'react';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Bar, Button, Card, Empty, Money, Pill, Row, SectionTitle, Segmented } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { actions } from '@/engine/simulation/actions';
import { assetPrice, canAffordProperty, netWorth, totalDebt } from '@/engine/assets/assets';
import { annualRent, livingCost } from '@/engine/economy/finance';
import { annualIncomeEstimate } from '@/engine/economy/income';
import { ASSETS, BUSINESSES, getAssetDef, type AssetDef } from '@/data/assets';
import { playerAge } from '@/engine/simulation/helpers';
import { formatNOK, formatPct } from '@/utils/format';
import type { Asset, Lifestyle } from '@/types/game';
import { t } from '@/i18n';

type Account = 'savingsAccount' | 'funds' | 'stocks' | 'pensionSavings';

export function FinanceTab() {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const age = playerAge(s);
  const [market, setMarket] = useState(false);
  const [biz, setBiz] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loan, setLoan] = useState(false);
  const f = s.finances;
  const nw = netWorth(s);
  const last = f.history[f.history.length - 1];
  const debt = totalDebt(s);
  const income = annualIncomeEstimate(s);
  const adult = age >= 18;

  return (
    <div>
      <Card className="!p-4">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-muted">{t('netWorth')}</div>
        <Money value={nw} className={`text-[30px] font-black leading-tight ${nw < 0 ? 'text-neg' : ''}`} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Mini label={t('cash')} value={f.cash} />
          <Mini label={t('income')} value={income} />
          <Mini label={t('debts')} value={-debt} tone={debt > 0 ? 'neg' : undefined} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-muted">
          <Pill tone={s.economy.phase === 'boom' ? 'pos' : s.economy.phase === 'recession' ? 'neg' : 'neutral'}>{t(`phase_${s.economy.phase}`)}</Pill>
          <span>
            {t('interest')} {formatPct(s.economy.interestRate)} · {t('inflation')} {formatPct(s.economy.inflation)}
          </span>
        </div>
      </Card>

      {adult && (
        <>
          <SectionTitle>{t('lifestyle')}</SectionTitle>
          <Segmented<Lifestyle>
            value={f.lifestyle}
            onChange={(v) => act((st) => actions.setLifestyle(st, v))}
            options={[
              { value: 'frugal', label: t('ls_frugal') },
              { value: 'normal', label: t('ls_normal') },
              { value: 'comfortable', label: t('ls_comfortable') },
              { value: 'luxury', label: t('ls_luxury') },
            ]}
          />
          <div className="mt-2 px-1 text-[12px] text-muted">
            Levekostnader ca. {formatNOK(livingCost(s))}/år
            {!s.livingWithParents && !s.assets.some((a) => a.residence) ? ` + husleie ${formatNOK(annualRent(s))}/år` : ''}. Mer luksus gir mer lykke – men koster.
          </div>
          <Card className="mt-2 flex items-center gap-3 !py-3">
            <Icon name="home" className="text-fjord" />
            <div className="flex-1 text-[14px] font-bold">{s.livingWithParents ? t('livingAtHome') : s.assets.some((a) => a.residence) ? 'Du bor i egen bolig' : 'Du leier bolig'}</div>
            {s.livingWithParents ? (
              <Button size="sm" onClick={() => act((st) => actions.moveOut(st))}>
                {t('moveOut')}
              </Button>
            ) : (
              !s.assets.some((a) => a.residence) && (
                <Button size="sm" onClick={() => act((st) => actions.moveHome(st))}>
                  {t('moveHome')}
                </Button>
              )
            )}
          </Card>
        </>
      )}

      <SectionTitle>Sparing og investering</SectionTitle>
      <Card className="!py-1">
        {(
          [
            ['savingsAccount', t('savings'), 'piggy-bank', `${formatPct(Math.max(0, s.economy.interestRate - 0.01))} rente`],
            ['funds', t('funds'), 'line-chart', `Fjorår ${formatPct(s.economy.lastStockReturn)}`],
            ['stocks', t('stocks'), 'trending-up', 'Høy risiko'],
            ['pensionSavings', t('pension'), 'sunset', 'Låst til pensjon'],
          ] as [Account, string, string, string][]
        ).map(([key, label, icon, sub]) => (
          <Row key={key} onClick={() => setAccount(key)} icon={<Icon name={icon} size={17} />} iconTone="gold" title={label} subtitle={sub} right={<Money value={f[key]} className="text-[14px] font-extrabold" />} />
        ))}
      </Card>

      <SectionTitle action={adult ? <button className="text-[12px] font-bold text-fjord" onClick={() => setLoan(true)}>{t('takeLoan')}</button> : undefined}>{t('debts')}</SectionTitle>
      <Card className="!py-1">
        {f.debts.length === 0 ? (
          <Empty icon="party-popper" text={t('noDebts')} />
        ) : (
          f.debts.map((d) => (
            <Row
              key={d.id}
              icon={<Icon name="receipt" size={17} />}
              iconTone="neg"
              title={d.label}
              subtitle={`${formatPct(d.kind === 'mortgage' ? s.economy.interestRate + d.rate : d.rate)} rente · ${d.termYears} år igjen`}
              right={
                <div className="flex flex-col items-end gap-1">
                  <Money value={d.principal} className="text-[14px] font-extrabold" />
                  <button className="text-[11.5px] font-bold text-fjord" onClick={() => act((st) => actions.repayDebt(st, d.id, Math.min(st.finances.cash, d.principal)))} disabled={f.cash <= 0}>
                    {t('repay')}
                  </button>
                </div>
              }
            />
          ))
        )}
      </Card>

      <SectionTitle
        action={
          adult ? (
            <div className="flex gap-3">
              <button className="text-[12px] font-bold text-fjord" onClick={() => setBiz(true)}>
                {t('startBusiness')}
              </button>
              <button className="text-[12px] font-bold text-fjord" onClick={() => setMarket(true)}>
                {t('market')}
              </button>
            </div>
          ) : undefined
        }
      >
        {t('assets')}
      </SectionTitle>
      <Card className="!py-1">
        {s.assets.length === 0 ? (
          <Empty icon="home" text={t('noAssets')} />
        ) : (
          s.assets.map((a) => (
            <Row
              key={a.id}
              onClick={() => setAsset(a)}
              icon={<Icon name={assetIcon(a.kind)} size={17} />}
              iconTone={a.kind === 'business' ? 'violet' : 'fjord'}
              title={a.name}
              subtitle={a.kind === 'business' ? `Nivå ${a.businessLevel} · resultat ${formatNOK(a.lastIncome)}` : `${a.residence ? 'Bolig · ' : a.rented ? 'Utleid · ' : ''}${t('condition')} ${Math.round(a.condition)}%`}
              right={<Money value={a.value} className="text-[14px] font-extrabold" />}
            />
          ))
        )}
      </Card>

      {last && (
        <>
          <SectionTitle>
            {t('lastYear')} · {last.year}
          </SectionTitle>
          <Card className="space-y-1.5 text-[14px]">
            <Line label={t('income')} value={last.income} />
            <Line label={t('taxes')} value={-last.taxes} />
            <Line label={t('expenses')} value={-last.expenses} />
            <Line label={t('debtPayments')} value={-last.debtPayments} />
            <Line label={t('returns')} value={last.investmentReturn} />
            <div className="border-t border-line pt-1.5">
              <Line label="Endring i formue" value={last.netChange} bold />
            </div>
          </Card>
          <NetWorthChart />
        </>
      )}

      <SectionTitle>{t('transactions')}</SectionTitle>
      <Card className="!py-1">
        {f.transactions.length === 0 ? (
          <Empty icon="receipt" text="Ingen transaksjoner ennå." />
        ) : (
          [...f.transactions]
            .reverse()
            .slice(0, 25)
            .map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{tx.label}</div>
                  <div className="text-[11.5px] text-muted">
                    {tx.year} · {tx.age} år
                  </div>
                </div>
                <Money value={tx.amount} sign className={`shrink-0 font-extrabold ${tx.amount >= 0 ? 'text-pos' : ''}`} />
              </div>
            ))
        )}
      </Card>

      <AccountSheet account={account} onClose={() => setAccount(null)} />
      <MarketSheet open={market} onClose={() => setMarket(false)} />
      <BusinessSheet open={biz} onClose={() => setBiz(false)} />
      <AssetSheet asset={asset} onClose={() => setAsset(null)} />
      <LoanSheet open={loan} onClose={() => setLoan(false)} />
    </div>
  );
}

function assetIcon(kind: string): string {
  const m: Record<string, string> = { apartment: 'building', house: 'home', cabin: 'tent-tree', rental: 'building-2', farm: 'sprout', commercial: 'store', car: 'car', motorcycle: 'bike', boat: 'ship', luxury: 'gem', business: 'rocket' };
  return m[kind] ?? 'tag';
}

function Mini({ label, value, tone }: { label: string; value: number; tone?: 'neg' }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-2.5">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{label}</div>
      <Money value={value} className={`text-[13px] font-black ${tone === 'neg' ? 'text-neg' : ''}`} />
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-extrabold' : ''}`}>
      <span className="text-muted">{label}</span>
      <Money value={value} sign className={value > 0 ? 'text-pos' : value < 0 ? 'text-neg' : ''} />
    </div>
  );
}

function NetWorthChart() {
  const s = useGameState();
  const h = s.finances.history.slice(-40);
  if (h.length < 3) return null;
  const vals = h.map((x) => x.netWorth);
  const min = Math.min(0, ...vals);
  const max = Math.max(1, ...vals);
  const W = 320;
  const H = 90;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - ((v - min) / (max - min)) * H}`).join(' ');
  const zeroY = H - ((0 - min) / (max - min)) * H;
  return (
    <Card className="mt-2 !p-3">
      <div className="mb-1 flex justify-between text-[11px] font-bold text-muted">
        <span>Formue siste {h.length} år</span>
        <span>{formatNOK(max)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" preserveAspectRatio="none" aria-label="Utvikling i nettoformue">
        <line x1="0" x2={W} y1={zeroY} y2={zeroY} stroke="var(--line)" strokeDasharray="4 4" />
        <polyline points={`0,${H} ${pts} ${W},${H}`} fill="var(--fjord-soft)" stroke="none" />
        <polyline points={pts} fill="none" stroke="var(--fjord)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </Card>
  );
}

function AccountSheet({ account, onClose }: { account: Account | null; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const [pct, setPct] = useState(25);
  if (!account) return <Sheet open={false}>{null}</Sheet>;
  const labels: Record<Account, string> = { savingsAccount: t('savings'), funds: t('funds'), stocks: t('stocks'), pensionSavings: t('pension') };
  const depositAmt = Math.floor((s.finances.cash * pct) / 100);
  const withdrawAmt = account === 'pensionSavings' ? 0 : Math.floor((s.finances[account] * pct) / 100);
  return (
    <Sheet open onClose={onClose} title={labels[account]} subtitle={`Saldo ${formatNOK(s.finances[account])}`}>
      <div className="flex justify-between text-[12px] font-bold text-muted">
        <span>Andel</span>
        <span>{pct}%</span>
      </div>
      <input type="range" min={5} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" aria-label="Andel" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="fjord" disabled={depositAmt <= 0} onClick={() => act((st) => actions.deposit(st, account, depositAmt))}>
          {t('deposit')} {formatNOK(depositAmt)}
        </Button>
        <Button disabled={withdrawAmt <= 0} onClick={() => act((st) => actions.withdraw(st, account as 'savingsAccount' | 'funds' | 'stocks', withdrawAmt))}>
          {t('withdraw')} {formatNOK(withdrawAmt)}
        </Button>
      </div>
      <p className="mt-3 text-[12px] text-muted">
        {account === 'funds' && 'Indeksfond følger børsen: god langsiktig avkastning, men kan falle i krisetider.'}
        {account === 'stocks' && 'Enkeltaksjer svinger kraftig. Du kan tjene mye – eller tape det meste.'}
        {account === 'savingsAccount' && 'Trygg sparing med lav rente.'}
        {account === 'pensionSavings' && 'Pensjonssparing kan ikke tas ut før du går av med pensjon. Arbeidsgiveren din setter også inn 2 % av lønnen.'}
      </p>
    </Sheet>
  );
}

function MarketSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const [cat, setCat] = useState<'property' | 'vehicles' | 'luxury'>('property');
  const [sel, setSel] = useState<AssetDef | null>(null);
  const list = useMemo(
    () => ASSETS.filter((a) => (cat === 'property' ? a.property : cat === 'vehicles' ? ['car', 'motorcycle', 'boat'].includes(a.kind) : a.kind === 'luxury')),
    [cat],
  );
  const price = sel ? assetPrice(s, sel) : 0;
  const afford = sel?.property ? canAffordProperty(s, price) : null;
  return (
    <Sheet open={open} onClose={onClose} title={t('market')} tall>
      <Segmented value={cat} onChange={setCat} options={[{ value: 'property', label: t('property') }, { value: 'vehicles', label: t('vehicles') }, { value: 'luxury', label: t('luxury') }]} />
      <div className="mt-2 divide-y divide-line">
        {list.map((a) => (
          <Row key={a.id} onClick={() => setSel(a)} icon={<Icon name={assetIcon(a.kind)} size={17} />} iconTone="fjord" title={a.name} subtitle={a.description} right={<Money value={assetPrice(s, a)} className="text-[13px] font-extrabold" />} />
        ))}
      </div>
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.name} subtitle={sel?.description}>
        {sel && (
          <div>
            <div className="text-center">
              <Money value={price} className="text-3xl font-black" />
              {sel.property && <div className="text-[12px] text-muted">+ omkostninger {formatNOK(price * 0.025)}</div>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[12px]">
              <div className="rounded-2xl bg-surface-2 p-2.5">
                <div className="font-black">{formatNOK(price * (sel.maintenance + sel.insurance))}</div>
                <div className="text-muted">drift per år</div>
              </div>
              <div className="rounded-2xl bg-surface-2 p-2.5">
                <div className="font-black">{sel.property ? 'Følger boligmarkedet' : sel.drift < 0 ? `${Math.round(sel.drift * 100)} %/år` : `+${Math.round(sel.drift * 100)} %/år`}</div>
                <div className="text-muted">verdiutvikling</div>
              </div>
            </div>
            {afford && !afford.ok && (
              <p className="mt-3 rounded-2xl bg-neg-soft p-3 text-[13px] text-neg">
                {afford.reason === 'notEnoughEquity' ? `Du trenger minst ${formatNOK(afford.down)} i egenkapital (15 %).` : 'Banken mener inntekten din er for lav for et så stort lån (maks 5 × inntekt).'}
              </p>
            )}
            <div className="mt-4 grid gap-2">
              {sel.property && (
                <Button
                  variant="primary"
                  block
                  disabled={!afford?.ok}
                  onClick={() => {
                    act((st) => actions.buyAsset(st, sel.id, true));
                    setSel(null);
                  }}
                >
                  {t('withMortgage')}
                </Button>
              )}
              <Button
                variant={sel.property ? 'secondary' : 'primary'}
                block
                disabled={s.finances.cash < price * (sel.property ? 1.025 : 1)}
                onClick={() => {
                  act((st) => actions.buyAsset(st, sel.id, false));
                  setSel(null);
                }}
              >
                {t('cashOnly')}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </Sheet>
  );
}

function BusinessSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  return (
    <Sheet open={open} onClose={onClose} title={t('startBusiness')} subtitle="Med lån trenger du 30 % egenkapital" tall>
      <div className="space-y-2">
        {BUSINESSES.map((b) => {
          const cost = b.startCost * s.economy.priceIndex;
          return (
            <Card key={b.id} className="!bg-surface-2 !shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-extrabold">{b.name}</div>
                  <div className="text-[12.5px] text-muted">{b.description}</div>
                </div>
                <Money value={cost} className="shrink-0 text-[13px] font-black" />
              </div>
              <div className="mt-2 flex gap-1.5">
                <Pill tone={b.volatility > 0.5 ? 'neg' : 'fjord'}>Risiko {b.volatility > 0.5 ? 'høy' : b.volatility > 0.3 ? 'middels' : 'lav'}</Pill>
                <Pill>Krever {b.stat === 'intelligence' ? 'intelligens' : b.stat === 'appearance' ? 'utseende' : b.stat === 'fitness' ? 'form' : 'disiplin'}</Pill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" disabled={s.finances.cash < cost} onClick={() => { act((st) => actions.startBusiness(st, b.id, false)); onClose(); }}>
                  {t('cashOnly')}
                </Button>
                <Button size="sm" variant="fjord" disabled={s.finances.cash < cost * 0.3} onClick={() => { act((st) => actions.startBusiness(st, b.id, true)); onClose(); }}>
                  Med lån
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </Sheet>
  );
}

function AssetSheet({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  if (!asset) return <Sheet open={false}>{null}</Sheet>;
  const a = s.assets.find((x) => x.id === asset.id) ?? asset;
  const def = getAssetDef(a.catalogId);
  const linkedDebt = s.finances.debts.filter((d) => d.assetId === a.id).reduce((x, d) => x + d.principal, 0);
  const canRent = def?.property && !a.residence && def.kind !== 'rental' && def.kind !== 'commercial';
  return (
    <Sheet open onClose={onClose} title={a.name} subtitle={`Kjøpt ${a.purchaseYear} for ${formatNOK(a.purchasePrice)}`}>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-surface-2 p-3">
          <Money value={a.value} className="text-lg font-black" />
          <div className="text-[11px] font-bold text-muted">Verdi</div>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3">
          <Money value={a.value - linkedDebt} className="text-lg font-black" />
          <div className="text-[11px] font-bold text-muted">Egenkapital</div>
        </div>
      </div>
      {a.kind !== 'business' && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[12px] font-bold text-muted">
            <span>{t('condition')}</span>
            <span>{Math.round(a.condition)}%</span>
          </div>
          <Bar value={a.condition} color={a.condition < 40 ? 'var(--neg)' : 'var(--fjord)'} />
        </div>
      )}
      {a.lastIncome !== 0 && <p className="mt-3 text-[13px] text-muted">Fjorårets resultat: {formatNOK(a.lastIncome)}</p>}
      <div className="mt-4 grid gap-2">
        {canRent && (
          <Button block icon="key-round" onClick={() => act((st) => actions.toggleRent(st, a.id))}>
            {a.rented ? t('stopRent') : t('rent')}
          </Button>
        )}
        {a.kind !== 'business' && a.condition < 95 && (
          <Button block icon="hammer" onClick={() => act((st) => actions.repairAsset(st, a.id))}>
            {t('repair')} · {formatNOK(a.value * (100 - a.condition) * 0.0015)}
          </Button>
        )}
        <Button
          block
          variant="danger"
          icon="tag"
          onClick={() => {
            act((st) => actions.sellAsset(st, a.id));
            onClose();
          }}
        >
          {t('sell')} · {formatNOK(a.value * (def?.property ? 0.975 : 1))}
        </Button>
      </div>
    </Sheet>
  );
}

function LoanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const act = useGame((x) => x.act);
  const s = useGameState();
  const amounts = [25_000, 50_000, 100_000, 250_000].map((x) => Math.round(x * s.economy.priceIndex));
  return (
    <Sheet open={open} onClose={onClose} title={t('takeLoan')} subtitle="19 % rente, 5 års nedbetaling. Tenk deg om!">
      <div className="grid grid-cols-2 gap-2">
        {amounts.map((a) => (
          <Button
            key={a}
            onClick={() => {
              act((st) => actions.takeLoan(st, a));
              onClose();
            }}
          >
            {formatNOK(a)}
          </Button>
        ))}
      </div>
    </Sheet>
  );
}
