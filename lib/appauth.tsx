"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Prototype-auth voor de Dinely-app.
// Login = telefoonnummer invullen -> (mock) code ontvangen -> code invoeren.
// De sessie wordt lokaal bewaard. Echte SMS/anonieme Firebase-auth komt later
// (nodig zodra sollicitaties echt naar Firestore geschreven worden).

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
  loading: boolean;
  profile: CreatorProfile;
  login: (phone: string) => void; // na geldige code
  logout: () => void;
  saveProfile: (p: CreatorProfile) => void;
};

const S_KEY = "dinely-app:session";
const P_KEY = "dinely-app:profile";

const AppAuthContext = createContext<AppAuthValue>({
  session: null,
  loading: true,
  profile: EMPTY_PROFILE,
  login: () => {},
  logout: () => {},
  saveProfile: () => {},
});

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem(S_KEY);
      if (s) setSession(JSON.parse(s) as Session);
      const p = localStorage.getItem(P_KEY);
      if (p) setProfile({ ...EMPTY_PROFILE, ...(JSON.parse(p) as CreatorProfile) });
    } catch {
      /* geen storage */
    }
    setLoading(false);
  }, []);

  function login(phone: string) {
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
    <AppAuthContext.Provider value={{ session, loading, profile, login, logout, saveProfile }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export const useApp = () => useContext(AppAuthContext);
