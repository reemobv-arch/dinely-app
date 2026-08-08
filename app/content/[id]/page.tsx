"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  listMyApplications,
  listAllDeals,
  getRestaurantById,
  uploadContentFile,
  createContent,
  markApplicationContentPosted,
} from "@/lib/appdata";
import type { Application } from "@/lib/types";
import styles from "./content.module.css";

type Picked = { file: File; url: string; type: "image" | "video" };

export default function ContentPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { uid, session, loading, profile } = useApp();

  const [app, setApp] = useState<Application | null>(null);
  const [restNaam, setRestNaam] = useState("");
  const [gevraagd, setGevraagd] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [picked, setPicked] = useState<Picked[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const [mine, deals] = await Promise.all([listMyApplications(uid), listAllDeals()]);
      const found = mine.find((a) => a.id === id) ?? null;
      if (!found) { setNotFound(true); return; }
      setApp(found);
      const deal = deals.find((d) => d.id === found.dealId);
      setGevraagd(deal?.gevraagd ?? "");
      const r = await getRestaurantById(found.restaurantId);
      setRestNaam(r?.naam ?? "Restaurant");
    })();
  }, [uid, id]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      type: (f.type.startsWith("video") ? "video" : "image") as "image" | "video",
    }));
    setPicked((p) => [...p, ...next]);
  }
  function remove(i: number) {
    setPicked((p) => p.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!app || picked.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const media = [];
      for (const p of picked) {
        media.push(await uploadContentFile(p.file));
      }
      await createContent({
        restaurantId: app.restaurantId,
        dealId: app.dealId,
        naam: profile.naam || app.handle || "Creator",
        caption,
        media,
      });
      if (app.id) await markApplicationContentPosted(app.id);
      router.replace("/mij");
    } catch {
      setError("Uploaden mislukt. Staat Cloud Storage aan in Firebase? Probeer anders opnieuw.");
      setBusy(false);
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
      </header>

      <div className={styles.body}>
        <h1 className={styles.h1}>Plaats je content</h1>

        <div className={styles.note}>
          <b>Vergeet niet @DinelyApp te taggen</b> in je story/reel op Instagram of TikTok.
          Upload daarna dezelfde foto's of video hier{gevraagd ? ` (gevraagd: ${gevraagd})` : ""}.
        </div>

        {picked.length > 0 && (
          <div className={styles.grid}>
            {picked.map((p, i) => (
              <div key={i} className={styles.thumb}>
                {p.type === "video" ? (
                  <video src={p.url} muted playsInline className={styles.media} />
                ) : (
                  <img src={p.url} alt="" className={styles.media} />
                )}
                <button className={styles.rm} onClick={() => remove(i)}>✕</button>
                {p.type === "video" && <span className={styles.vtag}>video</span>}
              </div>
            ))}
          </div>
        )}

        <button className={styles.addBtn} onClick={() => inputRef.current?.click()}>
          + Foto of video toevoegen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={onPick}
        />

        <label className={styles.lbl}>Bijschrift (optioneel)</label>
        <textarea
          className={styles.ta}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Bijv. Wat een avond bij dit restaurant…"
        />

        {error && <div className={styles.err}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button
          className="btn btn-gold"
          style={{ flex: 1 }}
          disabled={busy || picked.length === 0}
          onClick={submit}
        >
          {busy ? "Uploaden…" : `Plaats op ${restNaam}`}
        </button>
      </div>
    </div>
  );
}
