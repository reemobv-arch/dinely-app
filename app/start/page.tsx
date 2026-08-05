"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import styles from "./start.module.css";

export default function StartPage() {
  const router = useRouter();
  const { session, loading } = useApp();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  if (loading || !session) return null;

  return (
    <div className={`screen ${styles.wrap}`}>
      <header className={styles.head}>
        <div className={styles.brand}>Dinel<span>y</span></div>
      </header>

      <div className={styles.intro}>
        <span className="eyebrow">Amsterdam</span>
        <h1 className={styles.h1}>Waar ben je<br />naar op zoek?</h1>
      </div>

      <div className={styles.cards}>
        <Link href="/discover" className={`${styles.card} ${styles.discover}`}>
          <div className={styles.cardInner}>
            <span className={styles.num}>01</span>
            <h2>Ontdek restaurants</h2>
            <p>Zie de sfeer van binnenuit en vind je volgende tafel.</p>
            <span className={styles.go}>Op de kaart <span className={styles.arw}>→</span></span>
          </div>
        </Link>

        <Link href="/creator" className={`${styles.card} ${styles.creator}`}>
          <div className={styles.cardInner}>
            <span className={styles.num}>02</span>
            <h2>Ik ben creator</h2>
            <p>Koppel je socials en verdien met deals bij restaurants.</p>
            <span className={styles.go}>Aan de slag <span className={styles.arw}>→</span></span>
          </div>
        </Link>
      </div>
    </div>
  );
}
