import { motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Sheet } from '@/components/Sheet';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui';
import { getEvent } from '@/data/events';
import { choiceCost } from '@/engine/events/resolve';
import { formatNOK } from '@/utils/format';
import { toneColor } from '@/features/timeline/tone';

/**
 * Shows the first pending event. Unresolved events cannot be dismissed, so the player
 * can never skip past a decision. The outcome stays visible until acknowledged.
 */
export function EventSheet() {
  const s = useGameState();
  const choose = useGame((x) => x.choose);
  const dismiss = useGame((x) => x.dismiss);
  const pending = s.pendingEvents[0];
  const ev = pending ? getEvent(pending.eventId) : undefined;
  const remaining = s.pendingEvents.filter((p) => !p.resolved).length;
  return (
    <Sheet open={!!pending && !s.death} dismissable={false}>
      {pending && ev && (
        <div className="pt-1">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: toneColor(ev.tone).soft, color: toneColor(ev.tone).fg }}>
              <Icon name={ev.icon ?? 'sparkles'} size={24} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-muted">
                {s.year} · {remaining > 1 ? `${remaining} hendelser` : 'Hendelse'}
              </div>
              <h2 className="text-xl font-black leading-tight tracking-tight">{pending.title}</h2>
            </div>
          </div>
          <p className="mt-3 text-[15.5px] leading-relaxed">{pending.text}</p>

          {!pending.resolved ? (
            <div className="mt-4 flex flex-col gap-2">
              {pending.choiceIds.map((ci) => {
                const c = ev.choices?.[ci];
                if (!c) return null;
                const cost = choiceCost(s, ev.id, ci, pending.vars);
                const cantAfford = cost > 0 && s.finances.cash < cost;
                return (
                  <motion.button
                    key={ci}
                    whileTap={{ scale: 0.98 }}
                    disabled={cantAfford}
                    onClick={() => choose(pending.instanceId, ci)}
                    className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-left text-[15px] font-bold transition active:bg-surface-3 disabled:opacity-40"
                  >
                    <span className="flex-1 leading-snug">{c.label}</span>
                    {cost > 0 && <span className={`shrink-0 text-[12px] font-extrabold ${cantAfford ? 'text-neg' : 'text-gold'}`}>{formatNOK(cost)}</span>}
                    <Icon name="chevron-right" size={18} className="shrink-0 text-faint" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className="rounded-2xl p-4" style={{ background: toneColor(pending.resolved.tone).soft }}>
                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: toneColor(pending.resolved.tone).fg }}>
                  {ev.choices?.[pending.resolved.choiceIndex]?.label}
                </div>
                <p className="text-[15px] font-semibold leading-relaxed">{pending.resolved.text}</p>
              </div>
              <Button variant="primary" block size="lg" className="mt-4" onClick={() => dismiss(pending.instanceId)}>
                Fortsett
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </Sheet>
  );
}
