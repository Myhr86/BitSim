import { useEffect } from 'react';
import type { ThemePref } from '@/services/meta';

/** Applies the theme preference to <html data-theme> and follows the OS when set to system. */
export function useTheme(pref: ThemePref): void {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', dark ? '#121110' : '#f5f1ea');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
}
