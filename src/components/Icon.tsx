import { Sparkles } from 'lucide-react';
import { ICONS } from './iconRegistry';

interface Props {
  name?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, className, strokeWidth = 2 }: Props) {
  const C = (name && ICONS[name]) || Sparkles;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}
