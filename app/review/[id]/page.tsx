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
import Waiting from "../../Waiting";
import styles from "./review.module.css";

const CATS = [
  { key: "communicatie", label: "Communicatie", hint: "Hoe fijn was het contact met het restaurant?" },
  { key: "voedsel", label: "Voedsel", hint: "Hoe was het eten?" },
  { key: "sfeer", label: "Sfeer", hint: "Hoe was de sfeer en beleving?" },
  { key: "waarde", label: "Waard voor je geld", hint: "Kreeg je waar voor je geld?" },
] as const;

type CatKey = (typeof CATS)[number]["key"];

export default function ReviewPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { uid, session, loading, profile } = useApp();

  const [app, setApp] = useState<Application | null>(null);
  const [restNaam, setRestNaam] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [scores, setScores] = useState<Record<CatKey, number>>({
    communicatie: 0,
    voedsel: 0,
    sfeer: 0,
    waarde: 0,
  });
  const [toelichting, setToelichting] = useState("");
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
      if (!found) {
        setNotFound(true);
        return;
      }
      setApp(found);
      const r = await getRestaurantById(found.restaurantId);
      setRestNaam(r?.naam ?? "Restaurant");
    })();
  }, [uid, id]);

  const alleGescoord = CATS.every((c) => scores[c.key] > 0);

  async function submit() {
    if (!app || !alleGescoord) return;
    setSaving(true);
    setError(null);
    try {
      await createReview({
        restaurantId: app.restaurantId,
        naam: profile.naam || app.handle || "Creator",
        communicatie: scores.communicatie,
        voedsel: scores.voedsel,
        sfeer: scores.sfeer,
        waarde: scores.waarde,
        toelichting,
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
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.body}>
        <div className={styles.stepBox}>
          <h1 className={styles.h1}>Hoe was het bij {restNaam}?</h1>
          <p className={styles.lead}>Geef sterren op vier onderdelen. Zo help je andere creators.</p>

          {CATS.map((c) => (
            <div key={c.key} className={styles.catRow}>
              <div className={styles.catInfo}>
                <span className={styles.catLbl}>{c.label}</span>
                <span className={styles.catHint}>{c.hint}</span>
              </div>
              <div className={styles.catStars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.catStar} ${n <= scores[c.key] ? styles.catStarOn : ""}`}
                    onClick={() => setScores((s) => ({ ...s, [c.key]: n }))}
                    aria-label={`${c.label}: ${n} sterren`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}

          <label className={styles.qLbl} style={{ marginTop: 20 }}>Iets om toe te lichten? (optioneel)</label>
          <textarea
            className={styles.ta}
            value={toelichting}
            onChange={(e) => setToelichting(e.target.value)}
            placeholder="Bijv. het team was super behulpzaam en de sfeer klopte helemaal…"
          />
          {error && <div className={styles.err}>{error}</div>}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className="btn btn-gold"
          style={{ flex: 1 }}
          disabled={saving || !alleGescoord}
          onClick={submit}
        >
          {saving ? <Waiting label="Opslaan" /> : "Plaats review"}
        </button>
      </div>
    </div>
  );
}
