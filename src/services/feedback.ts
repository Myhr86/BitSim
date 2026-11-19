/**
 * Haptic and audio feedback. Uses the Vibration API on the web; a Capacitor build can
 * swap this module for @capacitor/haptics without touching UI code.
 */
let hapticsEnabled = true;
let soundEnabled = true;
let audioCtx: AudioContext | null = null;

export function configureFeedback(opts: { haptics: boolean; sound: boolean }): void {
  hapticsEnabled = opts.haptics;
  soundEnabled = opts.sound;
}

export function haptic(kind: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
  if (!hapticsEnabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const patterns: Record<string, number | number[]> = { light: 8, medium: 18, success: [10, 40, 18], warning: [30, 50, 30] };
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    // Unsupported – ignore.
  }
}

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx ??= new Ctor();
  return audioCtx;
}

/** Short synthesised tones – no audio assets needed. */
export function playSound(kind: 'tick' | 'year' | 'milestone' | 'bad'): void {
  if (!soundEnabled) return;
  const c = ctx();
  if (!c) return;
  const notes: Record<string, [number, number][]> = {
    tick: [[880, 0.04]],
    year: [[523, 0.07], [784, 0.09]],
    milestone: [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.18]],
    bad: [[330, 0.12], [262, 0.18]],
  };
  let t = c.currentTime;
  for (const [freq, dur] of notes[kind]) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur * 0.9;
  }
}
