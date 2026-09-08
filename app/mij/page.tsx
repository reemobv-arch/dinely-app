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
import { isProfileComplete } from "@/lib/profileGaps";
import { creatorShare } from "@/lib/money";
import { perChannelVolgers } from "@/lib/volgers";
import { creatorTier, nextTier, TIER_LABEL, TIER_COLOR } from "@/lib/tier";
import BottomNav from "../BottomNav";
import EmptyState from "../EmptyState";
import styles from "./mij.module.css";

export default function MijPage() {
  const router = useRouter();
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

      {ambInvites > 0 && (
        <Link href="/ambassadeur" className={styles.ambBanner}>
          <span className={styles.ambStar}>★</span>
          <span>
            Je hebt {ambInvites === 1 ? "een ambassadeur-uitnodiging" : `${ambInvites} ambassadeur-uitnodigingen`}
          </span>
          <span className={styles.ambArrow}>→</span>
        </Link>
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
        const isBetaald = (a: Application) => deals[a.dealId]?.beloningstype === "betaald";
        const lopend = apps.filter((a) => dealTab(a, isBetaald(a)) === "lopend");
        const aangevraagd = apps.filter((a) => dealTab(a, isBetaald(a)) === "aangevraagd");
        const klaar = apps.filter((a) => dealTab(a, isBetaald(a)) === "klaar");
        const lijst = tab === "lopend" ? lopend : tab === "aangevraagd" ? aangevraagd : klaar;

        return (
          <div className={styles.section}>
            <h2 className={styles.h2}>Mijn deals</h2>
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
                  {label} · {n}
                </button>
              ))}
            </div>

            {busy ? (
              <div className={styles.subtle}>Laden…</div>
            ) : lijst.length === 0 ? (
              <EmptyState
                icon={tab === "klaar" ? "◔" : "✦"}
                title={tab === "lopend" ? "Geen lopende deals" : tab === "aangevraagd" ? "Geen openstaande aanvragen" : "Nog niets afgerond"}
                text={tab === "aangevraagd" ? "Vind een deal die bij je past en vraag 'm aan in een tik." : "Zodra je een deal doet, verschijnt 'ie hier."}
                actionLabel={tab === "aangevraagd" ? "Naar deals" : undefined}
                actionHref={tab === "aangevraagd" ? "/deals" : undefined}
              />
            ) : (
              <div className={styles.list}>
                {lijst.map((a) => {
                  const deal = deals[a.dealId];
                  const meta = restMeta[a.restaurantId];
                  const vp = dealVoortgang(a, deal?.beloningstype === "betaald");
                  const korting = deal?.kortingPct ?? 20;
                  const beloning = deal?.beloningstype === "betaald" ? `€ ${deal?.bedrag}` : "Gratis diner";
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
                            {vp.fase === "aangevraagd" ? "Wacht op restaurant"
                              : vp.fase === "gewijzigd" ? "Wacht op herbevestiging"
                              : vp.fase === "gepland" ? "Ingepland"
                              : vp.fase === "teDoen" ? "Jij bent aan zet"
                              : "Afgerond ✓"}
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
                          ? "Afgerond ✓"
                          : `Stap ${vp.gedaan + 1} van 5 · ${VOORTGANG_STAPPEN[vp.gedaan]}`}
                      </div>

                      {/* instructies wanneer de creator nog langs moet */}
                      {(vp.fase === "gepland" || vp.fase === "gewijzigd") && (
                        <div className={styles.instr}>
                          {a.datumGewijzigd ? (
                            <div className={styles.instrNotice}>
                              Datum gewijzigd — het restaurant moet je nieuwe moment nog bevestigen.
                            </div>
                          ) : (
                            <div className={styles.instrWhen}>
                              Je wordt verwacht op <b>{formatDatumTijd(a.bezoekDatum ?? "", a.bezoekTijd)}</b>.
                            </div>
                          )}

                          {a.linkCode && (
                            <div className={styles.instrBlock}>
                              <div className={styles.instrLbl}>Zet je reserveringslink in je story</div>
                              <div className={styles.shareRow}>
                                <input
                                  readOnly
                                  className={styles.shareInput}
                                  value={`${origin.replace(/^https?:\/\//, "")}/b/${a.linkCode}`}
                                  onFocus={(e) => e.currentTarget.select()}
                                />
                                <button type="button" className={styles.shareBtn} onClick={() => copyLink(a.linkCode!)}>
                                  {copied === a.linkCode ? "Gekopieerd ✓" : "Kopieer"}
                                </button>
                              </div>
                              <p className={styles.instrHint}>Zo kunnen je volgers met {korting}% korting reserveren bij {rest[a.restaurantId] ?? "het restaurant"}.</p>
                            </div>
                          )}

                          {deal?.gevraagd && (
                            <div className={styles.instrRow}>
                              <span className={styles.instrRowLbl}>Plaats</span>
                              <b>{deal.gevraagd}</b>
                            </div>
                          )}
                          {deal?.inhoud && deal.inhoud.length > 0 && (
                            <div className={styles.instrRow}>
                              <span className={styles.instrRowLbl}>Laat zien</span>
                              <b>{deal.inhoud.join(", ")}</b>
                            </div>
                          )}
                          <div className={styles.instrRow}>
                            <span className={styles.instrRowLbl}>Tag</span>
                            <b>@dinely op Instagram</b>
                          </div>

                          {editing ? (
                            <div className={styles.dateEdit}>
                              <input className={styles.dateInput} type="date" min={todayISO()} value={nieuweDatum} onChange={(e) => setNieuweDatum(e.target.value)} />
                              <input className={styles.dateInput} type="time" value={nieuweTijd} onChange={(e) => setNieuweTijd(e.target.value)} />
                              <button className={styles.dateSave} disabled={!nieuweDatum || !nieuweTijd} onClick={() => saveDatum(a)}>Opslaan</button>
                              <button className={styles.dateCancel} onClick={() => setEditDatum(null)}>Annuleer</button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.dateChangeBtn}
                              onClick={() => { setEditDatum(a.id ?? null); setNieuweDatum(a.bezoekDatum ?? ""); setNieuweTijd(a.bezoekTijd ?? ""); }}
                            >
                              Datum of tijd wijzigen
                            </button>
                          )}
                        </div>
                      )}

                      {/* acties wanneer het bezoek is bevestigd */}
                      {vp.fase === "teDoen" && (
                        <>
                        <div className={styles.tlHint}>
                          Upload je content <b>binnen 48 uur</b> na je bezoek. Je statistieken lever je
                          <b> daarna</b> aan, zodat het restaurant het bereik en resultaat ziet.
                        </div>
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
                          {a.reachSubmitted ? (
                            <span className={`${styles.badge} ${styles.ok}`}>Bereik ✓</span>
                          ) : (
                            <Link href={`/bereik/${a.id}`} className={styles.actBtnGold}>Bereik doorgeven</Link>
                          )}
                        </div>
                        </>
                      )}

                      {vp.fase === "aangevraagd" && a.status === "afgewezen" && (
                        <div className={styles.dealActions}>
                          <span className={`${styles.badge} ${styles.no}`}>Deze keer niet</span>
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
        Uitloggen
      </button>

      <BottomNav />
    </div>
  );
}
