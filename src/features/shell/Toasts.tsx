import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { Icon } from '@/components/Icon';

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const drop = useGame((s) => s.dropToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const tone =
            t.tone === 'achievement'
              ? 'bg-violet text-white dark:text-[#120f24]'
              : t.tone === 'positive'
                ? 'bg-surface text-ink border-l-4 border-pos'
                : t.tone === 'negative'
                  ? 'bg-surface text-ink border-l-4 border-neg'
                  : 'bg-surface text-ink';
          return (
            <motion.button
              key={t.id}
              layout
              onClick={() => drop(t.id)}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              className={`pointer-events-auto flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[13.5px] font-semibold shadow-[var(--shadow-lift)] ${tone}`}
            >
              {t.tone === 'achievement' && <Icon name="award" size={22} />}
              <div className="min-w-0">
                {t.title && <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">{t.title}</div>}
                <div className="leading-snug">{t.text}</div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
