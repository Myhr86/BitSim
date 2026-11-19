import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'fjord';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent shadow-[0_6px_16px_-8px_var(--accent)]',
  secondary: 'bg-surface-2 text-ink',
  ghost: 'bg-transparent text-ink',
  danger: 'bg-neg-soft text-neg',
  fjord: 'bg-fjord text-white dark:text-[#0b1f1a]',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
}

export function Button({ variant = 'secondary', icon, size = 'md', block, className = '', children, ...rest }: BtnProps) {
  const sz = size === 'sm' ? 'h-9 px-3 text-[13px] rounded-xl' : size === 'lg' ? 'h-14 px-5 text-base rounded-2xl' : 'h-11 px-4 text-sm rounded-2xl';
  return (
    <button
      {...rest}
      className={`inline-flex select-none items-center justify-center gap-2 font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${sz} ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 18} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={`block w-full rounded-[var(--radius-card)] bg-surface p-4 text-left shadow-[var(--shadow-card)] ${onClick ? 'active:scale-[0.99] transition' : ''} ${className}`}>
      {children}
    </Comp>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between px-1">
      <h3 className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted">{children}</h3>
      {action}
    </div>
  );
}

export function Bar({ value, color = 'var(--fjord)', className = '', height = 6 }: { value: number; color?: string; className?: string; height?: number }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-surface-2 ${className}`} style={{ height }}>
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={false} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ type: 'spring', damping: 26, stiffness: 180 }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative h-9 flex-1 rounded-xl text-[13px] font-bold transition ${value === o.value ? 'bg-surface text-ink shadow-[var(--shadow-card)]' : 'text-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'pos' | 'neg' | 'gold' | 'accent' | 'fjord' | 'violet' | 'berry'; className?: string }) {
  const tones = {
    neutral: 'bg-surface-2 text-muted',
    pos: 'bg-pos-soft text-pos',
    neg: 'bg-neg-soft text-neg',
    gold: 'bg-gold-soft text-gold',
    accent: 'bg-accent-soft text-accent',
    fjord: 'bg-fjord-soft text-fjord',
    violet: 'bg-violet-soft text-violet',
    berry: 'bg-berry-soft text-berry',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tones[tone]} ${className}`}>{children}</span>;
}

export function Row({ icon, iconTone = 'neutral', title, subtitle, right, onClick, disabled }: { icon?: ReactNode; iconTone?: string; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; onClick?: () => void; disabled?: boolean }) {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-2 text-muted',
    accent: 'bg-accent-soft text-accent',
    fjord: 'bg-fjord-soft text-fjord',
    pos: 'bg-pos-soft text-pos',
    neg: 'bg-neg-soft text-neg',
    gold: 'bg-gold-soft text-gold',
    berry: 'bg-berry-soft text-berry',
    violet: 'bg-violet-soft text-violet',
  };
  const content = (
    <>
      {icon && <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tones[iconTone] ?? tones.neutral}`}>{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold leading-tight">{title}</div>
        {subtitle && <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </>
  );
  if (onClick)
    return (
      <button onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 py-2.5 text-left transition active:opacity-70 disabled:opacity-40">
        {content}
      </button>
    );
  return <div className="flex w-full items-center gap-3 py-2.5">{content}</div>;
}

export function Empty({ icon = 'sparkles', text }: { icon?: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center text-[13px] text-muted">
      <Icon name={icon} size={22} className="text-faint" />
      {text}
    </div>
  );
}

export function Money({ value, className = '', sign }: { value: number; className?: string; sign?: boolean }) {
  const v = Math.round(value);
  const txt = `${sign && v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('nb-NO').replace(/\u00a0/g, ' ')} kr`;
  return <span className={`tabular ${className}`}>{txt}</span>;
}
