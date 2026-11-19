import { Sheet } from '@/components/Sheet';
import { Icon } from '@/components/Icon';
import { ACHIEVEMENTS } from '@/engine/achievements/definitions';
import { useGame } from '@/store/gameStore';
import { t } from '@/i18n';
import { Bar } from '@/components/ui';

export function AchievementsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const unlocked = useGame((s) => s.meta.achievements);
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <Sheet open={open} onClose={onClose} title={t('achievements')} subtitle={t('unlockedOf', { a: count, b: ACHIEVEMENTS.length })} tall>
      <Bar value={(count / ACHIEVEMENTS.length) * 100} color="var(--violet)" className="mb-4" height={8} />
      <div className="grid grid-cols-1 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = !!unlocked[a.id];
          const hidden = a.hidden && !got;
          return (
            <div key={a.id} className={`flex items-center gap-3 rounded-2xl p-3 ${got ? 'bg-violet-soft' : 'bg-surface-2'}`}>
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${got ? 'bg-violet text-white dark:text-[#120f24]' : 'bg-surface-3 text-faint'}`}>
                <Icon name={hidden ? 'lock' : a.icon} size={20} />
              </div>
              <div className="min-w-0">
                <div className={`text-[14.5px] font-extrabold ${got ? '' : 'text-muted'}`}>{hidden ? t('hiddenAchievement') : a.name}</div>
                <div className="text-[12.5px] text-muted">{hidden ? '???' : a.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
