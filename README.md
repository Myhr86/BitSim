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
