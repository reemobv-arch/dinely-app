"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { getMyCreator } from "@/lib/appdata";
import { useT } from "@/lib/i18n";
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
  const t = useT();
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
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        const dot = tab.href === "/mij" && incompleet;
        return (
          <Link key={tab.href} href={tab.href} className={`${styles.tab} ${active ? styles.on : ""}`}>
            <span className={styles.icon}>
              {tab.icon}
              {dot && <span className={styles.dot} aria-label={t("Profiel afmaken")} />}
            </span>
            <span className={styles.lbl}>{t(tab.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
