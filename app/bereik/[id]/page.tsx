"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  listMyApplications,
  getRestaurantById,
  uploadCreatorPhoto,
  validateStatsImage,
  submitReach,
} from "@/lib/appdata";
import { canSubmitReach, isValidEntry, type ReachEntry } from "@/lib/reach";
import type { Application } from "@/lib/types";
import Waiting from "../../Waiting";
import styles from "./bereik.module.css";

const KANALEN = ["Instagram", "TikTok", "YouTube", "Facebook", "Anders"];

type Entry = ReachEntry & { busy?: boolean; err?: string };

export default function BereikPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const appId = params?.id;
  const { session, uid, loading } = useApp();

  const [app, setApp] = useState<Application | null>(null);
  const [restNaam, setRestNaam] = useState("");
  const [busy, setBusy] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([{ bereik: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    if (!uid || !appId) return;
    (async () => {
      try {
        const apps = await listMyApplications(uid);
        const a = apps.find((x) => x.id === appId) || null;
        setApp(a);
        if (a?.reachEntries?.length) setEntries(a.reachEntries.map((e) => ({ ...e })));
        if (a?.restaurantId) {
          const r = await getRestaurantById(a.restaurantId);
          if (r?.naam) setRestNaam(r.naam);
        }
      } finally {
        setBusy(false);
      }
    })();
  }, [uid, appId]);

  function patch(i: number, p: Partial<Entry>) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...p } : e)));
  }
  function addEntry() {
    setEntries((prev) => [...prev, { bereik: 0 }]);
  }
  function removeEntry(i: number) {
    setEntries((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function uploadShot(i: number, f: File) {
    patch(i, { busy: true, err: "" });
    try {
      const url = await uploadCreatorPhoto(f, { maxDim: 2200, quality: 0.85 });
      const check = await validateStatsImage(url);
      if (!check.ok) {
        patch(i, { err: `Dit lijkt geen statistieken-screenshot. ${check.detail || ""}`.trim() });
      } else {
        patch(i, {
          foto: url,
          statsGeldig: true,
          ...(typeof check.bereik === "number" ? { bereik: check.bereik } : {}),
          ...(check.kanaal ? { kanaal: check.kanaal } : {}),
        });
      }
    } catch {
      patch(i, { err: "Uploaden mislukt. Probeer het opnieuw." });
    } finally {
      patch(i, { busy: false });
    }
  }

  async function opslaan() {
    if (!appId || !uid || !canSubmitReach(entries)) return;
    setSaving(true);
    const schoon: ReachEntry[] = entries
      .filter(isValidEntry)
      .map((e) => ({
        datum: e.datum || undefined,
        kanaal: e.kanaal || undefined,
        bereik: Number(e.bereik) || 0,
        foto: e.foto || undefined,
        statsGeldig: e.statsGeldig,
      }));
    try {
      await submitReach(appId, uid, schoon);
      router.push("/mij");
    } catch {
      setSaving(false);
    }
  }

  if (loading || !session || busy) return <div className={styles.loading}>Laden…</div>;
  if (!app) return <div className={styles.loading}>Deze deal is niet gevonden.</div>;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <button className={styles.back} onClick={() => router.push("/mij")} aria-label="Terug">‹</button>
        <div className={styles.brand}>Bereik doorgeven</div>
        <div style={{ width: 42 }} />
      </header>

      <div className={styles.body}>
        <h1 className={styles.h1}>Hoeveel mensen heb je bereikt{restNaam ? ` voor ${restNaam}` : ""}?</h1>
        <p className={styles.lead}>
          Upload een screenshot van je statistieken (dan lezen we het bereik automatisch uit), of vul het zelf in.
          Meerdere posts? Voeg ze los toe.
        </p>

        {entries.map((e, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.postNr}>Post {i + 1}</span>
              {entries.length > 1 && (
                <button className={styles.remove} onClick={() => removeEntry(i)} aria-label="Verwijderen">✕</button>
              )}
            </div>

            {/* Screenshot (optioneel, met OCR) */}
            <label className={styles.shot} style={e.foto ? { backgroundImage: `url(${e.foto})` } : undefined}>
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={e.busy}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.currentTarget.value = "";
                  if (f) uploadShot(i, f);
                }}
              />
              {e.busy ? (
                <span className={styles.shotHint}><Waiting label="Uitlezen" /></span>
              ) : e.foto ? (
                <span className={styles.shotChange}>Andere screenshot</span>
              ) : (
                <span className={styles.shotHint}>＋ Upload statistieken-screenshot</span>
              )}
            </label>
            {e.err && <p className={styles.err}>{e.err}</p>}

            <div className={styles.or}>of vul zelf in</div>

            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.lbl}>Datum van de post</label>
                <input
                  className="inp"
                  type="date"
                  value={e.datum || ""}
                  onChange={(ev) => patch(i, { datum: ev.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.lbl}>Kanaal</label>
                <select
                  className="inp"
                  value={e.kanaal || ""}
                  onChange={(ev) => patch(i, { kanaal: ev.target.value })}
                >
                  <option value="">Kies…</option>
                  {KANALEN.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.lbl}>Bereik (mensen bereikt)</label>
                <input
                  className="inp"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="bijv. 25.000"
                  value={e.bereik || ""}
                  onChange={(ev) => patch(i, { bereik: Number(ev.target.value) })}
                />
              </div>
            </div>
          </div>
        ))}

        <button className={styles.add} onClick={addEntry}>＋ Nog een post toevoegen</button>
      </div>

      <div className={styles.footer}>
        <button
          className="btn btn-gold"
          style={{ flex: 1 }}
          disabled={!canSubmitReach(entries) || saving}
          onClick={opslaan}
        >
          {saving ? <Waiting label="Versturen" /> : "Bereik doorgeven"}
        </button>
      </div>
    </div>
  );
}
