"use client";

import { useEffect } from "react";

// Vangt een uitnodigings-ref (?ref=<creator-uid>) op bij binnenkomst en bewaart
// die, zodat de uitnodiger 15 punten krijgt zodra deze bezoeker een creator-
// account aanmaakt. We halen de ref daarna uit de URL zodat-ie niet blijft staan.
export default function RefCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref && /^[A-Za-z0-9_-]{6,}$/.test(ref)) {
        localStorage.setItem("dinely:ref", ref);
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch {
      /* ref opvangen mag nooit iets breken */
    }
  }, []);
  return null;
}
