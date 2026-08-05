"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, firebaseReady } from "./firebase";
import { isAdminEmail } from "./admins";

export type SimpleUser = { uid: string; email: string | null };

export type LinkResult = "sent" | "signed-in";

type AuthContextValue = {
  user: SimpleUser | null;
  loading: boolean;
  isAdmin: boolean; // super-admin (zie lib/admins.ts) — mag alle restaurants inzien/aanpassen
  demo: boolean; // true zolang Firebase niet is gekoppeld (lokale demo-modus)
  /** Stuurt een inlog-link naar het mailadres. In demo logt het direct in. */
  sendLoginLink: (email: string) => Promise<LinkResult>;
  /** Rondt het inloggen af als de huidige URL een geldige inlog-link is. */
  completeLinkSignIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const DEMO_KEY = "tably-demo:user";
const EMAIL_KEY = "tably:emailForSignIn";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  demo: !firebaseReady,
  sendLoginLink: async () => "sent",
  completeLinkSignIn: async () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseReady) {
      const unsub = onAuthStateChanged(auth, (u: User | null) => {
        setUser(u ? { uid: u.uid, email: u.email } : null);
        setLoading(false);
      });
      return () => unsub();
    }
    // demo-modus: onthoud de gebruiker lokaal
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) setUser(JSON.parse(raw) as SimpleUser);
    } catch {
      /* geen storage */
    }
    setLoading(false);
  }, []);

  function demoSet(u: SimpleUser) {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    } catch {
      /* negeer */
    }
    setUser(u);
  }

  async function sendLoginLink(email: string): Promise<LinkResult> {
    if (firebaseReady) {
      const actionCodeSettings = {
        // De gebruiker landt na het klikken weer op de login-pagina,
        // die het inloggen dan afrondt. Werkt op elk toegestaan domein.
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      try {
        window.localStorage.setItem(EMAIL_KEY, email);
      } catch {
        /* negeer */
      }
      return "sent";
    }
    // demo: geen echte mail, meteen inloggen
    demoSet({ uid: "demo", email });
    return "signed-in";
  }

  async function completeLinkSignIn(): Promise<boolean> {
    if (!firebaseReady) return false;
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;
    let email = "";
    try {
      email = window.localStorage.getItem(EMAIL_KEY) ?? "";
    } catch {
      /* negeer */
    }
    if (!email) {
      // Link op een ander apparaat geopend: vraag het mailadres opnieuw.
      email = window.prompt("Bevestig je e-mailadres om in te loggen") ?? "";
    }
    if (!email) return false;
    await signInWithEmailLink(auth, email, window.location.href);
    try {
      window.localStorage.removeItem(EMAIL_KEY);
    } catch {
      /* negeer */
    }
    // Haal de inlog-parameters uit de URL zodat een refresh niet opnieuw triggert.
    window.history.replaceState({}, "", "/login");
    return true;
  }

  async function signOut() {
    if (firebaseReady) {
      await fbSignOut(auth);
      return;
    }
    try {
      localStorage.removeItem(DEMO_KEY);
    } catch {
      /* negeer */
    }
    setUser(null);
  }

  const isAdmin = user ? !firebaseReady || isAdminEmail(user.email) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        demo: !firebaseReady,
        sendLoginLink,
        completeLinkSignIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
