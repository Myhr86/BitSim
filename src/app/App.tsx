import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { useTheme } from '@/hooks/useTheme';
import { MenuScreen } from '@/features/menu/MenuScreen';
import { CreateScreen } from '@/features/character/CreateScreen';
import { GameScreen } from '@/features/shell/GameScreen';
import { Toasts } from '@/features/shell/Toasts';
import { Celebration } from '@/features/shell/Celebration';

export function App() {
  const screen = useGame((s) => s.screen);
  const init = useGame((s) => s.init);
  const settings = useGame((s) => s.meta.settings);
  useTheme(settings.theme);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
      <div className="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-bg min-[520px]:my-0 min-[520px]:shadow-[0_0_60px_-20px_rgb(0_0_0/0.4)]">
        {screen === 'loading' && <Splash />}
        {screen === 'menu' && <MenuScreen />}
        {screen === 'create' && <CreateScreen />}
        {screen === 'game' && <GameScreen />}
      </div>
      <Toasts />
      <Celebration />
    </MotionConfig>
  );
}

function Splash() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
    </div>
  );
}
