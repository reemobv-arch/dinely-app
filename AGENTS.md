<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Teststandaard (verplicht)

Alle code die we bouwen wordt getest voordat een taak "af" is.

1. **Pure logica hoort in `lib/` met een test ernaast.** Berekeningen,
   transformaties, filters, validatie of beslisregels (punten, niveaus,
   telefoon-normalisatie, deal-zichtbaarheid, kwalificatie) haal je uit de
   component naar een pure functie in `lib/` met een `*.test.ts` (Vitest),
   inclusief grens- en foutgevallen. Voorbeelden: `lib/tier.test.ts`,
   `lib/phone.test.ts`, `lib/dealVisibility.test.ts`.
2. **Draaien:** `npm run build` voert `vitest run && next build` uit — een taak
   is pas klaar als beide groen zijn. Snel tijdens het werk: `npm test`.
3. Deze app heeft geen eigen API-routes; die staan in `tably-dashboard`
   (daar worden ze met gemockte dependencies getest).
4. **End-to-end** kritieke flows draaien via de Firebase-emulator + Playwright
   (zie `tably-dashboard/e2e/`). Gebruik testnummers met vaste code; nooit
   tegen productie-Firebase testen.

Kort: geen nieuwe logica zonder test, geen "af" zonder groene `npm run build`.
<!-- END:nextjs-agent-rules -->
