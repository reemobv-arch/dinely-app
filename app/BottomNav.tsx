"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { getMyCreator } from "@/lib/appdata";
import styles from "./bottomnav.module.css";

const TABS = [
  { href: "/discover", label: "Ontdek", icon: "⌖" },
  { href: "/feed", label: "Feed", icon: "▶" },
  { href: "/deals", label: "Deals", icon: "✦" },
  { href: "/mij", label: "Mijn", icon: "◍" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile, uid } = useApp();
  const [incompleet, setIncompleet] = useState(false);

  useEffect(() => {
    if (!uid || !profile?.naam) return;
    getMyCreator(uid)
      .then((c) => {
        const geenIban = !c?.iban || !c?.ibanNaam;
        const geenSocials = !profile.instagram && !profile.tiktok;
        setIncompleet(geenIban || geenSocials);
      })
      .catch(() => {});
  }, [uid, profile?.naam, profile?.instagram, profile?.tiktok]);

  // De nav is alleen voor creators. Een restaurantzoeker (geen creator-profiel)
  // ziet 'm niet; voor hen is Ontdek genoeg.
  if (!profile?.naam) return null;
  return (
    <nav className={styles.bar}>
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        const dot = t.href === "/mij" && incompleet;
        return (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${active ? styles.on : ""}`}>
            <span className={styles.icon}>
              {t.icon}
              {dot && <span className={styles.dot} aria-label="Profiel afmaken" />}
            </span>
            <span className={styles.lbl}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
