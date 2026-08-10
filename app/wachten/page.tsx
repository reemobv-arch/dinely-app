"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { getMyCreator } from "@/lib/appdata";
import styles from "./wachten.module.css";

export default function WachtenPage() {
  const router = useRouter();
  const { session, uid, loading } = useApp();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  // Al goedgekeurd? Dan door naar de deals.
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const c = await getMyCreator(uid);
      if (c && c.status !== "pending") router.replace("/deals");
    })();
  }, [uid, router]);

  return (
    <div className={styles.wrap}>
      <div className={styles.grad} />
      <div className={styles.center}>
        <div className={styles.brand}>Dinel<span>y</span></div>
        <h1 className={styles.title}>Your account is waiting for Dinely&apos;s approval.</h1>
        <p className={styles.sub}>
          We laten het je weten via mail én een melding zodra je bent goedgekeurd.
        </p>
        <Link href="/discover" className={styles.link}>Intussen restaurants ontdekken →</Link>
      </div>
    </div>
  );
}
