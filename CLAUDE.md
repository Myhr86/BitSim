# CLAUDE.md – working agreement for LifePath

LifePath is an offline, mobile-only life-simulation game (React + TypeScript + Vite).
Read `ARCHITECTURE.md` before changing code and `PROGRESS.md` for current status.

## Commands
- `npm run dev` – dev server (open at phone width; desktop shows a centred phone frame)
- `npm run typecheck` – strict TypeScript (no `any`)
- `npm run lint` – ESLint (typescript-eslint, react-hooks)
- `npm test` – Vitest unit/integration suite (fast, ~10 s)
- `npm run sim` – headless mass simulation (`SIM_LIVES=2000 npm run sim` for more)
- `npm run build` – production build (also type-checks)

Run typecheck, lint, test and build before every commit.

## Rules
- **Simulation logic never lives in React components.** The engine (`src/engine`) is pure
  TypeScript and must not import from `src/features`, `src/components` or `src/store`.
- Engine operations take an immutable `GameState` and return a new one via
  `beginSim()/endSim()` (structured clone + seeded RNG). Never use `Math.random()` in the
  engine – use the `Rng` from the `Sim`.
- All tunable numbers go in `src/data/balance.ts`.
- Game content (events, occupations, programmes, assets, activities) is data in `src/data`.
  Add events with the builders in `src/data/events/helpers.ts`; the validator
  (`src/engine/events/validateEvents.ts`) runs in the test suite and must stay green.
- UI strings live in `src/i18n/nb.ts` (Norwegian Bokmål). Event narrative text lives in the
  event data files (one file per life stage).
- Monetary amounts in data are at start-of-save prices; the engine multiplies by
  `economy.priceIndex` (or `housingIndex` for property).
- Changing the `GameState` shape requires bumping `SAVE_VERSION` and adding a migration in
  `src/services/migrations.ts` plus a test.
- Don't expose unfinished features in the UI. Historical eras exist in data as
  `plannedEras` but are not selectable.
- Mobile first: 320–480 px wide, large touch targets, no hover-only interactions.
