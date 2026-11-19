# Roadmap

## Phase 1 – Foundation ✅
Project setup · mobile design system · core types · simulation engine · seeded RNG ·
character creation · main game screen · aging · timeline · persistent saves.

## Phase 2 – Core gameplay ✅
Event engine (data-driven DSL, 301 events) · stats · distinct life stages · education ·
careers (78 occupations) · relationships & interactions · NPC generation and NPC lives.

## Phase 3 – Advanced gameplay ✅
Economy cycle & taxes · property & vehicles · investments · activities (~80) · health,
diseases, addictions & mortality · crime & justice · businesses.

## Phase 4 – Longevity ✅
Family tree · generations · inheritance · achievements (44) & unlockable scenarios ·
life summaries & obituaries.

## Phase 5 – Polish (mostly done)
✅ Animations & celebrations · haptics & sound settings · light/dark themes · reduced
motion · PWA (manifest + offline service worker) · Capacitor config · balancing with
mass simulation · accessibility basics (aria labels, contrast tokens).
⏳ Remaining: see "Next" below.

## Next
- English translation (`src/i18n/en.ts` + event text packs keyed by event id)
- Historical eras (1900/1950/1990) using `plannedEras` + era profiles for prices,
  occupations, technology and life expectancy
- More event content (target: 1000+), especially events reacting to specific
  occupations, assets and long chains (multi-step storylines)
- Deeper business management (hire/fire, expand, sell company)
- Native builds via Capacitor with `@capacitor/haptics` and `@capacitor/preferences`
- More countries via `src/data/countries`
- Statistics screen (lifetime charts), in-game encyclopedia/help
- Code-splitting the content data for faster first load on low-end phones
