import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Headless mass-simulation runner: `npm run sim` (set SIM_LIVES to change the count).
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/tests/sim/**/*.test.ts'],
    testTimeout: 600_000,
  },
});
