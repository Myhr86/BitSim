import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { STAT_KEYS, type StatKey } from '@/types/core';
import { Bar, Button, Card, Pill, SectionTitle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { getAddictionDef, getConditionDef } from '@/data/health';
import { actions } from '@/engine/simulation/actions';
import { formatNOK } from '@/utils/format';
import { t } from '@/i18n';
import { toneColor, TONE_ICON } from './tone';
import type { TimelineEntry } from '@/types/game';

const STAT_META: Record<StatKey, { icon: string; color: string; inverse?: boolean }> = {
  happiness: { icon: 'smile', color: 'var(--gold)' },
  health: { icon: 'heart-pulse', color: 'var(--neg)' },
  intelligence: { icon: 'brain', color: 'var(--violet)' },
  appearance: { icon: 'sparkles', color: 'var(--berry)' },
  fitness: { icon: 'dumbbell', color: 'var(--fjord)' },
  stress: { icon: 'zap', color: 'var(--accent)', inverse: true },
  reputation: { icon: 'star', color: 'var(--gold)' },
  discipline: { icon: 'target', color: 'var(--fjord)' },
};

export function LifeTab() {
  const s = useGameState();
  const p = s.people[s.playerId];
  const [treat, setTreat] = useState<string | null>(null);
  return (
    <div>
      <Card className="!p-3.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {STAT_KEYS.map((k) => (
            <StatLine key={k} k={k} value={p.stats[k]} />
          ))}
        </div>
      </Card>

      {(s.health.conditions.length > 0 || Object.keys(s.health.addictions).length > 0) && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {s.health.conditions.map((c) => {
            const def = getConditionDef(c.id);
            return (
              <button key={c.id} onClick={() => setTreat(c.id)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-neg-soft px-3 py-1.5 text-[12.5px] font-bold text-neg active:scale-95">
                <Icon name="stethoscope" size={14} />
                {def?.name}
                {c.treated && <span className="opacity-70">· beh.</span>}
              </button>
            );
          })}
          {Object.entries(s.health.addictions).map(([id, sev]) => (
            <button key={id} onClick={() => setTreat(`add:${id}`)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-[12.5px] font-bold text-gold active:scale-95">
              <Icon name="alert-triangle" size={14} />
              {getAddictionDef(id)?.name} {Math.round(sev)}%
            </button>
          ))}
        </div>
      )}

      {s.crime.prisonYearsLeft > 0 && (
        <Card className="mt-3 flex items-center gap-3 !bg-neg-soft">
          <Icon name="lock" className="text-neg" />
          <div className="text-[14px] font-bold text-neg">{t('prisonLeft', { n: s.crime.prisonYearsLeft })}</div>
        </Card>
      )}

      <Timeline entries={s.timeline} />
      <TreatSheet id={treat} onClose={() => setTreat(null)} />
    </div>
  );
}

function StatLine({ k, value }: { k: StatKey; value: number }) {
  const m = STAT_META[k];
  const v = Math.round(value);
  const warn = m.inverse ? v >= 70 : v <= 25;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-muted">
          <Icon name={m.icon} size={13} />
          {t(`stat_${k}`)}
        </span>
        <span className={`tabular text-[12.5px] font-black ${warn ? 'text-neg' : ''}`}>{v}</span>
      </div>
      <Bar value={v} color={m.color} height={7} />
    </div>
  );
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const [limit, setLimit] = useState(12);
  const groups = useMemo(() => {
    const map = new Map<number, TimelineEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.age) ?? [];
      arr.push(e);
      map.set(e.age, arr);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [entries]);
  if (groups.length === 0) return <p className="mt-6 text-center text-muted">{t('timelineEmpty')}</p>;
  const shown = groups.slice(0, limit);
  return (
    <div className="mt-2">
      {shown.map(([age, list], gi) => (
        <section key={age}>
          <SectionTitle>
            <span className="text-ink">{t('ageHeading', { n: age })}</span> <span className="font-bold normal-case tracking-normal text-faint">· {list[0].year}</span>
          </SectionTitle>
          <div className="relative space-y-2 pl-4">
            <div className="absolute bottom-2 left-[5px] top-2 w-[2px] rounded bg-line" />
            {[...list].reverse().map((e, i) => (
              <TimelineItem key={e.id} e={e} fresh={gi === 0} index={i} />
            ))}
          </div>
        </section>
      ))}
      {groups.length > limit && (
        <Button block className="mt-4" icon="chevron-down" onClick={() => setLimit((l) => l + 15)}>
          {t('showOlder')}
        </Button>
      )}
    </div>
  );
}

