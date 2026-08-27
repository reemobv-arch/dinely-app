"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import { getMyCreator } from "@/lib/appdata";
import Splash from "../Splash";
import styles from "./start.module.css";

export default function StartPage() {
  const router = useRouter();
  const { session, uid, loading } = useApp();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  // Bestaande creators niet opnieuw laten onboarden:
  // - goedgekeurd -> direct de app in (Ontdek)
  // - in behandeling/afgewezen -> wachtscherm
  // - nog geen profiel (nieuw) -> op /start blijven en het welkomstscherm tonen
  useEffect(() => {
    if (!uid) return;
    let actief = true;
    (async () => {
      try {
        const c = await getMyCreator(uid);
        if (!actief) return;
        if (c && c.status === "approved") return router.replace("/discover");
        if (c) return router.replace("/wachten");
      } catch {
        /* offline: laat het welkomstscherm zien */
      }
      if (actief) setChecking(false); // nieuw: toon "Ik ben creator"
    })();
    return () => {
      actief = false;
    };
  }, [uid, router]);

  // Splash zolang we nog niet weten waar je heen moet (voorkomt zwart scherm
  // en een korte flits van het welkomstscherm voor bestaande creators).
  if (loading || !session || checking) return <Splash />;

  return (
    <div className={`screen ${styles.wrap}`}>
      <header className={styles.head}>
        <div className={styles.brand}>Dine<span>ly</span></div>
      </header>

      <div className={styles.intro}>
        <span className="eyebrow">Voor creators</span>
        <h1 className={styles.h1}>Welkom bij<br />Dinely.</h1>
      </div>

      <div className={styles.cards}>
        <Link href="/creator" className={`${styles.card} ${styles.creator}`}>
          <div className={styles.cardInner}>
            <h2>Ik ben creator</h2>
            <p>Koppel je socials en verdien met deals bij restaurants.</p>
            <span className={styles.go}>Aan de slag <span className={styles.arw}>→</span></span>
          </div>
        </Link>
      </div>
    </div>
  );
}
