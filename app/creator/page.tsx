"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import { saveCreator } from "@/lib/appdata";
import styles from "./creator.module.css";

const MIN_VOLGERS = 2000;
const STEPS = 7;

export default function CreatorPage() {
  const router = useRouter();
  const { session, loading, profile, saveProfile } = useApp();

  const [step, setStep] = useState(0);
  const [naam, setNaam] = useState("");
  const [regio, setRegio] = useState("Amsterdam");
  const [geslacht, setGeslacht] = useState<"vrouw" | "man" | "">("");
  const [leeftijd, setLeeftijd] = useState<number | "">("");
  const [ig, setIg] = useState({ handle: "", vol: 0 });
  const [tt, setTt] = useState({ handle: "", vol: 0 });
  const [, setDealParam] = useState("");

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
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

  const totaal = (ig.vol || 0) + (tt.vol || 0);
  const genoeg = totaal >= MIN_VOLGERS;
  const leeftijdOk = typeof leeftijd === "number" && leeftijd >= 16 && leeftijd <= 100;

  const canNext =
    step === 0
      ? !!naam.trim()
      : step === 1
      ? !!regio.trim()
      : step === 2
      ? !!geslacht
      : step === 3
      ? leeftijdOk
      : true;
  const progress = ((step + 1) / STEPS) * 100;

  async function finish() {
    if (!genoeg) return;
    const platforms = [ig.handle ? "Instagram" : "", tt.handle ? "TikTok" : ""].filter(Boolean);
    const prof = { naam, instagram: ig.handle, tiktok: tt.handle, volgers: totaal, regio, geslacht };
    saveProfile(prof);
    try {
      localStorage.setItem("dinely-app:platforms", platforms.join(" · "));
    } catch {
      /* negeer */
    }
    try {
      const extra = typeof leeftijd === "number" && leeftijd > 0 ? { leeftijd } : {};
      const tel = session?.phone ? { telefoon: session.phone } : {};
      await saveCreator({ ...prof, ...extra, ...tel });
    } catch {
      /* opslaan ter goedkeuring best-effort */
    }
    router.push("/wachten");
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <button
          type="button"
          className={styles.back}
          onClick={() => (step === 0 ? router.push("/start") : setStep((s) => s - 1))}
          aria-label="Terug"
        >
          ‹
        </button>
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.body}>
        {step === 0 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Stap 1 van {STEPS}</span>
            <h1 className={styles.h1}>Hoe heet je?</h1>
            <p className={styles.lead}>Je naam of artiestennaam, zoals restaurants je zien.</p>
            <input
              className="inp"
              autoFocus
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Juul Bakker"
            />
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Stap 2 van {STEPS}</span>
            <h1 className={styles.h1}>In welke stad zit je?</h1>
            <p className={styles.lead}>Zo tonen we je deals bij jou in de buurt.</p>
            <input
              className="inp"
              autoFocus
              value={regio}
              onChange={(e) => setRegio(e.target.value)}
              placeholder="Amsterdam"
            />
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Stap 3 van {STEPS}</span>
            <h1 className={styles.h1}>Ik ben…</h1>
            <p className={styles.lead}>Restaurants filteren soms op wie ze zoeken.</p>
            <div className={styles.seg}>
              {(["vrouw", "man"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`${styles.segBtn} ${geslacht === g ? styles.segOn : ""}`}
                  onClick={() => setGeslacht(g)}
                >
                  {g === "vrouw" ? "Vrouw" : "Man"}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Stap 4 van {STEPS}</span>
            <h1 className={styles.h1}>Hoe oud ben je?</h1>
            <p className={styles.lead}>We werken met creators van 16 jaar en ouder.</p>
            <input
              className="inp"
              type="number"
              min={16}
              max={100}
              inputMode="numeric"
              autoFocus
              value={leeftijd === "" ? "" : leeftijd}
              onChange={(e) => setLeeftijd(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="24"
            />
            {leeftijd !== "" && !leeftijdOk && (
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted-2)" }}>
                Vul een leeftijd tussen 16 en 100 in.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <PlatformStep
            label="Instagram"
            nr={`Stap 5 van ${STEPS}`}
            color="#E1306C"
            handle={ig.handle}
            vol={ig.vol}
            onHandle={(v) => setIg((s) => ({ ...s, handle: v }))}
            onVol={(v) => setIg((s) => ({ ...s, vol: v }))}
          />
        )}
        {step === 5 && (
          <PlatformStep
            label="TikTok"
            nr={`Stap 6 van ${STEPS}`}
            color="#25F4EE"
            handle={tt.handle}
            vol={tt.vol}
            onHandle={(v) => setTt((s) => ({ ...s, handle: v }))}
            onVol={(v) => setTt((s) => ({ ...s, vol: v }))}
          />
        )}

        {step === 6 && (
          <div className={styles.stepBox}>
            {genoeg ? (
              <>
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
                  </div>
                </div>
                <div className={styles.note}>
                  Je profiel wordt eerst door Dinely beoordeeld. Bereik is nu zelf ingevuld;
                  straks koppelen we de echte Instagram- en TikTok-API voor een geverifieerd-badge.
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">Bijna</span>
                <h1 className={styles.h1}>Bedankt voor je interesse</h1>
                <p className={styles.lead}>
                  Op dit moment werken we met creators vanaf <b>{MIN_VOLGERS.toLocaleString("nl-NL")} volgers</b>.
                  Jouw totaal is nu <b>{totaal.toLocaleString("nl-NL")}</b>.
                </p>
                <div className={styles.note}>
                  Groei je nog even door? Kom dan terug, dan zetten we je meteen op weg.
                  Je kunt intussen wel gewoon restaurants ontdekken.
                </div>
                <Link href="/discover" className={styles.altLink}>Ontdek restaurants →</Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Terug</button>
        )}
        {step < 6 ? (
          <button
            className="btn btn-gold"
            style={{ flex: 1 }}
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Volgende →
          </button>
        ) : genoeg ? (
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={finish}>
            Bekijk deals →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PlatformStep({
  label, nr, color, handle, vol, onHandle, onVol,
}: {
  label: string; nr: string; color: string; handle: string; vol: number;
  onHandle: (v: string) => void; onVol: (v: number) => void;
}) {
  return (
    <div className={styles.stepBox}>
      <span className="eyebrow">{nr}</span>
      <h1 className={styles.h1}>
        Koppel <span style={{ color }}>{label}</span>
      </h1>
      <p className={styles.lead}>Vul je gebruikersnaam en aantal volgers in. Geen {label}? Laat leeg.</p>
      <label className="flabel">Gebruikersnaam</label>
      <input className="inp" value={handle} placeholder="@jouwnaam" onChange={(e) => onHandle(e.target.value)} />
      <label className="flabel" style={{ marginTop: 16 }}>Aantal volgers</label>
      <input className="inp" type="number" min={0} value={vol || ""} placeholder="0"
        onChange={(e) => onVol(Number(e.target.value))} />
    </div>
  );
}
