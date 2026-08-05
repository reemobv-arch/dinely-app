# Tably — Restaurant dashboard (echte app)

Fase 1 van het echte restaurant-dashboard: **Next.js + Firebase**.
Werkende **login** (Firebase Auth) en een beveiligd dashboard waar een restauranthouder
zijn **restaurant beheert** (gegevens + sfeermedia + menu/drankkaart) — echt opgeslagen in
Firestore (data) en Cloud Storage (media).

Dit is een **aparte app** naast de prototype-/pitch-site (`tably-nu.vercel.app`), met een eigen repo en Vercel-project.

## Wat werkt nu (fase 1 + 2)

- Inloggen / registreren met e-mail + wachtwoord; beveiligde routes.
- **Restaurant** beheren: gegevens + 3 sfeerfoto's + video + menu/drankkaart (Firestore + Storage).
- **Deals** aanmaken/sluiten/verwijderen: beloningstype, bedrag (met 15%-commissie-weergave),
  bereik-eis (min. volgers, platform, regio), gewenste creator (v/m/maakt niet uit), plekken, looptijd.
- **Sollicitaties**: accepteren/afwijzen; "voldoet/onder de eis"-indicatie. Met een knop
  **Testdata laden** vul je voorbeeld-creators/sollicitaties (die komen later uit de mobiele app).
- **Reviews**: scoresamenvatting (food/vibe/service) + lijst; testdata-knop.

**Bewust nog NIET in scope** (later):
- Geen echte **Meta/social-media-profielcheck** wanneer een creator zich aanmeldt — de
  bereik-eis is nu een simpele vergelijking met een ingevuld volgersaantal.
- Geen **betalingen** (Stripe/Mollie) — de 15%-regel is puur een rekenweergave.
- Abonnement-scherm komt later (Stripe Billing).

---

## 1. Lokaal draaien

```bash
npm install
npm run dev
```
→ open http://localhost:3000

Zonder Firebase-config toont de app het inlogscherm met de melding "nog niet gekoppeld".
Vul eerst stap 2 in om echt te kunnen inloggen/opslaan.

## 2. Firebase-project koppelen (~5 min)

1. Ga naar https://console.firebase.google.com → **Add project** → geef 'm een naam (bv. `tably`).
2. **Build → Authentication → Get started → Sign-in method →** zet **Email/Password** aan.
3. **Build → Firestore Database → Create database** (rules zie stap 3).
4. **Build → Storage → Get started**.
5. **Project settings (tandwiel) → General → "Your apps" → Web-app toevoegen (</>)** → kopieer de
   `firebaseConfig`-waarden.
6. Plak ze in **`.env.local`** (bestaat al in dit project):

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
7. Herstart de dev-server (`Ctrl+C` en `npm run dev`).

Nu kun je registreren, inloggen, en je restaurant opslaan met media.

## 3. Beveiligingsregels instellen

Plak de inhoud van **`firestore.rules`** in Firestore → *Rules* → *Publish*,
en **`storage.rules`** in Storage → *Rules* → *Publish*.
(Kort: iedereen mag lezen; alleen de ingelogde eigenaar mag zijn eigen restaurant/media schrijven.)

## 4. Deployen naar Vercel

Als **eigen Vercel-project** (los van de pitch-site):
1. Push deze map naar een **eigen GitHub-repo** (bv. `Tably-dashboard`).
2. vercel.com → **Add New → Project** → importeer die repo.
3. Zet dezelfde **environment variables** (`NEXT_PUBLIC_FIREBASE_*`) in Vercel → Settings → Environment Variables.
4. Deploy. Voeg in Firebase → Authentication → Settings → **Authorized domains** je Vercel-domein toe.

---

## Structuur

```
app/
  layout.tsx              root layout + AuthProvider
  page.tsx                redirect: ingelogd → dashboard, anders → login
  login/                  inlog-/registratiescherm
  dashboard/
    layout.tsx            beveiligde shell + sidebar
    page.tsx              redirect naar /dashboard/restaurant
    restaurant/           restaurant beheren + media upload
lib/
  firebase.ts             Firebase-init (uit env)
  auth.tsx                AuthProvider + useAuth()
firestore.rules           Firestore-beveiliging
storage.rules             Storage-beveiliging
```
