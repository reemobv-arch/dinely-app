"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";
import { useApp, DEMO_CODE } from "@/lib/appauth";
import styles from "./login.module.css";

// Zet een ingevoerd (Nederlands) nummer om naar E.164 (+316xxxxxxxx).
// Geeft null terug als het geen geldig NL mobiel nummer is.
function toE164NL(raw: string): string | null {
  let s = raw.replace(/[\s\-().]/g, "");
  if (s.startsWith("+")) {
    // al internationaal
  } else if (s.startsWith("0031")) {
    s = "+" + s.slice(2);
  } else if (s.startsWith("31") && s.length >= 11) {
    s = "+" + s;
  } else if (s.startsWith("0")) {
    s = "+31" + s.slice(1);
  } else {
    s = "+31" + s;
  }
  s = "+" + s.slice(1).replace(/\D/g, "");
  return /^\+316\d{8}$/.test(s) ? s : null;
}

// Firebase-foutcodes vertalen naar begrijpelijke meldingen.
function meldingVoor(code: string): string {
  switch (code) {
    case "auth/invalid-phone-number":
      return "Dit lijkt geen geldig Nederlands mobiel nummer.";
    case "auth/too-many-requests":
      return "Te veel pogingen. Probeer het over een paar minuten opnieuw.";
    case "auth/invalid-verification-code":
      return "Onjuiste code. Controleer de code uit de sms.";
    case "auth/code-expired":
      return "De code is verlopen. Vraag een nieuwe aan.";
    case "auth/quota-exceeded":
      return "De daglimiet voor sms is bereikt. Probeer het later opnieuw.";
    case "auth/captcha-check-failed":
      return "Verificatie mislukt. Ververs de pagina en probeer opnieuw.";
    default:
      return "Er ging iets mis. Probeer het opnieuw.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, loginDemo } = useApp();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!loading && session) router.replace("/start");
  }, [session, loading, router]);

  // reCAPTCHA opruimen als de pagina verdwijnt.
  useEffect(() => {
    return () => {
      try {
        verifierRef.current?.clear();
      } catch {
        /* negeer */
      }
    };
  }, []);

  function getVerifier(): RecaptchaVerifier {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }

  function resetVerifier() {
    try {
      verifierRef.current?.clear();
    } catch {
      /* negeer */
    }
    verifierRef.current = null;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const num = toE164NL(phone);
    if (!num) {
      setError("Vul een geldig Nederlands mobiel nummer in (06 …).");
      return;
    }
    setError(null);

    // Demo-modus: geen Firebase -> meteen door naar de codestap.
    if (!firebaseReady) {
      setE164(num);
      setStep("code");
      return;
    }

    setBusy(true);
    try {
      confirmRef.current = await signInWithPhoneNumber(auth, num, getVerifier());
      setE164(num);
      setStep("code");
    } catch (err) {
      const c = (err as { code?: string })?.code ?? "";
      setError(meldingVoor(c));
      resetVerifier(); // verse reCAPTCHA voor de volgende poging
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    // Demo-modus: vaste code.
    if (!firebaseReady) {
      if (code.trim() !== DEMO_CODE) {
        setError(`Onjuiste code. (Demo: vul ${DEMO_CODE} in.)`);
        return;
      }
      loginDemo(e164 || phone);
      router.replace("/start");
      return;
    }

    if (!confirmRef.current) {
      setError("Vraag eerst een nieuwe code aan.");
      setStep("phone");
      return;
    }
    setBusy(true);
    try {
      await confirmRef.current.confirm(code.trim());
      // onAuthStateChanged zet de sessie; de redirect gebeurt automatisch.
      router.replace("/start");
    } catch (err) {
      const c = (err as { code?: string })?.code ?? "";
      setError(meldingVoor(c));
    } finally {
      setBusy(false);
    }
  }

  function opnieuw() {
    setStep("phone");
    setCode("");
    setError(null);
    confirmRef.current = null;
    resetVerifier();
  }

  return (
    <div className={`screen ${styles.wrap}`}>
      <div className={styles.top}>
        <div className={styles.brand}>Dine<span>ly</span></div>
        <div className={styles.tag}>Verdien met deals bij restaurants</div>
      </div>

      {step === "phone" ? (
        <form className={styles.form} onSubmit={sendCode}>
          <h1 className={styles.h1}>Inloggen</h1>
          <p className={styles.lead}>Vul je telefoonnummer in, dan sturen we je een sms met een code.</p>
          <label className="flabel">Telefoonnummer</label>
          <input
            className="inp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
          {error && <div className={styles.err}>{error}</div>}
          <button className="btn btn-gold" style={{ width: "100%", marginTop: 18 }} disabled={busy}>
            {busy ? "Versturen…" : "Stuur code →"}
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={verify}>
          <h1 className={styles.h1}>Vul de code in</h1>
          <p className={styles.lead}>
            We stuurden een sms naar <b>{e164 || phone}</b>.
          </p>
          <label className="flabel">6-cijferige code</label>
          <input
            className={`inp ${styles.code}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="______"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          {!firebaseReady && (
            <div className={styles.hint}>Demo: de code is <b>{DEMO_CODE}</b></div>
          )}
          {error && <div className={styles.err}>{error}</div>}
          <button className="btn btn-gold" style={{ width: "100%", marginTop: 18 }} disabled={busy}>
            {busy ? "Controleren…" : "Inloggen →"}
          </button>
          <button type="button" className={styles.link} onClick={opnieuw} disabled={busy}>
            Ander nummer gebruiken
          </button>
        </form>
      )}

      {/* Onzichtbare reCAPTCHA voor de sms-verificatie. */}
      <div id="recaptcha-container" />
    </div>
  );
}
