"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { filterRestaurants } from "@/lib/discoverFilter";
import { sorteerOpBoost } from "@/lib/feedBoost";
import { readSnapshot, writeSnapshot } from "@/lib/snapshotCache";
import styles from "./discover.module.css";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

// Steden voor de dropdown. We tonen alleen die ook echt in de adressen voorkomen.
const STEDEN = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen",
  "Tilburg", "Almere", "Breda", "Nijmegen", "Haarlem", "Arnhem", "Amersfoort",
  "Zaanstad", "Den Bosch", "Zwolle", "Maastricht", "Leiden", "Dordrecht", "Delft",
];

export default function DiscoverPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PublicRestaurant[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [busy, setBusy] = useState(true);

  const [q, setQ] = useState("");
  const [stad, setStad] = useState(""); // standaard heel Nederland
  const [keuken, setKeuken] = useState("");
  const [prijs, setPrijs] = useState("");
  const [metDeals, setMetDeals] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // filters achter de ≡-knop

  const keukens = useMemo(
    () => [...new Set(rows.map((r) => r.keuken).filter(Boolean))].sort(),
    [rows]
  );
  // Steden voor de dropdown: bekende NL-steden die ook echt in de adressen
  // voorkomen (anders de volledige lijst als er nog geen data is).
  const steden = useMemo(() => {
    const inData = STEDEN.filter((c) =>
      rows.some((r) => `${r.stad || ""} ${r.adres || ""}`.toLowerCase().includes(c.toLowerCase()))
    );
    return inData.length ? inData : STEDEN;
  }, [rows]);
  const filtersActief = !!(keuken || prijs || metDeals);
  const aantalActief = [stad, keuken, prijs, metDeals ? "d" : ""].filter(Boolean).length;
  function wisFilters() {
    setKeuken("");
    setPrijs("");
    setMetDeals(false);
  }

  useEffect(() => {
    // Meteen de laatst bekende data tonen (stale-while-revalidate).
    const cached = readSnapshot<{ r: PublicRestaurant[]; d: Deal[]; rv: Review[] }>("dinely:discover");
    if (cached) {
      setRows(cached.r);
      setDeals(cached.d);
      setReviews(cached.rv);
      setBusy(false);
    }
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
        writeSnapshot("dinely:discover", { r, d, rv });
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => sorteerOpBoost(filterRestaurants(rows, { q, stad, keuken, prijs, metDeals }, deals)),
    [rows, q, stad, keuken, prijs, metDeals, deals]
  );

  const points = useMemo(
    () =>
      filtered.map((r) => {
        const [lat, lng] =
          typeof r.lat === "number" && typeof r.lng === "number"
            ? [r.lat, r.lng]
            : coordsFor(r.id);
        const hasDeal = deals.some((d) => d.owner === r.id && d.status === "open");
        return { id: r.id, name: r.naam || "Restaurant", lat, lng, hasDeal };
      }),
    [filtered, deals]
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
        <div className={styles.brand}>Dine<span>ly</span></div>
        <div style={{ width: 42 }} />
      </header>

      <div className={styles.mapBig}>
        {!busy && points.length > 0 && (
          <MapView points={points} onSelect={(id) => router.push(`/r/${id}`)} />
        )}
        {!busy && points.length === 0 && (
          <div className={styles.mapEmpty}>Nog geen restaurants om te tonen.</div>
        )}
        <div className={styles.floatBar}>
          <div className={styles.searchRow}>
            <span className={styles.si}>⌕</span>
            <input
              className={styles.sInput}
              placeholder="Zoek een restaurant"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button type="button" className={styles.sClear} onClick={() => setQ("")} aria-label="Zoekopdracht wissen">✕</button>
            )}
          </div>
          <button type="button" className={styles.filterBtn} onClick={() => setSheetOpen(true)} aria-label="Filters">
            <span className={styles.burger}><i /><i /><i /></span>
            {aantalActief > 0 && <span className={styles.filterDot}>{aantalActief}</span>}
          </button>
        </div>
      </div>

      {aantalActief > 0 && (
        <div className={styles.activeChips}>
          {stad && <button type="button" className={styles.aChip} onClick={() => setStad("")}>{stad} <span>✕</span></button>}
          {keuken && <button type="button" className={styles.aChip} onClick={() => setKeuken("")}>{keuken} <span>✕</span></button>}
          {prijs && <button type="button" className={styles.aChip} onClick={() => setPrijs("")}>{prijs} <span>✕</span></button>}
          {metDeals && <button type="button" className={styles.aChip} onClick={() => setMetDeals(false)}>Met deals <span>✕</span></button>}
        </div>
      )}

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

      {sheetOpen && (
        <div className={styles.sheetOverlay} onClick={() => setSheetOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetGrip} />
            <div className={styles.sheetHead}>
              <b>Filters</b>
              <button type="button" className={styles.sheetClose} onClick={() => setSheetOpen(false)} aria-label="Sluiten">✕</button>
            </div>

            <div className={styles.sLabel}>Stad</div>
            <select className={styles.sSelect} value={steden.includes(stad) ? stad : ""} onChange={(e) => setStad(e.target.value)}>
              <option value="">Heel Nederland</option>
              {steden.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className={styles.sLabel}>Keuken</div>
            <select className={styles.sSelect} value={keuken} onChange={(e) => setKeuken(e.target.value)}>
              <option value="">Alle keukens</option>
              {keukens.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <div className={styles.sLabel}>Prijs</div>
            <div className={styles.priceRow}>
              {["€", "€€", "€€€", "€€€€"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.pBtn} ${prijs === p ? styles.pBtnOn : ""}`}
                  onClick={() => setPrijs(prijs === p ? "" : p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className={styles.sLabel}>Extra</div>
            <div className={styles.priceRow}>
              <button
                type="button"
                className={`${styles.pBtn} ${metDeals ? styles.pBtnOn : ""}`}
                onClick={() => setMetDeals((v) => !v)}
              >
                Met deals
              </button>
            </div>

            <div className={styles.sheetActions}>
              {aantalActief > 0 && (
                <button type="button" className={styles.sWis} onClick={() => { setStad(""); wisFilters(); }}>Wis alles</button>
              )}
              <button type="button" className={styles.applyBtn} onClick={() => setSheetOpen(false)}>
                Toon {filtered.length} restaurant{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
