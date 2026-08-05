"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, DEMO_CODE } from "@/lib/appauth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, login } = useApp();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) router.replace("/start");
  }, [session, loading, router]);

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Vul een geldig telefoonnummer in.");
      return;
    }
    setError(null);
    setStep("code");
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim() !== DEMO_CODE) {
      setError(`Onjuiste code. (Prototype: vul ${DEMO_CODE} in.)`);
      return;
    }
    login(phone);
    router.replace("/start");
  }

  return (
    <div className={`screen ${styles.wrap}`}>
      <div className={styles.top}>
        <div className={styles.brand}>Dinel<span>y</span></div>
        <div className={styles.tag}>Zie de vibe voordat je aankomt</div>
      </div>

      {step === "phone" ? (
        <form className={styles.form} onSubmit={sendCode}>
          <h1 className={styles.h1}>Inloggen</h1>
          <p className={styles.lead}>Vul je telefoonnummer in, dan sturen we je een code.</p>
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
          <button className="btn btn-gold" style={{ width: "100%", marginTop: 18 }}>
            Stuur code →
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={verify}>
          <h1 className={styles.h1}>Vul de code in</h1>
          <p className={styles.lead}>
            We stuurden een code naar <b>{phone}</b>.
          </p>
          <label className="flabel">6-cijferige code</label>
          <input
            className={`inp ${styles.code}`}
            inputMode="numeric"
            maxLength={6}
            placeholder="______"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          <div className={styles.hint}>Prototype: de code is <b>{DEMO_CODE}</b></div>
          {error && <div className={styles.err}>{error}</div>}
          <button className="btn btn-gold" style={{ width: "100%", marginTop: 18 }}>
            Inloggen →
          </button>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
          >
            Ander nummer gebruiken
          </button>
        </form>
      )}
    </div>
  );
}
