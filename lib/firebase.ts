import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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
