import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Empty, Pill } from '@/components/ui';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@/data/activities';
import { activitiesIn, activityAvailability, visibleCategories } from '@/engine/activities/activities';
import { actions } from '@/engine/simulation/actions';
import { formatNOK } from '@/utils/format';
import { t } from '@/i18n';

const CAT_TONE: Partial<Record<ActivityCategory, string>> = {
  crime: 'bg-neg-soft text-neg',
  gambling: 'bg-gold-soft text-gold',
  dating: 'bg-berry-soft text-berry',
  medical: 'bg-fjord-soft text-fjord',
  health: 'bg-pos-soft text-pos',
  prison: 'bg-neg-soft text-neg',
};

export function ActivitiesTab() {
  const s = useGameState();
  const [cat, setCat] = useState<ActivityCategory | null>(null);
  const cats = visibleCategories(s);
  if (cats.length === 0) return <Empty icon="baby" text="Du er for liten til å bestemme selv ennå." />;
  return (
    <div>
      <p className="mb-3 mt-1 px-1 text-[13px] text-muted">Hver aktivitet kan gjøres et begrenset antall ganger per år, og effekten avtar ved gjentakelse.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {cats.map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCat(c.id)}
            className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] bg-surface p-3.5 text-left shadow-[var(--shadow-card)]"
          >
            <div className={`grid h-11 w-11 place-items-center rounded-2xl ${CAT_TONE[c.id] ?? 'bg-accent-soft text-accent'}`}>
              <Icon name={c.icon} size={21} />
            </div>
            <div className="text-[14px] font-extrabold leading-tight">{c.name}</div>
          </motion.button>
        ))}
      </div>
      <CategorySheet cat={cat} onClose={() => setCat(null)} />
    </div>
  );
}

function CategorySheet({ cat, onClose }: { cat: ActivityCategory | null; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const [result, setResult] = useState<{ text: string; tone: string } | null>(null);
  const meta = ACTIVITY_CATEGORIES.find((c) => c.id === cat);
  const list = cat ? activitiesIn(cat) : [];
  return (
    <Sheet
      open={!!cat}
      onClose={() => {
        setResult(null);
        onClose();
      }}
      title={meta?.name}
      tall={list.length > 5}
    >
      <AnimatePresence>
        {result && (
          <motion.div
            key={result.text}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-3 rounded-2xl p-3 text-[14px] font-semibold ${result.tone === 'positive' ? 'bg-pos-soft' : result.tone === 'negative' ? 'bg-neg-soft' : 'bg-surface-2'}`}
          >
            {result.text}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-2">
        {list.map((a) => {
          const av = activityAvailability(s, a);
          return (
            <motion.button
              key={a.id}
              whileTap={{ scale: 0.98 }}
              disabled={!av.ok}
              onClick={() => {
                const r = act((st) => actions.activity(st, a.id));
                if (r?.ok) setResult({ text: r.message, tone: r.tone ?? 'neutral' });
                if (useGame.getState().state?.pendingEvents.some((p) => !p.resolved)) onClose();
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left transition disabled:opacity-45"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[14.5px] font-extrabold">
                  {a.name}
                  {a.risky && <Icon name="alert-triangle" size={14} className="text-gold" />}
                </div>
                <div className="text-[12.5px] text-muted">{a.description}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill tone={av.cost > 0 ? 'gold' : 'pos'}>{av.cost > 0 ? formatNOK(av.cost) : t('free')}</Pill>
                  {av.ok ? <Pill>{t('usesLeft', { n: av.usesLeft })}</Pill> : <Pill tone="neg">{av.reason}</Pill>}
                </div>
              </div>
              <Icon name="chevron-right" className="shrink-0 text-faint" />
            </motion.button>
          );
        })}
      </div>
    </Sheet>
  );
}
