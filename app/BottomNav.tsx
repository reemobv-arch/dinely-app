"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/appauth";
import styles from "./bottomnav.module.css";

const TABS = [
  { href: "/discover", label: "Ontdek", icon: "⌖" },
  { href: "/feed", label: "Feed", icon: "▶" },
  { href: "/deals", label: "Deals", icon: "✦" },
  { href: "/mij", label: "Mijn", icon: "◍" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useApp();
  // De nav is alleen voor creators. Een restaurantzoeker (geen creator-profiel)
  // ziet 'm niet; voor hen is Ontdek genoeg.
  if (!profile?.naam) return null;
  return (
    <nav className={styles.bar}>
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${active ? styles.on : ""}`}>
            <span className={styles.icon}>{t.icon}</span>
            <span className={styles.lbl}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
