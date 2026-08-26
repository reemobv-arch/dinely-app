"use client";

import { useEffect, useState } from "react";
import styles from "./waiting.module.css";

// Wacht-indicator: een draaiende spinner met een oplopende secondenteller.
// De teller loopt zolang het component gemonteerd is (dus zolang je wacht).
export default function Waiting({ label = "Bezig" }: { label?: string }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={styles.wrap}>
      <span className={styles.spinner} aria-hidden />
      {label}… {sec}s
    </span>
  );
}
