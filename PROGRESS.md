# Progress

_Last updated: 2026-11-19_

## Status
All five phases have a working implementation. The game is fully playable offline from
birth to death and across generations.

| Area | Status | Notes |
|---|---|---|
| Tooling | ✅ | Vite 8, React 19, TS 6 strict, Tailwind 4, Zustand 5, Framer Motion, Vitest 5, ESLint |
| Design system | ✅ | Tokens (light/dark), Sheet, Button, Card, Segmented, Pill, Row, Bar, Avatar, Icon |
| Character creation | ✅ | Name, gender, look, city, background (5), traits, attraction, difficulty, scenarios |
| Aging pipeline | ✅ | Central `ageUp`, blocked by unresolved events, deterministic |
| Event engine | ✅ | 301 events, follow-ups, delayed consequences, NPC binding, validator |
| Education | ✅ | Full Norwegian path incl. apprenticeships, PhD, loans, scholarships |
| Careers | ✅ | 78 occupations, listings, interviews, negotiation, promotions, firing, retirement |
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
| Tests | ✅ | 72 tests + mass simulation runner |

## Verification (this milestone)
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm test` ✅ (72 tests)
- `SIM_LIVES=300 npm run sim` ✅ (no invalid states; see GAME_BALANCE.md)
- `npm run build` ✅
- Manual play-through in headless Chromium at iPhone size (birth → 40+ years, all tabs) ✅

## Known limitations
- Single JS bundle (~860 kB, ~270 kB gzip); content could be code-split.
- Only the present-day era is playable (historical eras are planned, not exposed).
- Only Norwegian UI text; the i18n layer is ready for more languages.
- Headless bot does not use doctors, so simulated life expectancy is a lower bound.

## Next steps
See ROADMAP.md → "Next".
