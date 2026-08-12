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
import EmptyState from "../EmptyState";
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
  const [keuken, setKeuken] = useState("");
  const [prijs, setPrijs] = useState("");
  const [metDeals, setMetDeals] = useState(false);

  const keukens = useMemo(
    () => [...new Set(rows.map((r) => r.keuken).filter(Boolean))].sort(),
    [rows]
  );
  const filtersActief = !!(keuken || prijs || metDeals);
  function wisFilters() {
    setKeuken("");
    setPrijs("");
    setMetDeals(false);
  }

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
      const okKeuken = !keuken || r.keuken === keuken;
      const okPrijs = !prijs || r.prijs === prijs;
      const okDeals = !metDeals || deals.some((d) => d.owner === r.id && d.status === "open");
      return okQ && okStad && okKeuken && okPrijs && okDeals;
    });
  }, [rows, q, stad, keuken, prijs, metDeals, deals]);

  const points = useMemo(
    () =>
      filtered.map((r) => {
        const [lat, lng] =
          typeof r.lat === "number" && typeof r.lng === "number"
            ? [r.lat, r.lng]
            : coordsFor(r.id);
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
        <div className={styles.filterBar}>
          <select className={styles.fSelect} value={keuken} onChange={(e) => setKeuken(e.target.value)}>
            <option value="">Alle keukens</option>
            {keukens.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {["€", "€€", "€€€", "€€€€"].map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.fChip} ${prijs === p ? styles.fChipOn : ""}`}
              onClick={() => setPrijs(prijs === p ? "" : p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.fChip} ${metDeals ? styles.fChipOn : ""}`}
            onClick={() => setMetDeals((v) => !v)}
          >
            Met deals
          </button>
          {filtersActief && (
            <button type="button" className={styles.fClear} onClick={wisFilters}>Wis ✕</button>
          )}
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
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.card} aria-hidden>
              <div className={styles.thumb}>
                <span className="sk" style={{ position: "absolute", inset: 0 }} />
              </div>
              <div className={styles.cardBody}>
                <span className="sk" style={{ display: "block", height: 18, width: "55%", marginBottom: 11 }} />
                <span className="sk" style={{ display: "block", height: 12, width: "80%" }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="⌕"
            title="Niks gevonden"
            text="Geen restaurants voor deze zoekopdracht of filters. Pas je selectie aan."
            actionLabel={q || filtersActief ? "Wis filters" : undefined}
            onAction={() => {
              setQ("");
              wisFilters();
            }}
          />
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
