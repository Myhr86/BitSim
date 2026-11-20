# Progress

_Last updated: 2026-11-20_

## Status
All five phases have a working implementation. The game is fully playable offline from
birth to death and across generations.

| Area | Status | Notes |
|---|---|---|
| Tooling | ✅ | Vite 8, React 19, TS 6 strict, Tailwind 4, Zustand 5, Framer Motion, Vitest 5, ESLint |
| Design system | ✅ | Tokens (light/dark), Sheet, Button, Card, Segmented, Pill, Row, Bar, Avatar, Icon |
| Character creation | ✅ | Name, gender, look, city, background (5), traits, attraction, difficulty, scenarios |
| Aging pipeline | ✅ | Central `ageUp`, blocked by unresolved events, deterministic |
| Event engine | ✅ | 386 events (incl. ~37 historical), follow-ups, delayed consequences, NPC binding, validator |
| Education | ✅ | Full Norwegian path incl. apprenticeships, PhD, loans, scholarships |
| Careers | ✅ | 83 occupations (year-gated), listings, interviews, negotiation, promotions, firing, retirement |
| Relationships | ✅ | 14 relation types, 19 interactions, marriage/divorce/children/adoption |
| NPC lives | ✅ | Aging, death + inheritance, marriages, grandchildren, retirement |
| Finances | ✅ | Taxes, living costs, rent, loans, mortgages, investments, pension, bankruptcy |
| Assets & business | ✅ | 23 asset types, renting out, renovation, 7 business types |
| Activities | ✅ | 16 categories, limits, cooldowns, diminishing returns |
| Health | ✅ | 20 conditions, addictions, treatment, mortality |
| Crime & justice | ✅ | Detection, trial choices, fines/prison, records, prison life |
| Legacy | ✅ | Summary, obituary, legacy score, family tree, continue as heir |
| Achievements | ✅ | 44 persistent achievements, 4 unlockable scenarios |
| Saves | ✅ | 3 IndexedDB slots, autosave, export/import JSON, versioning, migration, validation |
| PWA / Capacitor | ✅ | Manifest, service worker, `capacitor.config.json` |
| Historical eras | ✅ | 1900, 1920, 1950, 1970, 1990, 2000, today – year-driven mortality, medicine, economy, names, availability |
| Tests | ✅ | 80 tests + mass simulation runner (all eras) |

## Verification (this milestone)
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm test` ✅ (72 tests)
- `SIM_LIVES=300 npm run sim` ✅ (no invalid states; see GAME_BALANCE.md)
- `npm run build` ✅
- Manual play-through in headless Chromium at iPhone size (birth → 40+ years, all tabs) ✅
- Import of a simulated finished life → death screen, obituary, family tree →
  continue as heir (generation 2), in dark mode, no console errors ✅

## Fixes from the polish pass
- Base CSS moved into `@layer base` so Tailwind utilities are not overridden.
- Adults living at home contribute to living costs only from their own income
  (previously an unemployed 22-year-old at home could drift into large consumer debt).
- Event library validator caught an undeclared variable on the trial event.

## Content pack 2 (2026-11-20)
- Playable historical eras with era picker in character creation.
- 37 historical events (Spanish flu, prohibition, depression, 9 April 1940, resistance /
  flight / collaboration and the post-war reckoning, liberation, rebuilding, polio, TV,
  moon landing, oil, EU votes, yuppie era and bank crisis, internet, OL 1994, Y2K, dot-com,
  2008, smartphones, oil price fall, lockdown) and 48 new everyday events.
- Year gates for ~45 existing modern events, ~30 activities, programmes and businesses.
- Validator now requires a free, unconditional choice in every decision event (found
  and fixed a real progression blocker).

## Known limitations
- Single JS bundle (~860 kB, ~270 kB gzip); content could be code-split.
- Era social norms (labour market, marriage law) and pension history are not modelled yet.
- Only Norwegian UI text; the i18n layer is ready for more languages.
- Headless bot does not use doctors, so simulated life expectancy is a lower bound.

## Next steps
See ROADMAP.md → "Next".
