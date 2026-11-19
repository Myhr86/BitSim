# Architecture

```
src/
  app/            App shell, global CSS + design tokens
  components/     Reusable UI primitives (Sheet, Button, Avatar, Icon, …)
  features/       Screens and tabs (menu, character creation, timeline, career,
                  relationships, finances, activities, achievements, legacy, settings, shell)
  engine/         Pure simulation (no React)
    simulation/   createGame, ageUp pipeline, actions facade, checks, validation, headless runner
    events/       Condition DSL, effects, selection, resolution, templating, library validator
    economy/      Market cycle, taxes, yearly finances, bankruptcy
    careers/      Job market, hiring, promotions, firing, retirement
    education/    Enrolment, yearly progress, graduation, student loans
    relationships/Relationship drift, interactions, marriage, children
    npcs/         NPC factory and NPC life simulation (death, marriage, grandchildren)
    health/       Health/stress targets, diseases, addictions, mortality
    assets/       Property, vehicles, luxury goods, businesses
    activities/   Activity availability, limits, diminishing returns
    crime/        Detection, arrest, trial, prison
    achievements/ Achievement definitions and unlockable scenarios
    legacy/       Death, life summary, obituary, inheritance, continue-as-heir
    probability/  Seeded RNG (mulberry32)
  data/           Content & configuration (events, occupations, education, countries,
                  names, assets, activities, traits, health, balance)
  store/          Zustand store – the only bridge between UI and engine
  services/       IndexedDB, save format/migrations, meta progression, haptics/sound, files
  i18n/           UI strings
  types/          Shared types (core, game state, event DSL)
  tests/          Vitest suites; tests/sim = mass simulation
```

## State model
`GameState` (`src/types/game.ts`) is a single serialisable object: people (player + all
NPCs, linked by parent/child/spouse ids), relationships to the current player, timeline,
pending events, scheduled consequences, economy, finances, assets, education, career,
health, crime, flags and lineage. It is saved as-is (JSON) to IndexedDB.

## Engine pattern
```ts
const sim = beginSim(state);   // structuredClone + Rng from state.rngState
… mutate sim.s with helpers …
return endSim(sim);            // writes rng state back
```
This keeps the engine deterministic: the same state + same choice always gives the same
outcome, which is what makes "close the app during a decision" safe (no rerolls).

## Annual pipeline (`engine/simulation/ageUp.ts`)
1. Validate state (`validateState`) and refuse if dead
2. Refuse if any event is unresolved (`AgeUpBlocked`)
3. Advance year (ages are derived from `birthYear`, so NPCs age automatically)
4. Reset per-year counters
5. Advance the economy (boom/normal/recession, inflation, rates, markets)
6. Finances: income, benefits, assets/businesses, living costs, tax, debt service, returns
7. Prison, education, career
8. NPC lives (deaths with inheritance, marriages, grandchildren, retirement)
9. Relationship drift
10. Health, stress, aging, illnesses, trait drift
11. Mortality check
12. Events: due follow-ups/delayed consequences → priority events → weighted random events
13. Achievements/milestones (`postActionChecks`)
14. The store persists the new state (autosave)

Because every step runs exactly once inside one pure call and the result is saved
atomically, pausing/resuming can never duplicate income or consequences.

## Event engine
Events are data (`EventDef`): age range, conditions (DSL), weight + modifiers, cooldown,
max occurrences, optional NPC target binding, variables, and either choices or automatic
outcomes. Outcomes have weights with condition modifiers and stat biases, and a list of
effects (stats, money, relationships, conditions, crime, schedule follow-up event,
delayed consequence, milestones …). Text supports `{name}`, `{target}`, `{amount}` etc.
The validator checks ids, ranges, references and template keys.

## Saves
- `services/db.ts` – tiny IndexedDB wrapper (stores: `saves`, `meta`)
- `services/saveFormat.ts` – envelope, parse + migrate + validate
- `services/migrations.ts` – versioned migrations
- `services/meta.ts` – achievements, lifetime stats and settings (persist across lives)

## Decisions
- **No immer / no zod**: the engine mutates a cloned draft, and validation is done by
  explicit invariant checks; fewer dependencies and faster headless simulation.
- **Health/stress/fitness are target-tracking**: each year the stat moves toward a target
  derived from age and circumstances. This prevents runaway accumulation and keeps
  balance tunable.
- **Explicit icon registry** instead of importing all Lucide icons keeps the bundle small
  while allowing data files to reference icons by name.
- **Capacitor-ready**: static build with relative base path, `capacitor.config.json`,
  safe-area CSS, haptics behind a service. Adding native platforms is `npx cap add ios|android`.
