import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui';
import type { MilestoneKind } from '@/types/core';

const META: Partial<Record<MilestoneKind, { title: string; icon: string; color: string }>> = {
  childBorn: { title: 'En ny stjerne er født', icon: 'baby', color: 'var(--berry)' },
  wedding: { title: 'Gift!', icon: 'gem', color: 'var(--accent)' },
  graduation: { title: 'Uteksaminert', icon: 'graduation-cap', color: 'var(--violet)' },
  firstHome: { title: 'Ditt første hjem', icon: 'home', color: 'var(--fjord)' },
  firstMillion: { title: 'Millionær!', icon: 'gem', color: 'var(--gold)' },
  careerPeak: { title: 'På toppen', icon: 'crown', color: 'var(--gold)' },
  retirement: { title: 'Pensjonist', icon: 'sunset', color: 'var(--accent)' },
  grandchild: { title: 'Et barnebarn!', icon: 'heart', color: 'var(--berry)' },
  business: { title: 'Gründer', icon: 'rocket', color: 'var(--fjord)' },
};

const CONFETTI = Array.from({ length: 22 }, (_, i) => i);

/** Full-screen, emotionally rewarding moment for life's big milestones. */
export function Celebration() {
  const m = useGame((s) => s.celebration);
  const close = useGame((s) => s.closeCelebration);
  const meta = m ? META[m.kind] : undefined;
  return (
    <AnimatePresence>
      {m && meta && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          {CONFETTI.map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute top-1/3 h-2.5 w-1.5 rounded-sm"
              style={{ left: `${10 + ((i * 37) % 80)}%`, background: ['var(--accent)', 'var(--gold)', 'var(--fjord)', 'var(--berry)', 'var(--violet)'][i % 5] }}
              initial={{ y: 0, opacity: 0, rotate: 0 }}
              animate={{ y: [0, -160 - (i % 5) * 30, 380], opacity: [0, 1, 0], rotate: (i % 2 ? 1 : -1) * 360 }}
              transition={{ duration: 2.2, delay: (i % 7) * 0.05, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="relative w-full max-w-[360px] rounded-[28px] bg-surface p-6 text-center shadow-[var(--shadow-lift)]"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="mx-auto -mt-14 mb-3 grid h-20 w-20 place-items-center rounded-full text-white shadow-[var(--shadow-lift)]"
              style={{ background: meta.color }}
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
            >
              <Icon name={meta.icon} size={38} strokeWidth={2.2} />
            </motion.div>
            <h2 className="text-2xl font-black tracking-tight">{meta.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{m.text}</p>
            <Button variant="primary" block className="mt-5" onClick={close}>
              Fantastisk!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
