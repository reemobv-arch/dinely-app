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
    if (!d.id) return;
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
      });
      setApplied((p) => ({ ...p, [d.id!]: "ok" }));
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
                  <div className={styles.okBox}>✓ Sollicitatie verstuurd — het restaurant ziet 'm in hun dashboard.</div>
                ) : st === "err" ? (
                  <div className={styles.errBox}>
                    Versturen lukte net niet. Ververs de app en probeer opnieuw. Blijft het
                    misgaan, log dan uit en opnieuw in.
                  </div>
                ) : (
                  <button className={styles.apply} disabled={pending === d.id} onClick={() => apply(d)}>
                    {pending === d.id ? "Versturen…" : "Solliciteer op deze deal"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
