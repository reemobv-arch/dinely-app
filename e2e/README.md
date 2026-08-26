# End-to-end tests (Firebase-emulator + Playwright)

E2e-tests draaien tegen de **Firebase-emulator** (nooit productie) en drijven de
echte app aan met Playwright.

> ⚠️ `firebase.json`, `.firebaserc` en `e2e/firestore.rules` in deze map zijn
> **alleen voor de emulator**. `e2e/firestore.rules` staat alles toe (test) —
> deploy hier **niets** mee naar productie. De app deployt via Vercel; de echte
> Firestore-rules staan in `tably-dashboard/firestore.rules`.

## Eenmalig installeren
- **Java** (JDK) — de Firestore-emulator heeft dit nodig (`java -version`).
- Playwright-browser: `npx playwright install chromium`

## Draaien
```bash
npm run e2e
```
Dit doet in één keer:
1. start de Firestore + Auth emulator (`firebase emulators:exec`),
2. seedt testdata (`e2e/seed.mjs`): 1 restaurant + 1 open en 1 invite-only deal,
3. start de dev-server met `NEXT_PUBLIC_USE_EMULATOR=1` en draait de Playwright-test.

Alleen seeden (emulator moet apart draaien): `npm run e2e:seed`.

## Wat wordt getest
`e2e/invite-only.spec.ts` — op de restaurantpagina (`/r/resto-e2e`):
- de **open deal** is zichtbaar met een reageer-knop;
- de **invite-only deal** is zichtbaar maar toont "Invite only" en is
  niet klikbaar (want deze bezoeker is niet uitgenodigd).

Dit dekt de kern van de invite-only-flow end-to-end. De fijnmazige beslisregels
staan als snelle unit tests in `lib/dealVisibility.test.ts`.

## Uitbreiden (ingelogde creator + uitnodiging)
Voor het "wel uitgenodigd → klikbaar"-pad log je in via een **Auth-emulator
testnummer** (vaste code) en seed je een `invites`-doc voor die creator-uid.
Zie de opmerkingen in `seed.mjs`.