function TimelineItem({ e, fresh, index }: { e: TimelineEntry; fresh: boolean; index: number }) {
  const c = toneColor(e.tone);
  const big = e.tone === 'milestone';
  return (
    <motion.div initial={fresh ? { opacity: 0, x: -8 } : false} animate={{ opacity: 1, x: 0 }} transition={{ delay: fresh ? index * 0.05 : 0 }} className="relative">
      <span className="absolute -left-[15px] top-4 h-2.5 w-2.5 rounded-full ring-4 ring-bg" style={{ background: c.fg }} />
      <div className={`rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)] ${big ? 'border-l-4' : ''}`} style={big ? { borderColor: c.fg } : undefined}>
        <div className="flex gap-2.5">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: c.soft, color: c.fg }}>
            <Icon name={e.icon ?? TONE_ICON[e.tone]} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            {e.title && <div className="text-[13.5px] font-extrabold leading-tight">{e.title}</div>}
            <p className="text-[13.5px] leading-snug text-ink/85">{e.text}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TreatSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  if (!id) return <Sheet open={false}>{null}</Sheet>;
  const isAdd = id.startsWith('add:');
  const realId = isAdd ? id.slice(4) : id;
  const cond = s.health.conditions.find((c) => c.id === realId);
  const def = isAdd ? undefined : getConditionDef(realId);
  const add = isAdd ? getAddictionDef(realId) : undefined;
  return (
    <Sheet open onClose={onClose} title={def?.name ?? add?.name} subtitle={isAdd ? t('addictions') : def?.chronic ? 'Kronisk tilstand' : 'Akutt tilstand'}>
      {def && cond && (
        <>
          <div className="mb-1 flex justify-between text-[12px] font-bold text-muted">
            <span>Alvorlighetsgrad</span>
            <span>{Math.round(cond.severity)}%</span>
          </div>
          <Bar value={cond.severity} color="var(--neg)" />
          <div className="mt-3 flex flex-wrap gap-2">
            {cond.treated && <Pill tone="pos">Under behandling</Pill>}
            {def.serious && <Pill tone="neg">Alvorlig</Pill>}
            {def.mental && <Pill tone="violet">Psykisk helse</Pill>}
          </div>
          <div className="mt-4 grid gap-2">
            <Button
              block
              variant="fjord"
              icon="stethoscope"
              onClick={() => {
                act((st) => actions.treat(st, realId, false));
                onClose();
              }}
            >
              {t('publicCare')} · {formatNOK((def.treatCost + 400) * s.economy.priceIndex)}
            </Button>
            <Button
              block
              icon="building-2"
              onClick={() => {
                act((st) => actions.treat(st, realId, true));
                onClose();
              }}
            >
              {t('privateCare')} · {formatNOK((def.treatCost + 40_000) * s.economy.priceIndex)}
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted">Maks tre legebesøk per år. Privat klinikk gir høyere sjanse for vellykket behandling.</p>
        </>
      )}
      {add && (
        <>
          <p className="text-[14px] text-muted">Avhengigheten koster deg helse, lykke og penger hvert år.</p>
          <Button
            block
            variant="fjord"
            className="mt-4"
            icon="shield-check"
            onClick={() => {
              act((st) => actions.rehab(st, realId));
              onClose();
            }}
          >
            {t('rehab')} · {formatNOK(15_000 * s.economy.priceIndex)}
          </Button>
        </>
      )}
    </Sheet>
  );
}
