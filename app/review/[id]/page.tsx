"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  listMyApplications,
  getRestaurantById,
  createReview,
  markApplicationReviewed,
} from "@/lib/appdata";
import type { Application } from "@/lib/types";
import styles from "./review.module.css";

export default function ReviewPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { uid, session, loading, profile } = useApp();

  const [app, setApp] = useState<Application | null>(null);
  const [restNaam, setRestNaam] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(0);
  const [sterren, setSterren] = useState(0);
  const [vibeGoed, setVibeGoed] = useState("");
  const [vibeMinder, setVibeMinder] = useState("");
  const [etenGoed, setEtenGoed] = useState("");
  const [etenMinder, setEtenMinder] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const mine = await listMyApplications(uid);
      const found = mine.find((a) => a.id === id) ?? null;
      if (!found) { setNotFound(true); return; }
      setApp(found);
      const r = await getRestaurantById(found.restaurantId);
      setRestNaam(r?.naam ?? "Restaurant");
    })();
  }, [uid, id]);

  async function submit() {
    if (!app) return;
    setSaving(true);
    setError(null);
    try {
      await createReview({
        restaurantId: app.restaurantId,
        naam: profile.naam || app.handle || "Creator",
        sterren,
        vibeGoed,
        vibeMinder,
        etenGoed,
        etenMinder,
      });
      if (app.id) await markApplicationReviewed(app.id);
      router.replace("/mij");
    } catch {
      setError("Opslaan mislukt. Probeer het opnieuw.");
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className={styles.wrap}>
        <div className={styles.center}>
          <p className={styles.msg}>Deze deal is niet gevonden.</p>
          <button className="btn btn-ghost" onClick={() => router.replace("/mij")}>Terug</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <button className={styles.close} onClick={() => router.replace("/mij")}>✕</button>
        <div className={styles.rest}>{restNaam}</div>
        <div className={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`${styles.dot} ${i <= step ? styles.on : ""}`} />
          ))}
        </div>
      </header>

      <div className={styles.body}>
        {step === 0 && (
          <div className={styles.stepBox}>
            <h1 className={styles.h1}>Hoe was het?</h1>
            <p className={styles.lead}>Geef {restNaam} een cijfer van 1 tot 5 sterren.</p>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`${styles.star} ${n <= sterren ? styles.starOn : ""}`}
                  onClick={() => { setSterren(n); setTimeout(() => setStep(1), 220); }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">De vibe</span>
            <h1 className={styles.h1}>Hoe was de sfeer?</h1>
            <label className={styles.qLbl}>Wat was er goed aan de vibe?</label>
            <textarea className={styles.ta} value={vibeGoed} onChange={(e) => setVibeGoed(e.target.value)} placeholder="Bijv. intiem, mooi licht, fijne muziek…" />
            <label className={styles.qLbl}>En wat was er minder?</label>
            <textarea className={styles.ta} value={vibeMinder} onChange={(e) => setVibeMinder(e.target.value)} placeholder="Bijv. het was wat rumoerig…" />
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Het eten</span>
            <h1 className={styles.h1}>En het eten?</h1>
            <label className={styles.qLbl}>Wat was er goed aan het eten?</label>
            <textarea className={styles.ta} value={etenGoed} onChange={(e) => setEtenGoed(e.target.value)} placeholder="Bijv. de short rib was perfect…" />
            <label className={styles.qLbl}>En wat was er minder?</label>
            <textarea className={styles.ta} value={etenMinder} onChange={(e) => setEtenMinder(e.target.value)} placeholder="Bijv. het voorgerecht was klein…" />
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepBox}>
            <span className="eyebrow">Bijna klaar</span>
            <h1 className={styles.h1}>Je review</h1>
            <div className={styles.preview}>
              <div className={styles.pvStars}>
                {"★".repeat(sterren)}<span className={styles.pvEmpty}>{"★".repeat(5 - sterren)}</span>
              </div>
              <PvBlock title="Vibe — top" text={vibeGoed} />
              <PvBlock title="Vibe — minder" text={vibeMinder} />
              <PvBlock title="Eten — top" text={etenGoed} />
              <PvBlock title="Eten — minder" text={etenMinder} />
            </div>
            <div className={styles.finalNote}>Na akkoord is je review definitief en zichtbaar voor {restNaam}.</div>
            {error && <div className={styles.err}>{error}</div>}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Terug</button>
        )}
        {step === 0 ? (
          <div className={styles.hintR}>Tik op een ster</div>
        ) : step < 3 ? (
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => setStep((s) => s + 1)}>
            Volgende →
          </button>
        ) : (
          <button className="btn btn-gold" style={{ flex: 1 }} disabled={saving || sterren === 0} onClick={submit}>
            {saving ? "Opslaan…" : "Akkoord, plaats review"}
          </button>
        )}
      </div>
    </div>
  );
}

function PvBlock({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className={styles.pvBlock}>
      <div className={styles.pvTitle}>{title}</div>
      <div className={styles.pvText}>{text}</div>
    </div>
  );
}
