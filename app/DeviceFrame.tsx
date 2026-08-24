"use client";

import { useEffect } from "react";

// Op desktop tonen we de app in een iPhone-frame. Het hele toestel schaalt
// automatisch mee zodat het altijd volledig in beeld past (zoals handmatig
// uitzoomen). Op mobiel is het frame een no-op (display:contents in CSS).
export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => {
      const s = Math.min((window.innerHeight - 20) / 844, (window.innerWidth - 20) / 390, 1);
      el.style.setProperty("--device-scale", String(s));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return (
    <div className="device-frame">
      <div className="device">
        <span className="device-island" aria-hidden />
        <div className="app-shell">{children}</div>
      </div>
    </div>
  );
}
