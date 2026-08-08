"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import {
  listAllDeals,
  listRestaurants,
  createApplication,
} from "@/lib/appdata";
import type { Deal } from "@/lib/types";
import { formatNL } from "@/lib/format";
import BottomNav from "../BottomNav";
import styles from "./deals.module.css";

export default function DealsPage() {
  const router = useRouter();
  const { session, loading, profile } = useApp();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [applied, setApplied] = useState<Record<string, "ok" | "err">>({});
  const [pending, setPending] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState("Instagram");
  const [pickDeal, setPickDeal] = useState<string | null>(null);
  const [pickDate, setPickDate] = useState("");
  const [appliedDate, setAppliedDate] = useState<Record<string, string>>({});

  const todayISO = new Date().toISOString().slice(0, 10);
  function windowEnd(d: Deal): string {
    const startMs = d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now();
    const end = new Date(startMs + (d.looptijdDagen || 14) * 86400000);
    return end.toISOString().slice(0, 10);
  }

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    try {
      const p = localStorage.getItem("dinely-app:platforms");
      if (p) setPlatforms(p);
    } catch {
      /* negeer */
    }
    (async () => {
      try {
        const [d, r] = await Promise.all([listAllDeals(), listRestaurants()]);
        setDeals(d.filter((x) => x.status === "open"));
        const m: Record<string, string> = {};
        r.forEach((x) => (m[x.id] = x.naam));
        setNames(m);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  async function apply(d: Deal) {
    if (!d.id || !pickDate) return;
    setPending(d.id);
    try {
      await createApplication({
        dealId: d.id,
        restaurantId: d.owner,
        handle: profile.instagram || profile.naam || "Creator",
        volgers: profile.volgers,
        platform: platforms,
        regio: profile.regio,
        geslacht: profile.geslacht,
        bezoekDatum: pickDate,
      });
      setAppliedDate((p) => ({ ...p, [d.id!]: pickDate }));
      setApplied((p) => ({ ...p, [d.id!]: "ok" }));
      setPickDeal(null);
      setPickDate("");
    } catch {
      setApplied((p) => ({ ...p, [d.id!]: "err" }));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/start" className={styles.back}>‹</Link>
        <div className={styles.brand}>Deals</div>
        <div style={{ width: 30 }} />
      </header>

      {profile.naam && (
        <div className={styles.me}>
          <b>{profile.naam}</b> · {profile.volgers.toLocaleString("nl-NL")} volgers · {platforms}
        </div>
      )}

      <div className={styles.list}>
        {busy ? (
          <div className={styles.subtle}>Laden…</div>
        ) : deals.length === 0 ? (
          <div className={styles.subtle}>Er zijn nu geen open deals.</div>
        ) : (
          deals.map((d) => {
            const st = applied[d.id ?? ""];
            return (
              <div key={d.id} className={styles.deal}>
                <div className={styles.dTop}>
                  <div>
                    <div className={styles.rest}>{names[d.owner] ?? "Restaurant"}</div>
                    <h3 className={styles.title}>{d.titel}</h3>
                  </div>
                  <span className={styles.reward}>
                    {d.beloningstype === "betaald" ? `€${d.bedrag}` : "Gratis"}
                  </span>
                </div>
                <div className={styles.chips}>
                  {(d.eisen ?? []).map((e, i) => (
                    <span key={i} className={styles.chip}>{e.platform} ≥ {e.minVolgers.toLocaleString("nl-NL")}</span>
                  ))}
                  {d.gevraagd && <span className={styles.chip}>{d.gevraagd}</span>}
                </div>

                {st === "ok" ? (
                  <div className={styles.okBox}>✓ Sollicitatie verstuurd — je komt op <b>{formatNL(appliedDate[d.id ?? ""])}</b>. Het restaurant ziet 'm in hun dashboard.</div>
                ) : st === "err" ? (
                  <div className={styles.errBox}>
                    Versturen lukte net niet. Ververs de app en probeer opnieuw. Blijft het
                    misgaan, log dan uit en opnieuw in.
                  </div>
                ) : pickDeal === d.id ? (
                  <div className={styles.pick}>
                    <label className={styles.pickLbl}>Wanneer kom je langs?</label>
                    <input
                      className={styles.pickInput}
                      type="date"
                      min={todayISO}
                      max={windowEnd(d)}
                      value={pickDate}
                      onChange={(e) => setPickDate(e.target.value)}
                    />
                    <div className={styles.pickHint}>Kies een dag binnen de looptijd van deze deal.</div>
                    <button
                      className={styles.apply}
                      disabled={!pickDate || pending === d.id}
                      onClick={() => apply(d)}
                    >
                      {pending === d.id ? "Versturen…" : "Verstuur sollicitatie →"}
                    </button>
                  </div>
                ) : (
                  <button className={styles.apply} onClick={() => { setPickDeal(d.id ?? null); setPickDate(""); }}>
                    Solliciteer op deze deal
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
