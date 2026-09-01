"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { listMyAmbassadeurInvites, respondAmbassadeurInvite } from "@/lib/appdata";
import type { AmbassadeurInvite } from "@/lib/types";
import Waiting from "../Waiting";
import styles from "./ambassadeur.module.css";

export default function AmbassadeurPage() {
  const router = useRouter();
  const { session, uid, loading } = useApp();
  const [invites, setInvites] = useState<AmbassadeurInvite[]>([]);
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        setInvites(await listMyAmbassadeurInvites(uid));
      } finally {
        setBusy(false);
      }
    })();
  }, [uid]);

  async function respond(inv: AmbassadeurInvite, accept: boolean) {
    if (!inv.id) return;
    setWorking(inv.id);
    const r = await respondAmbassadeurInvite(inv.id, accept);
    setWorking(null);
    if (r.ok) {
      setInvites((prev) => prev.filter((x) => x.id !== inv.id));
      setDone(
        accept
          ? `Je bent nu ambassadeur van ${inv.restaurantNaam || "dit restaurant"}${r.punten ? ` — +${r.punten} punten!` : "!"}`
          : "Uitnodiging afgewezen."
      );
    }
  }

  if (loading || !session) return null;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <button className={styles.back} onClick={() => router.push("/mij")} aria-label="Terug">‹</button>
        <div className={styles.brand}>Ambassadeur</div>
        <div style={{ width: 42 }} />
      </header>

      <div className={styles.body}>
        {done && <div className={styles.done}>{done}</div>}

        {busy ? (
          <div className={styles.empty}><Waiting label="Laden" /></div>
        ) : invites.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>★</div>
            <h1 className={styles.h1}>Geen uitnodigingen</h1>
            <p className={styles.lead}>
              Zodra een restaurant je als vaste ambassadeur wil, verschijnt de uitnodiging hier.
            </p>
          </div>
        ) : (
          <>
            <h1 className={styles.h1}>Je bent uitgenodigd!</h1>
            <p className={styles.lead}>Als ambassadeur werk je vaker samen met een restaurant en verdien je punten.</p>
            {invites.map((inv) => (
              <div key={inv.id} className={styles.card}>
                <div className={styles.cardIcon}>★</div>
                <div className={styles.cardBody}>
                  <div className={styles.rest}>{inv.restaurantNaam || "Een restaurant"}</div>
                  <div className={styles.sub}>wil je als vaste ambassadeur</div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.reject}
                    disabled={working === inv.id}
                    onClick={() => respond(inv, false)}
                  >
                    Afwijzen
                  </button>
                  <button
                    className={styles.accept}
                    disabled={working === inv.id}
                    onClick={() => respond(inv, true)}
                  >
                    {working === inv.id ? "…" : "Accepteren"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
