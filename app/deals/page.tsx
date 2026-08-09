"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  listAllDeals,
  listRestaurants,
  listMyApplications,
  type PublicRestaurant,
} from "@/lib/appdata";
import type { Deal } from "@/lib/types";
import BottomNav from "../BottomNav";
import styles from "./deals.module.css";

const STATUS: Record<string, { label: string; cls: string }> = {
  wacht: { label: "In afwachting", cls: "wacht" },
  geaccepteerd: { label: "Geaccepteerd", cls: "ok" },
  afgewezen: { label: "Afgewezen", cls: "no" },
};

export default function DealsPage() {
  const router = useRouter();
  const { session, uid, loading } = useApp();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [rest, setRest] = useState<Record<string, PublicRestaurant>>({});
  const [statusByDeal, setStatusByDeal] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    (async () => {
      try {
        const [d, r] = await Promise.all([listAllDeals(), listRestaurants()]);
        setDeals(d.filter((x) => x.status === "open"));
        const m: Record<string, PublicRestaurant> = {};
        r.forEach((x) => (m[x.id] = x));
        setRest(m);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const mine = await listMyApplications(uid);
      const s: Record<string, string> = {};
      mine.forEach((a) => {
        if (a.dealId) s[a.dealId] = a.status;
      });
      setStatusByDeal(s);
    })();
  }, [uid]);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/start" className={styles.back}>‹</Link>
        <div className={styles.brand}>Deals</div>
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.list}>
        {busy ? (
          <div className={styles.subtle}>Laden…</div>
        ) : deals.length === 0 ? (
          <div className={styles.subtle}>Er zijn nu geen open deals.</div>
        ) : (
          deals.map((d) => {
            const r = rest[d.owner];
            const cover = r?.media?.sfeer?.find(Boolean) ?? null;
            const st = STATUS[statusByDeal[d.id ?? ""] ?? ""];
            return (
              <Link key={d.id} href={`/r/${d.owner}`} className={styles.deal}>
                <div className={styles.thumb} style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                  {!cover && <span className={styles.thumbFallback}>Dinely</span>}
                  <span className={styles.reward}>
                    {d.beloningstype === "betaald" ? `€${d.bedrag} + diner` : "Gratis diner"}
                  </span>
                  {st && <span className={`${styles.status} ${styles[st.cls]}`}>{st.label}</span>}
                </div>
                <div className={styles.body}>
                  <div className={styles.rest}>{r?.naam ?? "Restaurant"}</div>
                  <h3 className={styles.title}>{d.titel}</h3>
                  <div className={styles.meta}>
                    {[r?.keuken, r?.adres].filter(Boolean).join(" · ") || "Amsterdam"}
                  </div>
                  <div className={styles.chips}>
                    {(d.eisen ?? []).map((e, i) => (
                      <span key={i} className={styles.chip}>
                        {e.platform} ≥ {e.minVolgers.toLocaleString("nl-NL")}
                      </span>
                    ))}
                    {d.gevraagd && <span className={styles.chip}>{d.gevraagd}</span>}
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
