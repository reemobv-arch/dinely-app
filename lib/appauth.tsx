"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseReady } from "./firebase";

// Prototype-auth voor de Dinely-app.
// Login = telefoonnummer -> (mock) code 123456 -> code invoeren.
// De sessie wordt lokaal bewaard. Onder water loggen we anoniem in bij Firebase
// (indien de Anonymous-provider aanstaat) zodat sollicitaties naar Firestore
// geschreven kunnen worden. De echte SMS-login komt bij de native app.

export const DEMO_CODE = "123456";

export type CreatorProfile = {
  naam: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  volgers: number; // totaal zelf-ingevuld bereik
  regio: string;
  geslacht: "vrouw" | "man" | "";
};

const EMPTY_PROFILE: CreatorProfile = {
  naam: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  volgers: 0,
  regio: "Amsterdam",
  geslacht: "",
};

type Session = { phone: string };

type AppAuthValue = {
  session: Session | null;
  uid: string | null; // Firebase anonieme uid (null als provider uit staat)
  loading: boolean;
  profile: CreatorProfile;
  login: (phone: string) => void;
  logout: () => void;
  saveProfile: (p: CreatorProfile) => void;
};

const S_KEY = "dinely-app:session";
const P_KEY = "dinely-app:profile";

const AppAuthContext = createContext<AppAuthValue>({
  session: null,
  uid: null,
  loading: true,
  profile: EMPTY_PROFILE,
  login: () => {},
  logout: () => {},
  saveProfile: () => {},
});

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let hasSession = false;
    try {
      const s = localStorage.getItem(S_KEY);
      if (s) {
        setSession(JSON.parse(s) as Session);
        hasSession = true;
      }
      const p = localStorage.getItem(P_KEY);
      if (p) setProfile({ ...EMPTY_PROFILE, ...(JSON.parse(p) as CreatorProfile) });
    } catch {
      /* geen storage */
    }
    setLoading(false);

    if (firebaseReady) {
      const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
      // Zorg dat er een anonieme Firebase-sessie is zodra iemand lokaal is
      // ingelogd, ook als die sessie van vóór het aanzetten van Anonymous is.
      if (hasSession && !auth.currentUser) {
        signInAnonymously(auth).catch(() => {});
      }
      return () => unsub();
    }
  }, []);

  function login(phone: string) {
    const s = { phone };
    try {
      localStorage.setItem(S_KEY, JSON.stringify(s));
    } catch {
      /* negeer */
    }
    setSession(s);
    if (firebaseReady && !auth.currentUser) {
      // Anoniem inloggen zodat we later een sollicitatie mogen wegschrijven.
      signInAnonymously(auth).catch(() => {
        /* Anonymous-provider staat mogelijk nog uit; browsen werkt sowieso. */
      });
    }
  }

  function logout() {
    try {
      localStorage.removeItem(S_KEY);
    } catch {
      /* negeer */
    }
    setSession(null);
    if (firebaseReady) signOut(auth).catch(() => {});
  }

  function saveProfile(p: CreatorProfile) {
    try {
      localStorage.setItem(P_KEY, JSON.stringify(p));
    } catch {
      /* negeer */
    }
    setProfile(p);
  }

  return (
    <AppAuthContext.Provider
      value={{ session, uid, loading, profile, login, logout, saveProfile }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export const useApp = () => useContext(AppAuthContext);
