"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import styles from "./creator.module.css";

export default function CreatorPage() {
  const router = useRouter();
  const { session, loading, profile, saveProfile } = useApp();

  const [step, setStep] = useState(0);
  const [naam, setNaam] = useState("");
  const [regio, setRegio] = useState("Amsterdam");
  const [geslacht, setGeslacht] = useState<"vrouw" | "man" | "">("");
  const [ig, setIg] = useState({ handle: "", vol: 0 });
  const [tt, setTt] = useState({ handle: "", vol: 0 });
  const [fb, setFb] = useState({ handle: "", vol: 0 });
  const [dealParam, setDealParam] = useState("");

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    // bestaand profiel voorvullen + eventuele ?deal= bewaren
    if (profile.naam) setNaam(profile.naam);
    if (profile.regio) setRegio(profile.regio);
    if (profile.geslacht) setGeslacht(profile.geslacht);
    if (profile.instagram) setIg((s) => ({ ...s, handle: profile.instagram }));
    if (profile.tiktok) setTt((s) => ({ ...s, handle: profile.tiktok }));
    try {
      const p = new URLSearchParams(window.location.search).get("deal");
      if (p) setDealParam(`?deal=${p}`);
    } catch {
      /* negeer */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totaal = (ig.vol || 0) + (tt.vol || 0) + (fb.vol || 0);

  function finish() {
    const platforms = [
      ig.handle ? "Instagram" : "",
      tt.handle ? "TikTok" : "",
      fb.handle ? "Facebook" : "",
    ].filter(Boolean);
    saveProfile({
      naam,
      instagram: ig.handle,
      tiktok: tt.handle,
      facebook: fb.handle,
      volgers: totaal,
      regio,
      geslacht,
    });
    // platform-string bewaren we via localStorage voor de sollicitatie
    try {
      localStorage.setItem("dinely-app:platforms", platforms.join(" · "));
    } catch {
      /* negeer */
    }
    router.push(`/deals${dealParam}`);
  }

  const steps = ["Jij", "Instagram", "TikTok", "Klaar"];

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/start" className={styles.back}>‹</Link>
        <div className={styles.dots}>
          {steps.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i <= step ? styles.on : ""}`} />
          ))}
        </div>
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.body}>
        {step === 0 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Stap 1 van 4</span>
            <h1 className={styles.h1}>Wie ben je?</h1>
            <p className={styles.lead}>We koppelen zo je socials om je bereik te bepalen.</p>
            <label className="flabel">Naam of artiestennaam</label>
            <input className="inp" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Juul Bakker" />
            <label className="flabel" style={{ marginTop: 16 }}>Regio</label>
            <input className="inp" value={regio} onChange={(e) => setRegio(e.target.value)} />
            <label className="flabel" style={{ marginTop: 16 }}>Ik ben</label>
            <div className={styles.seg}>
              {(["vrouw", "man"] as const).map((g) => (
                <button key={g} type="button"
                  className={`${styles.segBtn} ${geslacht === g ? styles.segOn : ""}`}
                  onClick={() => setGeslacht(g)}>
                  {g === "vrouw" ? "Vrouw" : "Man"}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <PlatformStep
            label="Instagram" nr="Stap 2 van 4" color="#E1306C"
            handle={ig.handle} vol={ig.vol}
            onHandle={(v) => setIg((s) => ({ ...s, handle: v }))}
            onVol={(v) => setIg((s) => ({ ...s, vol: v }))}
          />
        )}
        {step === 2 && (
          <PlatformStep
            label="TikTok" nr="Stap 3 van 4" color="#25F4EE"
            handle={tt.handle} vol={tt.vol}
            onHandle={(v) => setTt((s) => ({ ...s, handle: v }))}
            onVol={(v) => setTt((s) => ({ ...s, vol: v }))}
            extra={
              <div className={styles.fb}>
                <label className="flabel">Facebook (optioneel)</label>
                <input className="inp" value={fb.handle} placeholder="facebook.com/jouwpagina"
                  onChange={(e) => setFb((s) => ({ ...s, handle: e.target.value }))} />
              </div>
            }
          />
        )}

        {step === 3 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Klaar</span>
            <h1 className={styles.h1}>Je profiel staat</h1>
            <p className={styles.lead}>We tellen je bereik op. Later verifiëren we dit via de socials zelf.</p>
            <div className={styles.summary}>
              <div className={styles.sumTotal}>
                <b>{totaal.toLocaleString("nl-NL")}</b>
                <span>totaal bereik</span>
              </div>
              <div className={styles.sumRows}>
                {ig.handle && <div><span>Instagram</span><b>{ig.vol.toLocaleString("nl-NL")}</b></div>}
                {tt.handle && <div><span>TikTok</span><b>{tt.vol.toLocaleString("nl-NL")}</b></div>}
                {fb.handle && <div><span>Facebook</span><b>{fb.vol.toLocaleString("nl-NL")}</b></div>}
              </div>
            </div>
            <div className={styles.note}>
              Prototype: bereik is zelf ingevuld. Straks koppelen we de echte
              Instagram- en TikTok-API voor een geverifieerd-badge.
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Terug</button>
        )}
        {step < 3 ? (
          <button
            className="btn btn-gold"
            style={{ flex: 1 }}
            disabled={step === 0 && !naam}
            onClick={() => setStep((s) => s + 1)}
          >
            Volgende →
          </button>
        ) : (
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={finish}>
            Bekijk deals →
          </button>
        )}
      </div>
    </div>
  );
}

function PlatformStep({
  label, nr, color, handle, vol, onHandle, onVol, extra,
}: {
  label: string; nr: string; color: string; handle: string; vol: number;
  onHandle: (v: string) => void; onVol: (v: number) => void; extra?: React.ReactNode;
}) {
  return (
    <div className={styles.stepBox}>
      <span className="eyebrow">{nr}</span>
      <h1 className={styles.h1}>
        Koppel <span style={{ color }}>{label}</span>
      </h1>
      <p className={styles.lead}>Vul je gebruikersnaam en aantal volgers in.</p>
      <label className="flabel">Gebruikersnaam</label>
      <input className="inp" value={handle} placeholder={`@jouwnaam`} onChange={(e) => onHandle(e.target.value)} />
      <label className="flabel" style={{ marginTop: 16 }}>Aantal volgers</label>
      <input className="inp" type="number" min={0} value={vol || ""} placeholder="0"
        onChange={(e) => onVol(Number(e.target.value))} />
      {extra}
    </div>
  );
}
