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
  getMyCreator,
} from "@/lib/appdata";
import type { Application, Deal } from "@/lib/types";
import { formatNL, todayISO } from "@/lib/format";
import { isProfileComplete } from "@/lib/profileGaps";
import { creatorShare } from "@/lib/money";
import { perChannelVolgers } from "@/lib/volgers";
import { creatorTier, nextTier, TIER_LABEL, TIER_COLOR } from "@/lib/tier";
import BottomNav from "../BottomNav";
import EmptyState from "../EmptyState";
import styles from "./mij.module.css";

const STATUS: Record<string, { label: string; cls: string }> = {
  wacht: { label: "Aangevraagd", cls: "wacht" },
  geaccepteerd: { label: "Je bent gekozen ✓", cls: "ok" },
  afgewezen: { label: "Deze keer niet", cls: "no" },
};

export default function MijPage() {
  const router = useRouter();
  const { session, uid, loading, profile, logout } = useApp();
  const [apps, setApps] = useState<Application[]>([]);
  const [deals, setDeals] = useState<Record<string, Deal>>({});
  const [rest, setRest] = useState<Record<string, string>>({});
  const [contentCount, setContentCount] = useState(0);
  const [punten, setPunten] = useState(0);
  const [incompleet, setIncompleet] = useState(false);
  const [busy, setBusy] = useState(true);
  const [origin, setOrigin] = useState("https://app.dinely.nl");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(`${origin}/b/${code}`);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
    } catch {
      /* clipboard kan geblokkeerd zijn; de link staat zichtbaar in het veld */
    }
  }

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setBusy(true);
      try {
        const [mine, d, r, myContent, cre] = await Promise.all([
          listMyApplications(uid),
          listAllDeals(),
          listRestaurants(),
          listMyContent(uid),
          getMyCreator(uid),
        ]);
        setPunten(cre?.punten ?? 0);
        setIncompleet(
          !isProfileComplete({
            iban: cre?.iban,
            ibanNaam: cre?.ibanNaam,
            instagram: profile.instagram,
            tiktok: profile.tiktok,
          })
        );
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
    return s + (d && d.beloningstype === "betaald" ? creatorShare(d.bedrag) : 0);
  }, 0);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <h1 className={styles.title}>Mijn</h1>
      </header>

      <div className={styles.card}>
        <div
          className={styles.avatar}
          style={profile.foto ? { backgroundImage: `url(${profile.foto})` } : undefined}
        >
          {!profile.foto && initial}
        </div>
        <div className={styles.pInfo}>
          <div className={styles.pName}>{profile.naam || "Nog geen profiel"}</div>
          <div className={styles.pMeta}>
            {perChannelVolgers(profile.igVolgers, profile.ttVolgers) ||
              (profile.volgers > 0
                ? `${profile.regio || "—"}`
                : "Koppel je socials om deals aan te vragen")}
          </div>
        </div>
        <Link href={profile.naam ? "/profiel" : "/creator"} className={styles.edit}>{profile.naam ? "Bewerk" : "Start"}</Link>
      </div>

      {(profile.instagram || profile.tiktok) && (
        <div className={styles.socials}>
          {profile.instagram && <span className={styles.social}>Instagram · {profile.instagram}</span>}
          {profile.tiktok && <span className={styles.social}>TikTok · {profile.tiktok}</span>}
        </div>
      )}

      <Link href="/instellingen" className={styles.settingsRow}>
        <span className={styles.settingsLbl}>
          Instellingen &amp; notificaties
          {incompleet && <span className={styles.dot} aria-label="Profiel afmaken" />}
        </span>
        <span className={styles.chev}>›</span>
      </Link>

      {(() => {
        const tier = creatorTier(punten);
        const next = nextTier(punten);
        return (
          <div className={styles.points}>
            <div
              className={styles.pointsStar}
              style={tier ? { color: TIER_COLOR[tier] } : undefined}
            >
              ★
            </div>
            <div className={styles.pointsInfo}>
              <div className={styles.pointsVal}>
                {punten.toLocaleString("nl-NL")} punten
                {tier && (
                  <span
                    className={styles.tierChip}
                    style={{ color: TIER_COLOR[tier], borderColor: TIER_COLOR[tier] }}
                  >
                    {TIER_LABEL[tier]}
                  </span>
                )}
              </div>
              <div className={styles.pointsSub}>
                {next
                  ? `Nog ${next.over} punten tot ${TIER_LABEL[next.tier]}. Restaurants waarderen je na elke deal.`
                  : "Je hebt het hoogste niveau bereikt. Blijf top content leveren!"}
              </div>
            </div>
          </div>
        );
      })()}

      <div className={styles.stats}>
        <div className={styles.stat}><b>{apps.length}</b><span>Aanvragen</span></div>
        <div className={styles.stat}><b>{acceptedApps.length}</b><span>Gekozen</span></div>
        <div className={styles.stat}><b>{contentCount}</b><span>Content</span></div>
        <div className={styles.stat}><b>€{Math.round(verdiend)}</b><span>Verdiend</span></div>
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
                    const korting = deal?.kortingPct ?? 20;
                    return (
                      <div key={a.id} className={styles.dealWrap}>
                      <div className={`${styles.dealCard} ${grey ? styles.grey : ""}`}>
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

                      {a.linkCode && (
                        <div className={styles.share}>
                          <div className={styles.shareLbl}>
                            Jouw deel-link · gasten krijgen {korting}% korting
                          </div>
                          <div className={styles.shareRow}>
                            <input
                              readOnly
                              className={styles.shareInput}
                              value={`${origin.replace(/^https?:\/\//, "")}/b/${a.linkCode}`}
                              onFocus={(e) => e.currentTarget.select()}
                            />
                            <button
                              type="button"
                              className={styles.shareBtn}
                              onClick={() => copyLink(a.linkCode!)}
                            >
                              {copied === a.linkCode ? "Gekopieerd ✓" : "Kopieer"}
                            </button>
                          </div>
                          <p className={styles.shareHint}>
                            Zet 'm in je story: “Kom ook eten, {korting}% korting via mijn link.”
                          </p>
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.h2}>Mijn aanvragen</h2>
              {busy ? (
                <div className={styles.subtle}>Laden…</div>
              ) : others.length === 0 ? (
                accepted.length > 0 ? (
                  <EmptyState
                    icon="◔"
                    title="Alles afgehandeld"
                    text="Je hebt geen openstaande aanvragen meer. Je gekozen deals staan hierboven."
                  />
                ) : (
                  <EmptyState
                    icon="✦"
                    title="Nog geen deals aangevraagd"
                    text="Vind een deal die bij je past en vraag 'm aan in een tik."
                    actionLabel="Naar deals"
                    actionHref="/deals"
                  />
                )
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
