"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import {
  listMyApplications,
  listAllDeals,
  listRestaurants,
  listMyContent,
} from "@/lib/appdata";
import type { Application, Deal } from "@/lib/types";
import { formatNL, todayISO } from "@/lib/format";
import BottomNav from "../BottomNav";
import styles from "./mij.module.css";

const STATUS: Record<string, { label: string; cls: string }> = {
  wacht: { label: "In afwachting", cls: "wacht" },
  geaccepteerd: { label: "Geaccepteerd", cls: "ok" },
  afgewezen: { label: "Afgewezen", cls: "no" },
};

export default function MijPage() {
  const router = useRouter();
  const { session, uid, loading, profile, logout } = useApp();
  const [apps, setApps] = useState<Application[]>([]);
  const [deals, setDeals] = useState<Record<string, Deal>>({});
  const [rest, setRest] = useState<Record<string, string>>({});
  const [contentCount, setContentCount] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setBusy(true);
      try {
        const [mine, d, r, myContent] = await Promise.all([
          listMyApplications(uid),
          listAllDeals(),
          listRestaurants(),
          listMyContent(uid),
        ]);
        const dmap: Record<string, Deal> = {};
        d.forEach((x) => { if (x.id) dmap[x.id] = x; });
        const rmap: Record<string, string> = {};
        r.forEach((x) => (rmap[x.id] = x.naam));
        setDeals(dmap);
        setRest(rmap);
        setContentCount(myContent.reduce((s, c) => s + (c.media?.length ?? 0), 0));
        setApps(
          mine.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        );
      } finally {
        setBusy(false);
      }
    })();
  }, [uid]);

  const initial = (profile.naam || profile.instagram || "?").replace(/[@.]/g, "").slice(0, 1).toUpperCase();
  const acceptedApps = apps.filter((a) => a.status === "geaccepteerd");
  const verdiend = acceptedApps.reduce((s, a) => {
    const d = deals[a.dealId];
    return s + (d && d.beloningstype === "betaald" ? Math.round(d.bedrag * 0.85) : 0);
  }, 0);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <h1 className={styles.title}>Mijn</h1>
      </header>

      <div className={styles.card}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.pInfo}>
          <div className={styles.pName}>{profile.naam || "Nog geen profiel"}</div>
          <div className={styles.pMeta}>
            {profile.volgers > 0
              ? `${profile.volgers.toLocaleString("nl-NL")} volgers · ${profile.regio || "—"}`
              : "Koppel je socials om te solliciteren"}
          </div>
        </div>
        <Link href="/creator" className={styles.edit}>{profile.naam ? "Bewerk" : "Start"}</Link>
      </div>

      {(profile.instagram || profile.tiktok) && (
        <div className={styles.socials}>
          {profile.instagram && <span className={styles.social}>Instagram · {profile.instagram}</span>}
          {profile.tiktok && <span className={styles.social}>TikTok · {profile.tiktok}</span>}
        </div>
      )}

      <Link href="/instellingen" className={styles.settingsRow}>
        <span>Instellingen &amp; notificaties</span>
        <span className={styles.chev}>›</span>
      </Link>

      <div className={styles.stats}>
        <div className={styles.stat}><b>{apps.length}</b><span>Sollicitaties</span></div>
        <div className={styles.stat}><b>{acceptedApps.length}</b><span>Geaccepteerd</span></div>
        <div className={styles.stat}><b>{contentCount}</b><span>Content</span></div>
        <div className={styles.stat}><b>€{verdiend}</b><span>Verdiend</span></div>
      </div>

      {(() => {
        const accepted = apps.filter((a) => a.status === "geaccepteerd");
        const others = apps.filter((a) => a.status !== "geaccepteerd");
        const today = todayISO();
        return (
          <>
            {accepted.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.h2}>Mijn deals</h2>
                <div className={styles.list}>
                  {accepted.map((a) => {
                    const deal = deals[a.dealId];
                    const datum = a.bezoekDatum ?? "";
                    const bevestigd = a.bezoekBevestigd === true;
                    const past = !!datum && datum <= today;
                    const done = !!a.reviewed && !!a.contentPosted;
                    const actionsOpen = bevestigd && past && !done;
                    const grey = !done && !actionsOpen;
                    return (
                      <div key={a.id} className={`${styles.dealCard} ${grey ? styles.grey : ""}`}>
                        <div className={styles.appInfo}>
                          <div className={styles.appDeal}>{deal?.titel ?? "Deal"}</div>
                          <div className={styles.appRest}>{rest[a.restaurantId] ?? "Restaurant"}</div>
                          {datum && <div className={styles.dealDate}>Bezoek: {formatNL(datum)}</div>}
                        </div>
                        {done ? (
                          <div className={styles.dealActions}>
                            <span className={`${styles.badge} ${styles.ok}`}>Afgerond ✓</span>
                          </div>
                        ) : !bevestigd ? (
                          <div className={styles.dealActions}>
                            <span className={styles.badge}>Wacht op bevestiging</span>
                          </div>
                        ) : !past ? (
                          <div className={styles.dealActions}>
                            <span className={`${styles.badge} ${styles.ok}`}>Bezoek bevestigd ✓</span>
                          </div>
                        ) : (
                          <div className={styles.dealActions}>
                            {a.reviewed ? (
                              <span className={`${styles.badge} ${styles.ok}`}>Beoordeeld ✓</span>
                            ) : (
                              <Link href={`/review/${a.id}`} className={styles.actBtn}>Review</Link>
                            )}
                            {a.contentPosted ? (
                              <span className={`${styles.badge} ${styles.ok}`}>Content ✓</span>
                            ) : (
                              <Link href={`/content/${a.id}`} className={styles.actBtnGold}>Plaats content</Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.h2}>Mijn sollicitaties</h2>
              {busy ? (
                <div className={styles.subtle}>Laden…</div>
              ) : others.length === 0 ? (
                <div className={styles.empty}>
                  {accepted.length > 0
                    ? "Geen openstaande sollicitaties."
                    : <>Je hebt nog niet gesolliciteerd. Ga naar <Link href="/deals" className={styles.link}>Deals</Link> om te beginnen.</>}
                </div>
              ) : (
                <div className={styles.list}>
                  {others.map((a) => {
                    const deal = deals[a.dealId];
                    const st = STATUS[a.status] ?? STATUS.wacht;
                    return (
                      <div key={a.id} className={styles.appRow}>
                        <div className={styles.appInfo}>
                          <div className={styles.appDeal}>{deal?.titel ?? "Deal"}</div>
                          <div className={styles.appRest}>{rest[a.restaurantId] ?? "Restaurant"}</div>
                        </div>
                        <span className={`${styles.badge} ${styles[st.cls]}`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        );
      })()}

      <button className={styles.logout} onClick={async () => { logout(); router.replace("/login"); }}>
        Uitloggen
      </button>

      <BottomNav />
    </div>
  );
}
