import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Alleen aan tijdens e2e/lokaal testen: praat met de Firebase-emulator i.p.v.
// productie. Nooit in productie zetten (env-flag standaard uit).
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "1";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// True zodra de Firebase-config is ingevuld (via .env.local).
export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// Alleen initialiseren als de config aanwezig is — anders zou Firebase
// bij het laden (ook tijdens de build/prerender) crashen op een lege API-key.
const app: FirebaseApp | null = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth = app ? getAuth(app) : (null as unknown as Auth);
export const db: Firestore = app
  ? getFirestore(app)
  : (null as unknown as Firestore);
export const storage: FirebaseStorage = app
  ? getStorage(app)
  : (null as unknown as FirebaseStorage);

// Emulator-koppeling (idempotent via een module-guard).
if (app && USE_EMULATOR && typeof window !== "undefined") {
  const w = window as unknown as { __dinelyEmu?: boolean };
  if (!w.__dinelyEmu) {
    w.__dinelyEmu = true;
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    } catch {
      /* al gekoppeld */
    }
  }
}
