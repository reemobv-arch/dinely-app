"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  listAllDeals,
  listRestaurants,
  listMyApplications,
  listMyInvites,
  getMyCreator,
  type PublicRestaurant,
} from "@/lib/appdata";
import type { Deal } from "@/lib/types";
import { showsInFeed } from "@/lib/dealVisibility";
import BottomNav from "../BottomNav";
import EmptyState from "../EmptyState";
import styles from "./deals.module.css";

const STATUS: Record<string, { label: string; cls: string }> = {
  wacht: { label: "Aangevraagd", cls: "wacht" },
  geaccepteerd: { label: "Je bent gekozen ✓", cls: "ok" },
  afgewezen: { label: "Deze keer niet", cls: "no" },
};

export default function DealsPage() {
  const router = useRouter();
  const { session, uid, loading } = useApp();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [rest, setRest] = useState<Record<string, PublicRestaurant>>({});
  const [statusByDeal, setStatusByDeal] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

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
    getMyCreator(uid)
      .then((c) => setApproved(c?.status === "approved"))
      .catch(() => setApproved(false));
    listMyInvites(uid).then(setInvited).catch(() => {});
  }, [uid]);

  // In de algemene feed tonen we alleen open deals en invite-only deals waarvoor
  // je bent uitgenodigd. (Op de restaurantpagina zie je invite-only deals wél,
  // maar grijs.)
  const zichtbaar = (d: Deal) => showsInFeed(d, invited);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/start" className={styles.back}>‹</Link>
        <div className={styles.brand}>Deals</div>
        <div style={{ width: 30 }} />
      </header>

      {approved === false && (
        <div className={styles.lockNote}>
          Je account wacht op goedkeuring. Je kunt deals alvast bekijken, maar pas reageren zodra je
          bent goedgekeurd.
        </div>
      )}

      <div className={styles.list}>
        {busy ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.deal} aria-hidden>
              <div className={styles.thumb}>
                <span className="sk" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
              </div>
              <div className={styles.body}>
                <span className="sk" style={{ display: "block", height: 12, width: "30%", marginBottom: 12 }} />
                <span className="sk" style={{ display: "block", height: 20, width: "70%", marginBottom: 14 }} />
                <span className="sk" style={{ display: "block", height: 30, width: "60%", borderRadius: 100 }} />
              </div>
            </div>
          ))
        ) : deals.filter((d) => rest[d.owner] && zichtbaar(d)).length === 0 ? (
          <EmptyState
            icon="✦"
            title="Nog geen open deals"
            text="Zodra restaurants nieuwe deals plaatsen, verschijnen ze hier. Ontdek intussen restaurants bij jou in de buurt."
            actionLabel="Ontdek restaurants"
            actionHref="/discover"
          />
        ) : (
          deals
            .filter((d) => rest[d.owner] && zichtbaar(d))
            .map((d) => {
            const r = rest[d.owner];
            const cover = r?.media?.sfeer?.find(Boolean) ?? null;
            const st = STATUS[statusByDeal[d.id ?? ""] ?? ""];
            const locked = approved === false;
            const inner = (
              <>
                <div className={styles.thumb} style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                  {!cover && <span className={styles.thumbFallback}>Dinely</span>}
                  <span className={styles.reward}>
                    {d.beloningstype === "betaald" ? `€${d.bedrag} + diner` : "Gratis diner"}
                  </span>
                  {locked && <span className={styles.lockBadge}>🔒 In afwachting</span>}
                  {!locked && st && <span className={`${styles.status} ${styles[st.cls]}`}>{st.label}</span>}
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
              </>
            );
            return locked ? (
              <div key={d.id} className={`${styles.deal} ${styles.locked}`} aria-disabled="true">
                {inner}
              </div>
            ) : (
              <Link key={d.id} href={`/r/${d.owner}`} className={styles.deal}>
                {inner}
              </Link>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
