import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, type Tab } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { getCity } from '@/data/countries';
import { playerAge } from '@/engine/simulation/helpers';
import { formatCompactNOK } from '@/utils/format';
import { t } from '@/i18n';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { EventSheet } from '@/features/events/EventSheet';
import { LifeTab } from '@/features/timeline/LifeTab';
import { CareerTab } from '@/features/career/CareerTab';
import { RelationsTab } from '@/features/relationships/RelationsTab';
import { FinanceTab } from '@/features/finances/FinanceTab';
import { ActivitiesTab } from '@/features/activities/ActivitiesTab';
import { DeathScreen } from '@/features/legacy/DeathScreen';
import { occupationLine } from './occupationLine';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'life', label: t('tabLife'), icon: 'heart-pulse' },
  { id: 'career', label: t('tabCareer'), icon: 'briefcase' },
  { id: 'relations', label: t('tabRelations'), icon: 'users' },
  { id: 'finance', label: t('tabFinance'), icon: 'wallet' },
  { id: 'activities', label: t('tabActivities'), icon: 'sparkles' },
];

export function GameScreen() {
  const state = useGame((s) => s.state);
  if (!state) return null;
  if (state.death) return <DeathScreen />;
  return <LiveGame />;
}

function LiveGame() {
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const [settings, setSettings] = useState(false);
  return (
    <>
      <Header onSettings={() => setSettings(true)} />
      <main className="no-scrollbar relative flex-1 overflow-y-auto px-4 pb-6 pt-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
            {tab === 'life' && <LifeTab />}
            {tab === 'career' && <CareerTab />}
            {tab === 'relations' && <RelationsTab />}
            {tab === 'finance' && <FinanceTab />}
            {tab === 'activities' && <ActivitiesTab />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AgeBar />
      <nav className="z-20 border-t border-line bg-surface/95 backdrop-blur pb-safe">
        <div className="flex">
          {TABS.map((x) => {
            const on = tab === x.id;
            return (
              <button key={x.id} onClick={() => setTab(x.id)} className="relative flex h-[60px] flex-1 flex-col items-center justify-center gap-1" aria-current={on ? 'page' : undefined}>
                {on && <motion.span layoutId="navpill" className="absolute top-1.5 h-8 w-14 rounded-full bg-accent-soft" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
                <Icon name={x.icon} size={21} className={`relative ${on ? 'text-accent' : 'text-muted'}`} strokeWidth={on ? 2.4 : 2} />
                <span className={`relative text-[10.5px] font-bold ${on ? 'text-ink' : 'text-muted'}`}>{x.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <EventSheet />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} inGame />
    </>
  );
}

function Header({ onSettings }: { onSettings: () => void }) {
  const s = useGameState();
  const p = s.people[s.playerId];
  const age = playerAge(s);
  const city = getCity(s.countryId, p.city).name;
  return (
    <header className="z-10 px-4 pb-2" style={{ paddingTop: 'max(env(safe-area-inset-top), 10px)' }}>
      <div className="flex items-center gap-3">
        <motion.div key={age} initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
          <Avatar look={p.appearanceLook} gender={p.gender} age={age} size={52} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-black leading-tight tracking-tight">
            {p.firstName} {p.lastName}
          </div>
          <div className="truncate text-[12.5px] font-semibold text-muted">
            {age} år · {city} · {occupationLine(s)}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Bank</div>
          <div className={`tabular text-[15px] font-black ${s.finances.cash < 0 ? 'text-neg' : ''}`}>{formatCompactNOK(s.finances.cash)} kr</div>
        </div>
        <button onClick={onSettings} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface shadow-[var(--shadow-card)] active:scale-95" aria-label={t('settings')}>
          <Icon name="settings" size={19} />
        </button>
      </div>
    </header>
  );
}

function AgeBar() {
  const s = useGameState();
  const doAge = useGame((x) => x.ageUp);
  const busy = useGame((x) => x.busy);
  const unresolved = s.pendingEvents.some((p) => !p.resolved);
  const age = playerAge(s);
  return (
    <div className="z-10 px-4 pb-2 pt-1">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={doAge}
        disabled={busy || unresolved}
        className="relative flex h-[58px] w-full items-center justify-between overflow-hidden rounded-[20px] bg-accent px-5 text-on-accent shadow-[0_10px_24px_-12px_var(--accent)] disabled:opacity-60"
      >
        <span className="text-left">
          <span className="block text-[11px] font-bold uppercase tracking-widest opacity-80">{s.year}</span>
          <span className="block text-[17px] font-black leading-tight">{unresolved ? t('resolveFirst') : t('ageUp')}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-black/15 px-3 py-1 text-[14px] font-black tabular">{age} → {age + 1}</span>
          <Icon name="chevron-right" size={22} strokeWidth={3} />
        </span>
      </motion.button>
    </div>
  );
}
