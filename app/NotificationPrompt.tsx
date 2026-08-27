"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/appauth";
import { enablePush, DEFAULT_PREFS } from "@/lib/push";
import styles from "./notificationPrompt.module.css";

const COUNT_KEY = "dinely-app:notifLaterCount"; // hoe vaak "Later" is getikt
const SNOOZE_KEY = "dinely-app:notifSnoozeUntil"; // ms-timestamp; 0 = volgende opening weer
const DAY = 24 * 60 * 60 * 1000;

// Vraagt meteen (na het openen vanaf het beginscherm) om meldingen aan te zetten.
// Op iOS mag de systeempopup alleen na een tik komen — daarom tonen we eerst dit
// kaartje, en pas bij "Zet aan" verschijnt de systeem-toestemming.
export default function NotificationPrompt() {
  const { session } = useApp();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (typeof window === "undefined" || typeof Notification === "undefined") return;

    // Alleen als de app op het beginscherm staat (geïnstalleerde PWA / standalone).
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone) return;

    // Alleen als er nog geen keuze is gemaakt (aan/uit).
    if (Notification.permission !== "default") return;

    // Snooze: na "Later" niet meteen weer. 0 = volgende opening weer tonen.
    try {
      const until = Number(localStorage.getItem(SNOOZE_KEY) || 0);
      if (until && Date.now() < until) return;
    } catch {
      /* negeer */
    }

    const t = setTimeout(() => setShow(true), 700);
    return () => clearTimeout(t);
  }, [session]);

  async function enable() {
    setBusy(true);
    await enablePush(DEFAULT_PREFS); // opent de systeempopup (na deze tik)
    setBusy(false);
    // Niet meer opnieuw vragen (permissie is nu granted/denied, of anders even rust).
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 7 * DAY));
    } catch {
      /* negeer */
    }
    setShow(false);
  }

  function later() {
    let count = 0;
    try {
      count = Number(localStorage.getItem(COUNT_KEY) || 0) + 1;
      localStorage.setItem(COUNT_KEY, String(count));
      // 1e keer: volgende opening weer (snooze 0). Daarna: pas de dag erna.
      localStorage.setItem(SNOOZE_KEY, String(count >= 2 ? Date.now() + DAY : 0));
    } catch {
      /* negeer */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className={styles.wrap} role="dialog" aria-label="Meldingen aanzetten">
      <div className={styles.card}>
        <div className={styles.bell}>🔔</div>
        <div className={styles.body}>
          <div className={styles.title}>Zet meldingen aan</div>
          <p className={styles.text}>
            Zo hoor je meteen als je bent goedgekeurd of een deal binnenkrijgt.
          </p>
          <div className={styles.actions}>
            <button className="btn btn-gold" onClick={enable} disabled={busy}>
              {busy ? "Bezig…" : "Zet aan"}
            </button>
            <button className={styles.later} onClick={later} disabled={busy}>
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
