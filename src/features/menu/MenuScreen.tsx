import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { Button, Card, SectionTitle } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { AchievementsSheet } from '@/features/achievements/AchievementsSheet';
import { downloadText, pickTextFile } from '@/services/files';
import type { SlotInfo } from '@/services/saves';
import { t } from '@/i18n';

export function MenuScreen() {
  const slots = useGame((s) => s.slots);
  const lastSlot = useGame((s) => s.slot);
  const meta = useGame((s) => s.meta);
  const loadSlot = useGame((s) => s.loadSlot);
  const setScreen = useGame((s) => s.setScreen);
  const removeSlot = useGame((s) => s.removeSlot);
  const exportSlot = useGame((s) => s.exportSlot);
  const importSave = useGame((s) => s.importSave);
  const [settings, setSettings] = useState(false);
  const [achievements, setAchievements] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [slotMenu, setSlotMenu] = useState<SlotInfo | null>(null);

  const last = slots.find((s) => s.slot === lastSlot && !s.empty && !s.corrupt);
  const emptySlot = slots.find((s) => s.empty);

  const startNew = () => setScreen('create');

  const doImport = async () => {
    const json = await pickTextFile();
    if (!json) return;
    const target = emptySlot?.slot ?? lastSlot;
    await importSave(json, target);
  };

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
      <div className="flex items-center justify-between">
        <button onClick={() => setAchievements(true)} className="flex h-10 items-center gap-2 rounded-full bg-surface px-3 text-[13px] font-bold shadow-[var(--shadow-card)] active:scale-95">
          <Icon name="award" size={17} className="text-violet" /> {Object.keys(meta.achievements).length}
        </button>
        <button onClick={() => setSettings(true)} className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-[var(--shadow-card)] active:scale-95" aria-label={t('settings')}>
          <Icon name="settings" size={19} />
        </button>
      </div>

      <motion.div className="mt-10 flex flex-col items-center text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Logo />
        <h1 className="mt-4 text-[40px] font-black leading-none tracking-tight">
          Life<span className="text-accent">Path</span>
        </h1>
        <p className="mt-2 text-[15px] text-muted">{t('tagline')}</p>
      </motion.div>

      <div className="mt-10 flex flex-col gap-3">
        {last && (
          <Button variant="primary" size="lg" block icon="play" onClick={() => loadSlot(last.slot)}>
            {t('continue')} – {last.name?.split(' ')[0]}, {last.age} år
          </Button>
        )}
        <Button variant={last ? 'secondary' : 'primary'} size="lg" block icon="sparkles" onClick={startNew}>
          {t('newLife')}
        </Button>
      </div>

      <SectionTitle
        action={
          <button onClick={doImport} className="flex items-center gap-1 text-[12px] font-bold text-fjord">
            <Icon name="upload" size={14} /> {t('importSave')}
          </button>
        }
      >
        {t('saves')}
      </SectionTitle>
      <div className="flex flex-col gap-2">
        {slots.map((s) => (
          <Card key={s.slot} className="!p-3" onClick={s.empty ? startNew : () => setSlotMenu(s)}>
            <div className="flex items-center gap-3">
              {s.empty || s.corrupt || !s.look || !s.gender ? (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-faint">
                  <Icon name={s.corrupt ? 'alert-triangle' : 'plus'} size={20} />
                </div>
              ) : (
                <Avatar look={s.look} gender={s.gender} age={s.age ?? 30} size={48} dead={s.dead} />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold">{s.empty ? t('emptySlot') : s.corrupt ? t('corruptSlot') : s.name}</div>
                {!s.empty && !s.corrupt && (
                  <div className="text-[12.5px] text-muted">
                    {s.dead ? '✝ ' : ''}
                    {s.age} år · {s.year} · Generasjon {s.generation}
                  </div>
                )}
              </div>
              <Icon name="chevron-right" className="text-faint" />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 text-center">
        <Card className="!p-3">
          <div className="text-2xl font-black tabular">{meta.livesLived}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('livesLived')}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-2xl font-black tabular">{meta.bestLegacy}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('bestLegacy')}</div>
        </Card>
      </div>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <AchievementsSheet open={achievements} onClose={() => setAchievements(false)} />

      <Sheet open={!!slotMenu} onClose={() => setSlotMenu(null)} title={slotMenu?.name ?? ''} subtitle={slotMenu && !slotMenu.corrupt ? `${slotMenu.age} år · ${slotMenu.year}` : undefined}>
        {slotMenu && (
          <div className="flex flex-col gap-2 pt-2">
            {!slotMenu.corrupt && (
              <Button
                variant="primary"
                block
                icon="play"
                onClick={() => {
                  void loadSlot(slotMenu.slot);
                  setSlotMenu(null);
                }}
              >
                {t('continue')}
              </Button>
            )}
            {!slotMenu.corrupt && (
              <Button
                block
                icon="download"
                onClick={async () => {
                  const json = await exportSlot(slotMenu.slot);
                  if (json) downloadText(`lifepath-slot${slotMenu.slot + 1}.json`, json);
                }}
              >
                {t('exportSave')}
              </Button>
            )}
            <Button
              block
              variant="danger"
              icon="trash-2"
              onClick={() => {
                setConfirmDelete(slotMenu.slot);
                setSlotMenu(null);
              }}
            >
              {t('deleteSave')}
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title={t('deleteSave')}>
        <p className="text-[14px] text-muted">{t('confirmDelete')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => setConfirmDelete(null)}>{t('cancel')}</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (confirmDelete !== null) await removeSlot(confirmDelete);
              setConfirmDelete(null);
            }}
          >
            {t('deleteSave')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Logo() {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
      <rect width="84" height="84" rx="24" fill="var(--accent)" />
      <path d="M18 60c10-2 14-10 20-18s14-14 28-14" stroke="var(--on-accent)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="60" r="6" fill="var(--on-accent)" />
      <circle cx="66" cy="28" r="7" fill="var(--gold)" stroke="var(--on-accent)" strokeWidth="3" />
    </svg>
  );
}
