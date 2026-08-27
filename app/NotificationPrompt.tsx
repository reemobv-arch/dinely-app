"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/appauth";
import { enablePush, DEFAULT_PREFS } from "@/lib/push";
import styles from "./notificationPrompt.module.css";

const DISMISS_KEY = "dinely-app:notifPromptDismissed";

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

    // Alleen als er nog geen keuze is gemaakt, en niet eerder weggeklikt.
    if (Notification.permission !== "default") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
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
    dismiss();
  }
  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
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
            <button className={styles.later} onClick={dismiss} disabled={busy}>
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
