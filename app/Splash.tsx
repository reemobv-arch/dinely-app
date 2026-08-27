"use client";

import { useEffect, useState } from "react";
import styles from "./splash.module.css";

const LINES = [
  "De tafel wordt gedekt…",
  "Bord scherp in beeld…",
  "Deals worden opgewarmd…",
  "Nog even de garnering…",
];

// Volledig scherm-splash tijdens het opstarten (auth + profiel laden).
// Een telefoontje dat een foto maakt van een bord eten, met een flits.
export default function Splash() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.wrap} role="status" aria-label="Bezig met laden">
      <div className={styles.stage}>
        <svg className={styles.scene} viewBox="0 0 200 200" aria-hidden>
          {/* bord met eten */}
          <g className={styles.plate}>
            <ellipse cx="100" cy="150" rx="52" ry="16" fill="#1a1510" />
            <ellipse cx="100" cy="147" rx="46" ry="13" fill="#241d15" stroke="#3b342a" strokeWidth="1.5" />
            {/* burger / stapel */}
            <ellipse cx="100" cy="146" rx="22" ry="6" fill="#5b3a1e" />
            <rect x="80" y="138" width="40" height="6" rx="3" fill="#77be9b" />
            <ellipse cx="100" cy="137" rx="21" ry="6" fill="#7a4a24" />
            <path d="M79 132 q21 -14 42 0 q-3 4 -21 4 q-18 0 -21 -4Z" fill="#c9a24b" />
            <circle cx="93" cy="129" r="1.2" fill="#fff6e0" />
            <circle cx="103" cy="128" r="1.2" fill="#fff6e0" />
            <circle cx="110" cy="130" r="1.2" fill="#fff6e0" />
          </g>

          {/* stoom */}
          <g className={styles.steam}>
            <path d="M92 122 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="#b4a797" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M108 122 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="#b4a797" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          </g>

          {/* telefoon */}
          <g className={styles.phone}>
            <rect x="128" y="34" width="46" height="86" rx="12" fill="#0f0c08" stroke="#c9a24b" strokeWidth="2" />
            <rect x="134" y="42" width="34" height="60" rx="5" fill="#241d15" />
            {/* zoeker: klein bordje op scherm */}
            <ellipse cx="151" cy="82" rx="13" ry="5" fill="#3b342a" />
            <ellipse cx="151" cy="80" rx="8" ry="3" fill="#7a4a24" />
            {/* cameralens */}
            <circle cx="151" cy="112" r="4" fill="#0b0906" stroke="#c9a24b" strokeWidth="1.5" />
          </g>

          {/* flits */}
          <g className={styles.flash}>
            <circle cx="110" cy="132" r="10" fill="#fff6e0" />
            <g stroke="#fff6e0" strokeWidth="2" strokeLinecap="round">
              <line x1="110" y1="112" x2="110" y2="120" />
              <line x1="110" y1="152" x2="110" y2="144" />
              <line x1="90" y1="132" x2="98" y2="132" />
              <line x1="130" y1="132" x2="122" y2="132" />
              <line x1="96" y1="118" x2="101" y2="123" />
              <line x1="124" y1="146" x2="119" y2="141" />
              <line x1="124" y1="118" x2="119" y2="123" />
              <line x1="96" y1="146" x2="101" y2="141" />
            </g>
          </g>
        </svg>

        <div className={styles.brand}>
          Dine<span>ly</span>
        </div>
        <div className={styles.line}>{LINES[i]}</div>
      </div>
    </div>
  );
}
