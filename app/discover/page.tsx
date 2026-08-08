"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  listRestaurants,
  listAllDeals,
  listAllReviews,
  coordsFor,
  avgVibe,
  type PublicRestaurant,
} from "@/lib/appdata";
import type { Deal, Review } from "@/lib/types";
import BottomNav from "../BottomNav";
import styles from "./discover.module.css";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function DiscoverPage() {
  const [rows, setRows] = useState<PublicRestaurant[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [busy, setBusy] = useState(true);

  const [q, setQ] = useState("");
  const [stad, setStad] = useState("Amsterdam");
  const [gasten, setGasten] = useState(2);

  useEffect(() => {
    (async () => {
      try {
        const [r, d, rv] = await Promise.all([
          listRestaurants(),
          listAllDeals(),
          listAllReviews(),
        ]);
        setRows(r);
        setDeals(d);
        setReviews(rv);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const ss = stad.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ = !qq || `${r.naam} ${r.keuken}`.toLowerCase().includes(qq);
      const okStad = !ss || `${r.adres}`.toLowerCase().includes(ss) || !r.adres;
      return okQ && okStad;
    });
  }, [rows, q, stad]);

  const points = useMemo(
    () =>
      filtered.map((r) => {
        const [lat, lng] = coordsFor(r.id);
        return { id: r.id, name: r.naam || "Restaurant", lat, lng };
      }),
    [filtered]
  );

  function dealCount(id: string) {
    return deals.filter((d) => d.owner === id && d.status === "open").length;
  }
  function vibe(id: string) {
    return avgVibe(reviews.filter((r) => r.restaurantId === id));
  }
  function cover(r: PublicRestaurant) {
    return r.media?.sfeer?.find(Boolean) ?? null;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/start" className={styles.back}>‹</Link>
        <div className={styles.brand}>Dinel<span>y</span></div>
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.search}>
        <div className={styles.searchRow}>
          <span className={styles.si}>⌕</span>
          <input
            className={styles.sInput}
            placeholder="Zoek een restaurant"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <label className={styles.filter}>
            <span>Stad</span>
            <input value={stad} onChange={(e) => setStad(e.target.value)} />
          </label>
          <label className={styles.filter}>
            <span>Personen</span>
            <div className={styles.stepper}>
              <button type="button" onClick={() => setGasten((g) => Math.max(1, g - 1))}>−</button>
              <b>{gasten}</b>
              <button type="button" onClick={() => setGasten((g) => g + 1)}>+</button>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.map}>
        {!busy && points.length > 0 && <MapView points={points} onSelect={() => {}} />}
        {!busy && points.length === 0 && (
          <div className={styles.mapEmpty}>Nog geen restaurants om te tonen.</div>
        )}
      </div>

      <div className={styles.listHead}>
        <span>{filtered.length} restaurant{filtered.length === 1 ? "" : "s"}</span>
        <span className={styles.mut}>in {stad || "heel Nederland"}</span>
      </div>

      <div className={styles.list}>
        {busy ? (
          <div className={styles.subtle}>Laden…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.subtle}>Geen restaurants gevonden. Pas je zoekopdracht aan.</div>
        ) : (
          filtered.map((r) => {
            const img = cover(r);
            const v = vibe(r.id);
            const dc = dealCount(r.id);
            return (
              <Link key={r.id} href={`/r/${r.id}`} className={styles.card}>
                <div className={styles.thumb} style={img ? { backgroundImage: `url(${img})` } : undefined}>
                  {!img && <span className={styles.thumbFallback}>Dinely</span>}
                  {dc > 0 && <span className={styles.dealBadge}>{dc} deal{dc === 1 ? "" : "s"}</span>}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h3>{r.naam || "Naamloos restaurant"}</h3>
                    {v != null && <span className={styles.score}>{v.toFixed(1)}</span>}
                  </div>
                  <div className={styles.cardMeta}>
                    {[r.keuken, r.prijs, r.adres].filter(Boolean).join(" · ") || "Nog geen gegevens"}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
