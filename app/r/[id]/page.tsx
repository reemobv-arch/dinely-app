"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  getRestaurantById,
  listDealsFor,
  listReviewsFor,
  listContentFor,
  listMyApplications,
  listMyInvites,
  createApplication,
  getMyCreator,
  type PublicRestaurant,
} from "@/lib/appdata";
import type { Deal, Review, Content } from "@/lib/types";
import { qualifiesForDeal } from "@/lib/qualify";
import { isInviteLocked } from "@/lib/dealVisibility";
import Waiting from "../../Waiting";
import styles from "./restaurant.module.css";

const STATUS: Record<string, { label: string; cls: string }> = {
  wacht: { label: "Aangevraagd", cls: "wacht" },
  geaccepteerd: { label: "Je bent gekozen ✓", cls: "ok" },
  afgewezen: { label: "Deze keer niet", cls: "no" },
};

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function formatNL(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { uid, profile } = useApp();

  const [r, setR] = useState<PublicRestaurant | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [busy, setBusy] = useState(true);
  const [platforms, setPlatforms] = useState("Instagram");
  const [heroIdx, setHeroIdx] = useState(0);
  const [lb, setLb] = useState<{ photos: string[]; start: number } | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const [statusByDeal, setStatusByDeal] = useState<Record<string, string>>({});
  const [dateByDeal, setDateByDeal] = useState<Record<string, string>>({});
  const [pickDeal, setPickDeal] = useState<string | null>(null);
  const [pickDate, setPickDate] = useState("");
  const [motivatie, setMotivatie] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) return;
    getMyCreator(uid)
      .then((c) => setApproved(c?.status === "approved"))
      .catch(() => setApproved(false));
    listMyInvites(uid).then(setInvited).catch(() => {});
  }, [uid]);

  useEffect(() => {
    try {
      const p = localStorage.getItem("dinely-app:platforms");
      if (p) setPlatforms(p);
    } catch {
      /* negeer */
    }
    (async () => {
      try {
        const [rr, d, rv, c] = await Promise.all([
          getRestaurantById(id),
          listDealsFor(id),
          listReviewsFor(id),
          listContentFor(id),
        ]);
        setR(rr);
        setDeals(d.filter((x) => x.status === "open"));
        setReviews(rv);
        // Alleen content die het restaurant zelf op zijn profiel heeft gezet.
        setContent(c.filter((x) => x.uitgelicht));
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const mine = await listMyApplications(uid);
      const s: Record<string, string> = {};
      const dt: Record<string, string> = {};
      mine.forEach((a) => {
        if (a.dealId) {
          s[a.dealId] = a.status;
          if (a.bezoekDatum) dt[a.dealId] = a.bezoekDatum;
        }
      });
      setStatusByDeal(s);
      setDateByDeal(dt);
    })();
  }, [uid]);

  function qualifies(d: Deal): boolean {
    return qualifiesForDeal(d.eisen, platforms, profile.volgers);
  }

  async function apply(d: Deal) {
    if (!d.id || !pickDate || !r) return;
    setPending(d.id);
    const toel = motivatie.trim();
    try {
      await createApplication({
        dealId: d.id,
        restaurantId: id,
        handle: profile.instagram || profile.naam || "Creator",
        volgers: profile.volgers,
        platform: platforms,
        regio: profile.regio,
        geslacht: profile.geslacht,
        bezoekDatum: pickDate,
        ...(toel ? { toelichting: toel } : {}),
      });
      setStatusByDeal((p) => ({ ...p, [d.id!]: "wacht" }));
      setDateByDeal((p) => ({ ...p, [d.id!]: pickDate }));
      setPickDeal(null);
      setPickDate("");
      setMotivatie("");
    } catch {
      setStatusByDeal((p) => ({ ...p, [d.id!]: "err" }));
    } finally {
      setPending(null);
    }
  }

  if (busy) return <div className={styles.loading}>Laden…</div>;
  if (!r) return <div className={styles.loading}>Restaurant niet gevonden.</div>;

  const photos = (r.media?.sfeer ?? []).filter(Boolean) as string[];
  const eten = (r.media?.eten ?? []).filter(Boolean) as string[];
  const cover = photos[0];
  const vibe = avg(reviews.map((x) => x.vibe ?? 0));
  const food = avg(reviews.map((x) => x.food ?? 0));
  const service = avg(reviews.map((x) => x.service ?? 0));

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        {photos.length > 0 ? (
          <div
            className={styles.heroTrack}
            ref={heroRef}
            onScroll={() => {
              const el = heroRef.current;
              if (el) setHeroIdx(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {photos.map((p, i) => (
              <div
                key={i}
                className={styles.heroSlide}
                style={{ backgroundImage: `url(${p})` }}
                onClick={() => setLb({ photos, start: i })}
              />
            ))}
          </div>
        ) : (
          <div className={styles.heroSlide} style={cover ? { backgroundImage: `url(${cover})` } : undefined} />
        )}
        <div className={styles.heroGrad} />
        <button className={styles.back} onClick={() => router.back()} aria-label="Terug">‹</button>
        {photos.length > 1 && (
          <div className={styles.dots}>
            {photos.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === heroIdx ? styles.dotOn : ""}`} />
            ))}
          </div>
        )}
        <div className={styles.heroText}>
          {r.keuken && <span className="eyebrow">{r.keuken}</span>}
          <h1 className={styles.name}>{r.naam || "Naamloos restaurant"}</h1>
          <div className={styles.sub}>{[r.prijs, r.adres].filter(Boolean).join(" · ")}</div>
        </div>
      </div>

      {(vibe != null || food != null) && (
        <div className={styles.scores}>
          {vibe != null && <div className={styles.score}><b>{vibe.toFixed(1)}</b><span>vibe</span></div>}
          {food != null && <div className={styles.score}><b>{food.toFixed(1)}</b><span>food</span></div>}
          {service != null && <div className={styles.score}><b>{service.toFixed(1)}</b><span>service</span></div>}
        </div>
      )}

      {(r.sfeer || r.omschrijving) && (
        <div className={styles.section}>
          {r.sfeer && <div className={styles.sfeer}>{r.sfeer}</div>}
          {r.omschrijving && <p className={styles.desc}>{r.omschrijving}</p>}
        </div>
      )}

      {eten.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.h2}>Eten &amp; drinken</h2>
          <div className={styles.gallery}>
            {eten.map((p, i) => (
              <div
                key={i}
                className={styles.gphoto}
                style={{ backgroundImage: `url(${p})` }}
                onClick={() => setLb({ photos: eten, start: i })}
              />
            ))}
          </div>
        </div>
      )}

      {content.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.h2}>Van creators</h2>
          <div className={styles.creators}>
            {content.map((c) => {
              const m = c.media?.[0];
              return (
                <div key={c.id} className={styles.cItem}>
                  <div className={styles.cMediaWrap}>
                    {m?.type === "video" ? (
                      <video src={m.url} className={styles.cMedia} controls playsInline />
                    ) : m ? (
                      <img src={m.url} alt="" className={styles.cMedia} />
                    ) : null}
                    {c.media && c.media.length > 1 && (
                      <span className={styles.cCount}>+{c.media.length - 1}</span>
                    )}
                  </div>
                  <div className={styles.cName}>{c.naam}</div>
                  {c.caption && <p className={styles.cCap}>{c.caption}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviews.some((rv) => rv.tekst && rv.tekst.trim()) && (
        <div className={styles.section}>
          <h2 className={styles.h2}>Wat gasten zeggen</h2>
          <div className={styles.reviews}>
            {reviews
              .filter((rv) => rv.tekst && rv.tekst.trim())
              .map((rv) => (
                <div key={rv.id} className={styles.reviewCard}>
                  <div className={styles.rvTop}>
                    <div className={styles.rvAv}>{(rv.naam || "?").slice(0, 1).toUpperCase()}</div>
                    <div className={styles.rvName}>{rv.naam || "Gast"}</div>
                    <div className={styles.rvStars}>
                      {"★".repeat(Math.round(rv.sterren))}
                      <span className={styles.rvEmpty}>{"★".repeat(5 - Math.round(rv.sterren))}</span>
                    </div>
                  </div>
                  <p className={styles.rvText}>{rv.tekst}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className={styles.section} style={{ paddingBottom: 40 }}>
        <h2 className={styles.h2}>Open deals</h2>
        {deals.length === 0 ? (
          <div className={styles.empty}>Dit restaurant heeft nu geen open deals.</div>
        ) : (
          <div className={styles.deals}>
            {deals.map((d) => {
              const stKey = statusByDeal[d.id ?? ""];
              const st = STATUS[stKey ?? ""];
              const applied = !!stKey && stKey !== "err";
              const ok = qualifies(d);
              const inviteLocked = isInviteLocked(d, invited, applied);
              return (
                <div key={d.id} className={`${styles.deal} ${inviteLocked ? styles.dealLocked : ""}`}>
                  <div className={styles.dealTop}>
                    <h3>{d.titel}</h3>
                    <span className={styles.reward}>
                      {inviteLocked
                        ? "🔒 Invite only"
                        : d.beloningstype === "betaald"
                        ? `€${d.bedrag} + diner`
                        : "Gratis diner"}
                    </span>
                  </div>
                  <div className={styles.dealChips}>
                    {(d.eisen ?? []).map((e, i) => (
                      <span key={i} className={styles.dealChip}>{e.platform} ≥ {e.minVolgers.toLocaleString("nl-NL")}</span>
                    ))}
                    {d.gevraagd && <span className={styles.dealChip}>{d.gevraagd}</span>}
                  </div>

                  {inviteLocked ? (
                    <div className={styles.reqBox}>
                      Deze deal is <b>exclusief</b> en alleen op uitnodiging. Word je uitgenodigd door
                      dit restaurant, dan kun je hier reageren.
                    </div>
                  ) : applied ? (
                    <div className={`${styles.statusBox} ${styles[st?.cls ?? "wacht"]}`}>
                      {stKey === "geaccepteerd"
                        ? `✓ Je bent gekozen — je komt op ${formatNL(dateByDeal[d.id ?? ""])}.`
                        : stKey === "afgewezen"
                        ? "Deze keer niet gelukt, volgende kans komt snel."
                        : `Aangevraagd — je koos ${formatNL(dateByDeal[d.id ?? ""])}.`}
                    </div>
                  ) : approved === false ? (
                    <div className={styles.reqBox}>
                      Je profiel moet eerst worden goedgekeurd voordat je een deal kunt aanvragen.
                      Rond je aanmelding af in <b>Mijn</b>.
                    </div>
                  ) : stKey === "err" ? (
                    <div className={styles.reqBox}>Versturen lukte net niet. Ververs en probeer opnieuw.</div>
                  ) : pickDeal === d.id ? (
                    <div className={styles.pick}>
                      {!ok && (
                        <>
                          <div className={styles.reqBox} style={{ marginBottom: 10 }}>
                            Je zit nog onder de bereik-eis. Vertel kort waarom je tóch een goede
                            match bent, dan kan het restaurant je alsnog kiezen.
                          </div>
                          <textarea
                            className={styles.pickInput}
                            rows={3}
                            placeholder="Bijv. ik heb 1.000 volgers, maar het zijn allemaal echte food-fans uit de buurt."
                            value={motivatie}
                            onChange={(e) => setMotivatie(e.target.value)}
                          />
                        </>
                      )}
                      <label className={styles.pickLbl}>Wanneer kom je langs?</label>
                      <input
                        className={styles.pickInput}
                        type="date"
                        min={todayISO()}
                        max={addDays(todayISO(), d.looptijdDagen || 30)}
                        value={pickDate}
                        onChange={(e) => setPickDate(e.target.value)}
                      />
                      <button
                        className={styles.applyBtn}
                        disabled={!pickDate || (!ok && !motivatie.trim()) || pending === d.id}
                        onClick={() => apply(d)}
                      >
                        {pending === d.id ? <Waiting label="Versturen" /> : "Verstuur aanvraag →"}
                      </button>
                    </div>
                  ) : (
                    <button className={styles.applyBtn} onClick={() => { setPickDeal(d.id ?? null); setPickDate(""); setMotivatie(""); }}>
                      {ok ? "Ik wil deze deal →" : "Ik wil deze deal (kort toelichten) →"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lb && <Lightbox photos={lb.photos} start={lb.start} onClose={() => setLb(null)} />}
    </div>
  );
}

function Lightbox({ photos, start, onClose }: { photos: string[]; start: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = start * el.clientWidth;
  }, [start]);
  return (
    <div className={styles.lb} onClick={onClose}>
      <button className={styles.lbClose} onClick={onClose} aria-label="Sluiten">✕</button>
      <div className={styles.lbTrack} ref={ref} onClick={(e) => e.stopPropagation()}>
        {photos.map((p, i) => (
          <div key={i} className={styles.lbSlide}>
            <img src={p} alt="" className={styles.lbImg} />
          </div>
        ))}
      </div>
    </div>
  );
}
