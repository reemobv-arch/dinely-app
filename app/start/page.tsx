"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import { getMyCreator } from "@/lib/appdata";
import styles from "./start.module.css";

export default function StartPage() {
  const router = useRouter();
  const { session, uid, loading } = useApp();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  // Wacht een creator nog op goedkeuring? Dan naar het wachtscherm.
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const c = await getMyCreator(uid);
      if (c && c.status === "pending") router.replace("/wachten");
    })();
  }, [uid, router]);

  if (loading || !session) return null;

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
