"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth, firebaseReady, demoMode } from "@/lib/firebase";
import { useApp, DEMO_CODE } from "@/lib/appauth";
import { toE164NL } from "@/lib/phone";
import { useT } from "@/lib/i18n";
import Waiting from "../Waiting";
import styles from "./login.module.css";

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
  const t = useT();
  const { session, loading, loginDemo } = useApp();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconden tot "opnieuw sturen" weer mag

  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmRef = useRef<ConfirmationResult | null>(null);

  // Aftellen voor de "geen code ontvangen?"-knop.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

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

    if (!firebaseReady) {
      // Alleen in development: demo -> meteen naar de codestap.
      if (demoMode) {
        setE164(num);
        setStep("code");
      } else {
        setError("Inloggen is tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      return;
    }

    setBusy(true);
    try {
      confirmRef.current = await signInWithPhoneNumber(auth, num, getVerifier());
      setE164(num);
      setStep("code");
      setCooldown(45);
    } catch (err) {
      const c = (err as { code?: string })?.code ?? "";
      setError(meldingVoor(c));
      resetVerifier(); // verse reCAPTCHA voor de volgende poging
    } finally {
      setBusy(false);
    }
  }

  // Opnieuw een sms sturen naar hetzelfde nummer (met verse reCAPTCHA).
  async function resend() {
    if (busy || cooldown > 0) return;
    const num = e164 || toE164NL(phone);
    if (!num || !firebaseReady) return;
    setError(null);
    setBusy(true);
    try {
      resetVerifier();
      confirmRef.current = await signInWithPhoneNumber(auth, num, getVerifier());
      setCode("");
      setCooldown(45);
    } catch (err) {
      const c = (err as { code?: string })?.code ?? "";
      setError(meldingVoor(c));
      resetVerifier();
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    // Alleen in development: demo met vaste code.
    if (!firebaseReady) {
      if (!demoMode) {
        setError("Inloggen is tijdelijk niet beschikbaar. Probeer het later opnieuw.");
        return;
      }
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
        <div className={styles.tag}>{t("Verdien met deals bij restaurants")}</div>
      </div>

      {step === "phone" ? (
        <form className={styles.form} onSubmit={sendCode}>
          <h1 className={styles.h1}>{t("Inloggen")}</h1>
          <p className={styles.lead}>{t("Vul je telefoonnummer in, dan sturen we je een sms met een code.")}</p>
          <label className="flabel">{t("Telefoonnummer")}</label>
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
          {error && <div className={styles.err}>{t(error)}</div>}
          <button className="btn btn-gold" style={{ width: "100%", marginTop: 18 }} disabled={busy}>
            {busy ? <Waiting label={t("Versturen")} /> : t("Stuur code →")}
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={verify}>
          <h1 className={styles.h1}>{t("Vul de code in")}</h1>
          <p className={styles.lead}>
            {t("We stuurden een sms naar")} <b>{e164 || phone}</b>.
          </p>
          <label className="flabel">{t("6-cijferige code")}</label>
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
          {demoMode && (
            <div className={styles.hint}>{t("Demo: de code is")} <b>{DEMO_CODE}</b></div>
          )}
          {error && <div className={styles.err}>{t(error)}</div>}
          <button className="btn btn-gold" style={{ width: "100%", marginTop: 18 }} disabled={busy}>
            {busy ? <Waiting label={t("Controleren")} /> : t("Inloggen →")}
          </button>
          {firebaseReady && (
            <button
              type="button"
              className={styles.link}
              onClick={resend}
              disabled={busy || cooldown > 0}
            >
              {cooldown > 0
                ? `${t("Geen code? Opnieuw sturen kan over")} ${cooldown}s`
                : t("Geen code ontvangen? Opnieuw sturen")}
            </button>
          )}
          <button type="button" className={styles.link} onClick={opnieuw} disabled={busy}>
            {t("Ander nummer gebruiken")}
          </button>
        </form>
      )}

      {/* Onzichtbare reCAPTCHA voor de sms-verificatie. */}
      <div id="recaptcha-container" />
    </div>
  );
}
