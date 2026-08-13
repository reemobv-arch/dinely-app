# Dinely — Creator-app

![Tests](https://github.com/reemobv-arch/dinely-app/actions/workflows/test.yml/badge.svg)

De mobiel-web app voor creators. Restaurants ontdekken (kaart + filters), deals bekijken
en op solliciteren, na je bezoek content plaatsen, en je profiel en uitbetaling beheren.
Gebouwd met **Next.js + Firebase** (Firestore, Auth, Storage, Cloud Messaging).

## Ontwikkelen

```bash
npm install
npm run dev     # dev-server op localhost
npm test        # unit tests (Vitest)
npm run build   # draait eerst de tests, dan de productie-build
```

De tests draaien ook automatisch bij elke push (GitHub Actions) en tijdens de Vercel-build,
zodat een falende test de deploy tegenhoudt.

## Tests

Pure bedrijfsregels zijn gedekt in `lib/*.test.ts`: de 85/15-uitbetaalsplit, volgers per
kanaal, de Ontdek-filters en de bereik-eis-check bij solliciteren.
