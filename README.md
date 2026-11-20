# LifePath

Et frakoblet livssimuleringsspill for mobil. Lev et helt liv i et fiktivt, moderne
Norge – fra fødsel til død – og før slekten videre gjennom generasjoner.

```bash
npm install
npm run dev        # åpne i nettleseren, gjerne i mobilvisning
npm test           # automatiske tester
npm run sim        # simuler hundrevis av liv uten UI
npm run build      # produksjonsbygg i dist/
```

Dokumentasjon: [GAME_DESIGN.md](GAME_DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) ·
[GAME_BALANCE.md](GAME_BALANCE.md) · [ROADMAP.md](ROADMAP.md) · [PROGRESS.md](PROGRESS.md)

Native apper: `npx cap add android` / `npx cap add ios` etter `npm run build`
(installer `@capacitor/cli` og `@capacitor/core` først).

## Spill på mobilen (GitHub Pages)
1. Slå sammen koden til `main`.
2. GitHub → *Settings → Pages → Build and deployment → Source: GitHub Actions*.
3. Workflowen `.github/workflows/deploy-pages.yml` bygger og publiserer ved hver push til `main`
   (eller kjør den manuelt under *Actions*).
4. Åpne `https://<brukernavn>.github.io/<repo>/` på mobilen og velg «Legg til på Hjem-skjerm».

Lagringer ligger kun lokalt i nettleseren på enheten (IndexedDB) og sendes aldri noe sted.
