"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./bottomnav.module.css";

const TABS = [
  { href: "/discover", label: "Ontdek", icon: "⌖" },
  { href: "/deals", label: "Deals", icon: "✦" },
  { href: "/mij", label: "Mijn", icon: "◍" },
];

export default function BottomNav() {
  const pathname = usePathname();
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
