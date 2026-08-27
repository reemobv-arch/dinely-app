"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseReady, demoMode } from "./firebase";

// Auth voor de Dinely-app.
// Login = telefoonnummer -> echte SMS-code via Firebase Phone Authentication.
// De uid die Firebase teruggeeft is stabiel per telefoonnummer, dus uitloggen
// en opnieuw inloggen levert hetzelfde account (en dezelfde creator) op.
// De feitelijke SMS-flow (reCAPTCHA + code invoeren) staat in app/login.
//
// Zonder Firebase-config (lokaal ontwikkelen zonder .env) valt de app terug op
// een demo-login met een vaste code, zodat de UI ook zonder SMS te testen is.

export const DEMO_CODE = "123456";

export type CreatorProfile = {
  naam: string;
  email: string; // account-e-mail, o.a. voor de goedkeuringsmail
  instagram: string;
  tiktok: string;
  volgers: number; // totaal zelf-ingevuld bereik
  igVolgers?: number;
  ttVolgers?: number;
  foto?: string;
  statsFoto?: string; // screenshot van de insights (bereik-bewijs)
  categorie?: string; // Food / Lifestyle / …
  regio: string;
  geslacht: "vrouw" | "man" | "";
};

const EMPTY_PROFILE: CreatorProfile = {
  naam: "",
  email: "",
  instagram: "",
  tiktok: "",
  volgers: 0,
  regio: "Amsterdam",
  geslacht: "",
};

type Session = { phone: string };

type AppAuthValue = {
  session: Session | null;
  uid: string | null; // Firebase-uid (stabiel per telefoonnummer)
  loading: boolean;
  profile: CreatorProfile;
  loginDemo: (phone: string) => void; // alleen als Firebase niet geconfigureerd is
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
  loginDemo: () => {},
  logout: () => {},
  saveProfile: () => {},
});

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Profiel-cache altijd inladen (los van de auth-modus).
    try {
      const p = localStorage.getItem(P_KEY);
      if (p) setProfile({ ...EMPTY_PROFILE, ...(JSON.parse(p) as CreatorProfile) });
    } catch {
      /* geen storage */
    }

    // Zonder Firebase-config: alleen in development een lokale demo-sessie.
    // In productie doen we niets (geen test-login mogelijk).
    if (!firebaseReady) {
      if (demoMode) {
        try {
          const s = localStorage.getItem(S_KEY);
          if (s) setSession(JSON.parse(s) as Session);
        } catch {
          /* negeer */
        }
      }
      setLoading(false);
      return;
    }

    // Echte modus: Firebase is de bron van waarheid. Firebase bewaart de sessie
    // zelf (ook na herladen), dus we luisteren alleen naar wijzigingen.
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUid(u.uid);
        setSession({ phone: u.phoneNumber ?? "" });
        // Profiel terughalen uit Firestore (bron van waarheid), zodat een
        // ingelogde creator ook op een ander toestel / na gewiste opslag zijn
        // profiel terugziet en niet opnieuw hoeft te onboarden.
        getDoc(doc(db, "creators", u.uid))
          .then((snap) => {
            if (!snap.exists()) return;
            const d = snap.data() as Partial<CreatorProfile>;
            if (!d.naam) return; // profiel nog niet af -> lokaal laten
            const cp: CreatorProfile = {
              naam: d.naam ?? "",
              email: d.email ?? "",
              instagram: d.instagram ?? "",
              tiktok: d.tiktok ?? "",
              volgers: d.volgers ?? 0,
              igVolgers: d.igVolgers,
              ttVolgers: d.ttVolgers,
              foto: d.foto,
              statsFoto: d.statsFoto,
              categorie: d.categorie,
              regio: d.regio ?? "Amsterdam",
              geslacht: d.geslacht ?? "",
            };
            setProfile(cp);
            try {
              localStorage.setItem(P_KEY, JSON.stringify(cp));
            } catch {
              /* negeer */
            }
          })
          .catch(() => {
            /* offline of geen rechten: lokale cache blijft staan */
          });
      } else {
        setUid(null);
        setSession(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Alleen gebruikt in demo-modus (Firebase niet geconfigureerd).
  function loginDemo(phone: string) {
    const s = { phone };
    try {
      localStorage.setItem(S_KEY, JSON.stringify(s));
    } catch {
      /* negeer */
    }
    setSession(s);
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
      value={{ session, uid, loading, profile, loginDemo, logout, saveProfile }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export const useApp = () => useContext(AppAuthContext);
