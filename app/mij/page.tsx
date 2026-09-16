"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/appauth";
import {
  listMyApplications,
  listMyAmbassadeurInvites,
  listAllDeals,
  listRestaurants,
  listMyContent,
  getMyCreator,
} from "@/lib/appdata";
import type { Application, Deal } from "@/lib/types";
import { todayISO, formatDatumTijd } from "@/lib/format";
import { wijzigBezoek } from "@/lib/appdata";
import { dealVoortgang, dealTab, VOORTGANG_STAPPEN } from "@/lib/dealVoortgang";
import { reachBeschikbaar } from "@/lib/reachWindow";
import { isProfileComplete } from "@/lib/profileGaps";
import { creatorShare } from "@/lib/money";
import { perChannelVolgers } from "@/lib/volgers";
import { creatorTier, nextTier, TIER_LABEL, TIER_COLOR } from "@/lib/tier";
import { useT } from "@/lib/i18n";
import BottomNav from "../BottomNav";
import EmptyState from "../EmptyState";
import styles from "./mij.module.css";

export default function MijPage() {
  const router = useRouter();
  const t = useT();
  const { session, uid, loading, profile, logout } = useApp();
  const [apps, setApps] = useState<Application[]>([]);
  const [deals, setDeals] = useState<Record<string, Deal>>({});
  const [rest, setRest] = useState<Record<string, string>>({});
  const [restMeta, setRestMeta] = useState<Record<string, { stad?: string; foto?: string }>>({});
  const [tab, setTab] = useState<"lopend" | "aangevraagd" | "klaar">("lopend");
  const [editDatum, setEditDatum] = useState<string | null>(null); // application-id in datum-wijzig-modus
  const [nieuweDatum, setNieuweDatum] = useState("");
  const [nieuweTijd, setNieuweTijd] = useState("");
  const [contentCount, setContentCount] = useState(0);
  const [punten, setPunten] = useState(0);
  const [incompleet, setIncompleet] = useState(false);
  const [ambInvites, setAmbInvites] = useState(0);
  const [busy, setBusy] = useState(true);
  const [origin, setOrigin] = useState("https://app.dinely.nl");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  async function saveDatum(a: Application) {
    if (!a.id || !nieuweDatum || !nieuweTijd) return;
    await wijzigBezoek(a.id, nieuweDatum, nieuweTijd);
    setApps((p) =>
      p.map((x) =>
        x.id === a.id
          ? { ...x, bezoekDatum: nieuweDatum, bezoekTijd: nieuweTijd, datumGewijzigd: true, bezoekBevestigd: false }
          : x
      )
    );
    setEditDatum(null);
    setNieuweDatum("");
    setNieuweTijd("");
  }

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
        const [mine, d, r, myContent, cre, invs] = await Promise.all([
          listMyApplications(uid),
          listAllDeals(),
          listRestaurants(),
          listMyContent(uid),
          getMyCreator(uid),
          listMyAmbassadeurInvites(uid),
        ]);
        setAmbInvites(invs.length);
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
        const rmeta: Record<string, { stad?: string; foto?: string }> = {};
        r.forEach((x) => {
          rmap[x.id] = x.naam;
          rmeta[x.id] = { stad: x.stad, foto: x.media?.sfeer?.find(Boolean) ?? undefined };
        });
        setDeals(dmap);
        setRest(rmap);
        setRestMeta(rmeta);
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
        <h1 className={styles.title}>{t("Mijn")}</h1>
      </header>

      <div className={styles.card}>
        <div
          className={styles.avatar}
          style={profile.foto ? { backgroundImage: `url(${profile.foto})` } : undefined}
        >
          {!profile.foto && initial}
        </div>
        <div className={styles.pInfo}>
          <div className={styles.pName}>{profile.naam || t("Nog geen profiel")}</div>
          <div className={styles.pMeta}>
            {perChannelVolgers(profile.igVolgers, profile.ttVolgers) ||
              (profile.volgers > 0
                ? `${profile.regio || "—"}`
                : t("Koppel je socials om deals aan te vragen"))}
          </div>
        </div>
        <Link href={profile.naam ? "/profiel" : "/creator"} className={styles.edit}>{profile.naam ? t("Bewerk") : t("Start")}</Link>
      </div>

      {(profile.instagram || profile.tiktok) && (
        <div className={styles.socials}>
          {profile.instagram && <span className={styles.social}>Instagram · {profile.instagram}</span>}
          {profile.tiktok && <span className={styles.social}>TikTok · {profile.tiktok}</span>}
        </div>
      )}

      {ambInvites > 0 && (
        <Link href="/ambassadeur" className={styles.ambBanner}>
          <span className={styles.ambStar}>★</span>
          <span>
            {ambInvites === 1 ? t("Je hebt een ambassadeur-uitnodiging") : `${t("Je hebt")} ${ambInvites} ${t("ambassadeur-uitnodigingen")}`}
          </span>
          <span className={styles.ambArrow}>→</span>
        </Link>
      )}

      <Link href="/instellingen" className={styles.settingsRow}>
        <span className={styles.settingsLbl}>
          {t("Instellingen & notificaties")}
          {incompleet && <span className={styles.dot} aria-label={t("Profiel afmaken")} />}
        </span>
        <span className={styles.chev}>›</span>
      </Link>

      {/* Nodig een creator uit -> 15 punten zodra die zich via jouw link aanmeldt */}
      <a
        className={styles.share}
        href={`https://wa.me/?text=${encodeURIComponent(
          `${t("Ken jij een goede content creator? Meld je aan bij Dinely en verdien met gratis diners en betaalde deals bij restaurants:")} https://app.dinely.nl/?ref=${uid ?? ""}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.shareIcon} aria-hidden>↗</span>
        <span className={styles.shareText}>
          <span className={styles.shareTitle}>{t("Nodig een creator uit")}</span>
          <span className={styles.shareSub}>{t("Levert jou 15 punten op zodra iemand zich via jouw link aanmeldt.")}</span>
        </span>
        <span className={styles.shareBtn}>{t("Deel via WhatsApp")}</span>
      </a>

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
                {punten.toLocaleString("nl-NL")} {t("punten")}
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
                  ? `${t("Nog")} ${next.over} ${t("punten tot")} ${TIER_LABEL[next.tier]}. ${t("Restaurants waarderen je na elke deal.")}`
                  : t("Je hebt het hoogste niveau bereikt. Blijf top content leveren!")}
              </div>
            </div>
          </div>
        );
      })()}

      <div className={styles.stats}>
        <div className={styles.stat}><b>{apps.length}</b><span>{t("Aanvragen")}</span></div>
        <div className={styles.stat}><b>{acceptedApps.length}</b><span>{t("Gekozen")}</span></div>
        <div className={styles.stat}><b>{contentCount}</b><span>{t("Content")}</span></div>
        <div className={styles.stat}><b>€{Math.round(verdiend)}</b><span>{t("Verdiend")}</span></div>
      </div>

      {(() => {
        const isBetaald = (a: Application) => deals[a.dealId]?.beloningstype === "betaald";
        const lopend = apps.filter((a) => dealTab(a, isBetaald(a)) === "lopend");
        const aangevraagd = apps.filter((a) => dealTab(a, isBetaald(a)) === "aangevraagd");
        const klaar = apps.filter((a) => dealTab(a, isBetaald(a)) === "klaar");
        const lijst = tab === "lopend" ? lopend : tab === "aangevraagd" ? aangevraagd : klaar;

        return (
          <div className={styles.section}>
            <h2 className={styles.h2}>{t("Mijn deals")}</h2>
            <div className={styles.dealTabs}>
              {([
                ["lopend", "Lopend", lopend.length],
                ["aangevraagd", "Aangevraagd", aangevraagd.length],
                ["klaar", "Klaar", klaar.length],
              ] as const).map(([key, label, n]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.dealTab} ${tab === key ? styles.dealTabOn : ""}`}
                  onClick={() => setTab(key)}
                >
                  {t(label)} · {n}
                </button>
              ))}
            </div>

            {busy ? (
              <div className={styles.subtle}>{t("Laden…")}</div>
            ) : lijst.length === 0 ? (
              <EmptyState
                icon={tab === "klaar" ? "◔" : "✦"}
                title={tab === "lopend" ? t("Geen lopende deals") : tab === "aangevraagd" ? t("Geen openstaande aanvragen") : t("Nog niets afgerond")}
                text={tab === "aangevraagd" ? t("Vind een deal die bij je past en vraag 'm aan in een tik.") : t("Zodra je een deal doet, verschijnt 'ie hier.")}
                actionLabel={tab === "aangevraagd" ? t("Naar deals") : undefined}
                actionHref={tab === "aangevraagd" ? "/deals" : undefined}
              />
            ) : (
              <div className={styles.list}>
                {lijst.map((a) => {
                  const deal = deals[a.dealId];
                  const meta = restMeta[a.restaurantId];
                  const vp = dealVoortgang(a, deal?.beloningstype === "betaald");
                  const korting = deal?.kortingPct ?? 20;
                  const beloning = deal?.beloningstype === "betaald" ? `€ ${deal?.bedrag}` : t("Gratis diner");
                  const editing = editDatum === a.id;
                  return (
                    <div key={a.id} className={styles.dealCard2}>
                      {/* kop: cover + titel + status */}
                      <div className={styles.dc2Head}>
                        <span
                          className={styles.dc2Cover}
                          style={meta?.foto ? { backgroundImage: `url(${meta.foto})` } : undefined}
                        >
                          {!meta?.foto && "Dine"}
                        </span>
                        <div className={styles.dc2Info}>
                          <div className={styles.dc2Title}>{deal?.titel ?? "Deal"}</div>
                          <div className={styles.dc2Rest}>
                            {rest[a.restaurantId] ?? "Restaurant"}
                            {meta?.stad ? ` · ${meta.stad}` : ""}
                          </div>
                          <span className={`${styles.dc2Pill} ${styles[`fase_${vp.fase}`] ?? ""}`}>
                            {vp.fase === "aangevraagd" ? t("Wacht op restaurant")
                              : vp.fase === "gewijzigd" ? t("Wacht op herbevestiging")
                              : vp.fase === "gepland" ? t("Ingepland")
                              : vp.fase === "teDoen" ? t("Jij bent aan zet")
                              : t("Afgerond ✓")}
                          </span>
                        </div>
                        <span className={styles.dc2Reward}>{beloning}</span>
                      </div>

                      {/* tijdlijn met 5 stappen */}
                      <div className={styles.timeline}>
                        {VOORTGANG_STAPPEN.map((s, i) => {
                          const done = i < vp.gedaan;
                          const current = i === vp.gedaan && !vp.klaar;
                          return (
                            <div key={s} className={styles.tlStep}>
                              {i > 0 && <span className={`${styles.tlLine} ${done ? styles.tlLineOn : ""}`} />}
                              <span className={`${styles.tlDot} ${done ? styles.tlDotDone : ""} ${current ? styles.tlDotNow : ""}`}>
                                {done ? "✓" : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.tlCaption}>
                        {vp.klaar
                          ? t("Afgerond ✓")
                          : `${t("Stap")} ${vp.gedaan + 1} ${t("van")} 5 · ${t(VOORTGANG_STAPPEN[vp.gedaan])}`}
                      </div>

                      {/* instructies wanneer de creator nog langs moet */}
                      {(vp.fase === "gepland" || vp.fase === "gewijzigd") && (
                        <div className={styles.instr}>
                          {a.datumGewijzigd ? (
                            <div className={styles.instrNotice}>
                              {t("Datum gewijzigd — het restaurant moet je nieuwe moment nog bevestigen.")}
                            </div>
                          ) : (
                            <div className={styles.instrWhen}>
                              {t("Je wordt verwacht op")} <b>{formatDatumTijd(a.bezoekDatum ?? "", a.bezoekTijd)}</b>.
                            </div>
                          )}

                          {a.linkCode && (
                            <div className={styles.instrBlock}>
                              <div className={styles.instrLbl}>{t("Zet je reserveringslink in je story")}</div>
                              <div className={styles.shareRow}>
                                <input
                                  readOnly
                                  className={styles.shareInput}
                                  value={`${origin.replace(/^https?:\/\//, "")}/b/${a.linkCode}`}
                                  onFocus={(e) => e.currentTarget.select()}
                                />
                                <button type="button" className={styles.shareBtn} onClick={() => copyLink(a.linkCode!)}>
                                  {copied === a.linkCode ? t("Gekopieerd ✓") : t("Kopieer")}
                                </button>
                              </div>
                              <p className={styles.instrHint}>{t("Zo kunnen je volgers met")} {korting}% {t("korting reserveren bij")} {rest[a.restaurantId] ?? t("het restaurant")}.</p>
                            </div>
                          )}

                          {deal?.gevraagd && (
                            <div className={styles.instrRow}>
                              <span className={styles.instrRowLbl}>{t("Plaats")}</span>
                              <b>{deal.gevraagd}</b>
                            </div>
                          )}
                          {deal?.inhoud && deal.inhoud.length > 0 && (
                            <div className={styles.instrRow}>
                              <span className={styles.instrRowLbl}>{t("Laat zien")}</span>
                              <b>{deal.inhoud.join(", ")}</b>
                            </div>
                          )}
                          {deal?.brandId && (Number(deal.aantalStories) > 0 || Number(deal.aantalPosts) > 0) && (
                            <div className={styles.instrRow}>
                              <span className={styles.instrRowLbl}>{t("Content")}</span>
                              <b>
                                {Number(deal.aantalStories) || 0} {t("stories en")} {Number(deal.aantalPosts) || 0} {Number(deal.aantalPosts) === 1 ? t("post") : t("posts")}
                              </b>
                            </div>
                          )}
                          <div className={styles.instrRow}>
                            <span className={styles.instrRowLbl}>Tag</span>
                            <b>
                              {deal?.brandId
                                ? `@dinely, ${deal.brandNaam ? `@${deal.brandNaam}, ` : ""}@${rest[a.restaurantId] ?? t("het restaurant")}`
                                : t("@dinely op Instagram")}
                            </b>
                          </div>

                          {/* Bij een brand-deal staat de datum vast; niet wijzigbaar. */}
                          {deal?.brandId ? null : editing ? (
                            <div className={styles.dateEdit}>
                              <input className={styles.dateInput} type="date" min={todayISO()} value={nieuweDatum} onChange={(e) => setNieuweDatum(e.target.value)} />
                              <input className={styles.dateInput} type="time" value={nieuweTijd} onChange={(e) => setNieuweTijd(e.target.value)} />
                              <button className={styles.dateSave} disabled={!nieuweDatum || !nieuweTijd} onClick={() => saveDatum(a)}>{t("Opslaan")}</button>
                              <button className={styles.dateCancel} onClick={() => setEditDatum(null)}>{t("Annuleer")}</button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.dateChangeBtn}
                              onClick={() => { setEditDatum(a.id ?? null); setNieuweDatum(a.bezoekDatum ?? ""); setNieuweTijd(a.bezoekTijd ?? ""); }}
                            >
                              {t("Datum of tijd wijzigen")}
                            </button>
                          )}
                        </div>
                      )}

                      {/* acties wanneer het bezoek is bevestigd */}
                      {vp.fase === "teDoen" && (
                        <>
                        <div className={styles.tlHint}>
                          {t("Upload je content")} <b>{t("binnen 48 uur")}</b> {t("na je bezoek. Je statistieken lever je")}
                          <b> {t("daarna")}</b> {t("aan, zodat het restaurant het bereik en resultaat ziet.")}
                        </div>
                        <div className={styles.dealActions}>
                          {a.reviewed ? (
                            <span className={`${styles.badge} ${styles.ok}`}>{t("Beoordeeld ✓")}</span>
                          ) : (
                            <Link href={`/review/${a.id}`} className={styles.actBtn}>Review</Link>
                          )}
                          {a.contentPosted ? (
                            <span className={`${styles.badge} ${styles.ok}`}>{t("Content ✓")}</span>
                          ) : (
                            <Link href={`/content/${a.id}`} className={styles.actBtnGold}>{t("Plaats content")}</Link>
                          )}
                          {a.reachSubmitted ? (
                            <span className={`${styles.badge} ${styles.ok}`}>{t("Bereik ✓")}</span>
                          ) : reachBeschikbaar(a.contentPosted, a.contentPostedAt?.seconds) ? (
                            <Link href={`/bereik/${a.id}`} className={styles.actBtnGold}>{t("Bereik doorgeven")}</Link>
                          ) : (
                            <span className={styles.tlHint}>{t("Bereik doorgeven kan vanaf 48 uur nadat je content hebt geplaatst")}</span>
                          )}
                        </div>
                        </>
                      )}

                      {vp.fase === "aangevraagd" && a.status === "afgewezen" && (
                        <div className={styles.dealActions}>
                          <span className={`${styles.badge} ${styles.no}`}>{t("Deze keer niet")}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      <button className={styles.logout} onClick={async () => { logout(); router.replace("/login"); }}>
        {t("Uitloggen")}
      </button>

      <BottomNav />
    </div>
  );
}
