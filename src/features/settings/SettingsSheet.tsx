import { Sheet } from '@/components/Sheet';
import { Segmented, Button, SectionTitle } from '@/components/ui';
import { useGame } from '@/store/gameStore';
import { t } from '@/i18n';
import type { ThemePref } from '@/services/meta';
import { downloadText } from '@/services/files';

interface Props {
  open: boolean;
  onClose: () => void;
  inGame?: boolean;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between py-3 text-left">
      <span className="text-[15px] font-semibold">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${value ? 'bg-fjord' : 'bg-surface-3'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export function SettingsSheet({ open, onClose, inGame }: Props) {
  const settings = useGame((s) => s.meta.settings);
  const update = useGame((s) => s.updateSettings);
  const quit = useGame((s) => s.quitToMenu);
  const exportCurrent = useGame((s) => s.exportCurrent);
  const state = useGame((s) => s.state);
  return (
    <Sheet open={open} onClose={onClose} title={t('settings')}>
      <SectionTitle>{t('theme')}</SectionTitle>
      <Segmented<ThemePref>
        value={settings.theme}
        onChange={(theme) => update({ theme })}
        options={[
          { value: 'system', label: t('themeSystem') },
          { value: 'light', label: t('themeLight') },
          { value: 'dark', label: t('themeDark') },
        ]}
      />
      <div className="mt-3 divide-y divide-line">
        <Toggle label={t('haptics')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />
        <Toggle label={t('sound')} value={settings.sound} onChange={(sound) => update({ sound })} />
        <Toggle label={t('reducedMotion')} value={settings.reducedMotion} onChange={(reducedMotion) => update({ reducedMotion })} />
      </div>
      {inGame && state && (
        <>
          <SectionTitle>{t('saves')}</SectionTitle>
          <div className="text-[13px] text-muted">Spillet lagres automatisk etter hvert valg. Vanskelighetsgrad: {t(`diff_${state.settings.difficulty}`)}.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              icon="download"
              onClick={() => {
                const json = exportCurrent();
                const p = state.people[state.playerId];
                if (json) downloadText(`lifepath-${p.firstName.toLowerCase()}-${state.year}.json`, json);
              }}
            >
              {t('exportSave')}
            </Button>
            <Button
              variant="danger"
              icon="door-open"
              onClick={() => {
                onClose();
                quit();
              }}
            >
              {t('quitToMenu')}
            </Button>
          </div>
        </>
      )}
      <SectionTitle>{t('about')}</SectionTitle>
      <p className="text-[13px] leading-relaxed text-muted">{t('aboutText')}</p>
      <p className="mt-2 text-[11px] text-faint">Versjon 0.1.0</p>
    </Sheet>
  );
}
