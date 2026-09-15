"use client";

import { useI18n } from "@/lib/i18n";
import styles from "./langtoggle.module.css";

// Twee vlaggetjes (NL / EN). Klikken zet de taal van de hele app om.
export default function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`${styles.wrap} ${className}`} role="group" aria-label="Taal / Language">
      <button
        type="button"
        className={`${styles.flag} ${lang === "nl" ? styles.on : ""}`}
        onClick={() => setLang("nl")}
        aria-pressed={lang === "nl"}
        aria-label="Nederlands"
        title="Nederlands"
      >
        🇳🇱
      </button>
      <button
        type="button"
        className={`${styles.flag} ${lang === "en" ? styles.on : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        aria-label="English"
        title="English"
      >
        🇬🇧
      </button>
    </div>
  );
}
