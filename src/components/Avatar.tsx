import type { Appearance, Gender } from '@/types/core';

const SKIN = ['#f6d7c3', '#efc3a4', '#d9a07a', '#b97850', '#8d5a3b', '#5e3b26'];
const HAIR = ['#2b1d16', '#5a3a22', '#8a5a2f', '#c99a52', '#e8cf8a', '#a2361e', '#1a1a1a'];
const EYES = ['#3b2a20', '#2f5f8a', '#4c7a3b', '#6b5a3a'];

interface Props {
  look: Appearance;
  gender: Gender;
  age: number;
  size?: number;
  dead?: boolean;
  className?: string;
}

/** Simple, original vector portrait that ages with the character. */
export function Avatar({ look, gender, age, size = 48, dead, className }: Props) {
  const skin = SKIN[look.skin % SKIN.length];
  const grey = age >= 70 ? '#d9d6d0' : age >= 55 ? '#9b948b' : null;
  const hair = grey ?? HAIR[look.hair % HAIR.length];
  const eyes = EYES[look.eyes % EYES.length];
  const baby = age < 3;
  const child = age < 13;
  const style = look.hairStyle % 5;
  const long = gender === 'female' ? style !== 4 : style === 3;
  const bald = gender === 'male' && age >= 50 && style === 2;
  const bg = gender === 'female' ? 'var(--berry-soft)' : 'var(--fjord-soft)';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={{ filter: dead ? 'grayscale(1) opacity(.7)' : undefined }} aria-hidden>
      <circle cx="32" cy="32" r="32" fill={bg} />
      {/* shoulders */}
      <path d={baby ? 'M14 64c2-10 10-14 18-14s16 4 18 14z' : 'M10 64c2-12 11-17 22-17s20 5 22 17z'} fill={gender === 'female' ? 'var(--berry)' : 'var(--fjord)'} opacity=".85" />
      {/* long hair behind */}
      {long && !baby && !bald && <path d="M15 30c0-12 7-19 17-19s17 7 17 19v16c-4 3-9 4-17 4s-13-1-17-4z" fill={hair} />}
      {/* neck + face */}
      <rect x="27" y="40" width="10" height="9" rx="4" fill={skin} />
      <ellipse cx="32" cy={baby ? 33 : 30} rx={baby ? 14 : child ? 12.5 : 12} ry={baby ? 14 : 14} fill={skin} />
      {/* hair on top */}
      {!baby && !bald && (
        <path
          d={
            style === 0
              ? 'M19 27c0-9 6-14 13-14s13 5 13 14c-3-4-8-6-13-6s-10 2-13 6z'
              : style === 1
                ? 'M19 28c1-10 7-15 14-15 6 0 12 4 12 12-5-1-9-4-11-7-3 5-9 8-15 10z'
                : style === 2
                  ? 'M20 25c2-8 7-11 12-11s10 3 12 11c-4-2-8-3-12-3s-8 1-12 3z'
                  : style === 3
                    ? 'M18 30c0-11 6-17 14-17s14 6 14 17c-2-6-7-10-14-10s-12 4-14 10z'
                    : 'M21 22c3-6 7-8 11-8s8 2 11 8c-3-1-7-2-11-2s-8 1-11 2z'
          }
          fill={hair}
        />
      )}
      {baby && <path d="M30 18c2-3 5-3 6 0" stroke={HAIR[look.hair % HAIR.length]} strokeWidth="2" fill="none" strokeLinecap="round" />}
      {/* eyes */}
      {dead ? (
        <>
          <path d="M25 30l4 0M35 30l4 0" stroke="#2b2b2b" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="27" cy={baby ? 33 : 30} r={baby ? 1.8 : 1.6} fill={eyes} />
          <circle cx="37" cy={baby ? 33 : 30} r={baby ? 1.8 : 1.6} fill={eyes} />
        </>
      )}
      {/* cheeks + mouth */}
      <circle cx="23.5" cy={baby ? 38 : 35} r="2.2" fill="#e88a7a" opacity=".35" />
      <circle cx="40.5" cy={baby ? 38 : 35} r="2.2" fill="#e88a7a" opacity=".35" />
      <path d={baby ? 'M29 40q3 2.5 6 0' : 'M28.5 37q3.5 3 7 0'} stroke="#7a3d2e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* glasses for older characters */}
      {age >= 60 && !dead && (
        <g stroke="#3a332c" strokeWidth="1.2" fill="none">
          <circle cx="27" cy="30" r="3.6" />
          <circle cx="37" cy="30" r="3.6" />
          <path d="M30.6 30h2.8" />
        </g>
      )}
      {/* beard for some adult men */}
      {gender === 'male' && age >= 25 && style === 1 && <path d="M22 33c1 8 5 12 10 12s9-4 10-12c-2 3-6 5-10 5s-8-2-10-5z" fill={hair} opacity=".9" />}
    </svg>
  );
}
