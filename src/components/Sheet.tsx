import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** When false the sheet cannot be dismissed by tapping outside (unresolved decisions). */
  dismissable?: boolean;
  footer?: ReactNode;
  tall?: boolean;
}

/** Mobile bottom sheet with backdrop, drag-to-close and safe-area padding. */
export function Sheet({ open, onClose, title, subtitle, children, dismissable = true, footer, tall }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/45" onClick={() => dismissable && onClose?.()} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative flex w-full max-w-[480px] flex-col rounded-t-[26px] bg-surface pb-safe shadow-[var(--shadow-lift)] ${tall ? 'h-[88dvh]' : 'max-h-[88dvh]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            drag={dismissable ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => {
              if (dismissable && (info.offset.y > 120 || info.velocity.y > 600)) onClose?.();
            }}
          >
            <div className="flex justify-center pt-2.5">
              <div className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            {(title || dismissable) && (
              <div className="flex items-start gap-3 px-5 pb-2 pt-2">
                <div className="min-w-0 flex-1">
                  {title && <h2 className="text-lg font-extrabold leading-tight tracking-tight">{title}</h2>}
                  {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
                </div>
                {dismissable && onClose && (
                  <button onClick={onClose} className="-mr-1 grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted active:scale-95" aria-label="Lukk">
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
