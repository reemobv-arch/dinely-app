"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import {
  listAllContent,
  listRestaurants,
  listCreatorFotos,
  getCreatorProfile,
  type PublicRestaurant,
  type PublicCreator,
} from "@/lib/appdata";
import { feedBoost } from "@/lib/feedBoost";
import type { ContentItem } from "@/lib/types";
import { useT } from "@/lib/i18n";
import BottomNav from "../BottomNav";
import styles from "./feed.module.css";

type FeedSlide = {
  key: string;
  media: ContentItem; // altijd een video
  creatorNaam: string;
  creatorFoto?: string;
  creatorUid?: string;
  caption: string;
  restaurantId: string;
  restNaam: string;
  restFoto?: string;
  locatie: string;
  prijs: string;
  type: string;
};

// Wat we per creator uit de publieke content afleiden voor de popup.
type CreatorStat = { deals: number; restaurants: { id: string; naam: string }[] };

export default function FeedPage() {
  const router = useRouter();
  const t = useT();
  const { session, loading } = useApp();
  const [slides, setSlides] = useState<FeedSlide[]>([]);
  const [stats, setStats] = useState<Record<string, CreatorStat>>({});
  const [busy, setBusy] = useState(true);
  const [openUid, setOpenUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    (async () => {
      try {
        const [content, rests, fotos] = await Promise.all([
          listAllContent(),
          listRestaurants(),
          listCreatorFotos(),
        ]);
        const rmap: Record<string, PublicRestaurant> = {};
        rests.forEach((r) => (rmap[r.id] = r));
        const coverOf = (id: string) => rmap[id]?.media?.sfeer?.find(Boolean) ?? undefined;
        const s: FeedSlide[] = [];

        // Restaurant-eigen video's komen ook in de feed (de sfeervideo van het profiel).
        rests.forEach((r) => {
          const v = r.media?.video;
          if (v) {
            s.push({
              key: `rest-${r.id}`,
              media: { url: v, type: "video" },
              creatorNaam: r.naam || "Restaurant",
              creatorFoto: r.media?.sfeer?.find(Boolean) ?? undefined,
              caption: r.omschrijving || "",
              restaurantId: r.id,
              restNaam: r.naam ?? "Restaurant",
              restFoto: coverOf(r.id),
              locatie: r.adres || "",
              prijs: r.prijs || "",
              type: r.keuken || "",
            });
          }
        });

        // Per creator: hoeveel deals en bij welke restaurants (uit publieke content).
        const st: Record<string, { deals: Set<string>; rest: Map<string, string> }> = {};

        content.forEach((c) => {
          const r = rmap[c.restaurantId];
          if (c.creatorUid) {
            if (!st[c.creatorUid]) st[c.creatorUid] = { deals: new Set(), rest: new Map() };
            if (c.dealId) st[c.creatorUid].deals.add(c.dealId);
            if (c.restaurantId) st[c.creatorUid].rest.set(c.restaurantId, r?.naam ?? "Restaurant");
          }
          // Alleen video's komen in de feed (geen foto's).
          (c.media ?? []).forEach((m, i) => {
            if (m?.url && m.type === "video") {
              s.push({
                key: `${c.id}-${i}`,
                media: m,
                creatorNaam: c.naam,
                creatorFoto: c.creatorUid ? fotos[c.creatorUid] : undefined,
                creatorUid: c.creatorUid,
                caption: c.caption,
                restaurantId: c.restaurantId,
                restNaam: r?.naam ?? "Restaurant",
                restFoto: coverOf(c.restaurantId),
                locatie: r?.adres || "",
                prijs: r?.prijs || "",
                type: r?.keuken || "",
              });
            }
          });
        });

        const statsOut: Record<string, CreatorStat> = {};
        for (const [uid, v] of Object.entries(st)) {
          statsOut[uid] = {
            deals: v.deals.size,
            restaurants: [...v.rest.entries()].map(([id, naam]) => ({ id, naam })),
          };
        }
        setStats(statsOut);

        // Gebooste restaurants (feed-add-on) naar voren, verder stabiel.
        const geboost = s
          .map((slide, i) => ({ slide, i, b: feedBoost(rmap[slide.restaurantId]) }))
          .sort((a, b) => b.b - a.b || a.i - b.i)
          .map((x) => x.slide);
        setSlides(geboost);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  return (
    <div className={styles.wrap}>
      {busy ? (
        <div className={styles.center}>
          <div className={styles.spinner} />
        </div>
      ) : slides.length === 0 ? (
        <div className={styles.center}>
          <div className={styles.emptyTitle}>{t("Nog geen video's")}</div>
          <p className={styles.emptyText}>
            {t("Zodra creators hun reels plaatsen, zie je ze hier voorbijkomen.")}
          </p>
          <Link href="/discover" className={styles.emptyBtn}>{t("Ontdek restaurants")} →</Link>
        </div>
      ) : (
        <div className={styles.feed}>
          {slides.map((s) => (
            <FeedItem key={s.key} slide={s} onOpenCreator={setOpenUid} />
          ))}
        </div>
      )}
      {openUid && (
        <CreatorSheet uid={openUid} stat={stats[openUid]} onClose={() => setOpenUid(null)} />
      )}
      <BottomNav />
    </div>
  );
}

function FeedItem({ slide, onOpenCreator }: { slide: FeedSlide; onOpenCreator: (uid: string) => void }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    const v = videoRef.current;
    if (!el || !v) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.intersectionRatio > 0.6) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const initial = (slide.creatorNaam || "?").replace(/[@.]/g, "").slice(0, 1).toUpperCase();
  const restMeta = [slide.locatie, slide.prijs, slide.type].filter(Boolean).join(" · ");
  const restInitial = (slide.restNaam || "?").replace(/[@.]/g, "").slice(0, 1).toUpperCase();

  return (
    <div className={styles.slide} ref={ref}>
      <video
        ref={videoRef}
        src={slide.media.url}
        className={styles.media}
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className={styles.grad} />

      {/* Bovenin: restaurant-info met klein fotobolletje (zoals TikTok/Insta) */}
      <Link href={`/r/${slide.restaurantId}`} className={styles.topbar}>
        <span
          className={styles.restAvatar}
          style={slide.restFoto ? { backgroundImage: `url(${slide.restFoto})` } : undefined}
        >
          {!slide.restFoto && restInitial}
        </span>
        <span className={styles.topText}>
          <span className={styles.restNaam}>{slide.restNaam}</span>
          {restMeta && <span className={styles.restMeta}>{restMeta}</span>}
        </span>
      </Link>

      {/* Onderin: creator-bolletje (klikbaar) + caption */}
      <div className={styles.overlay}>
        {slide.creatorUid ? (
          <button
            type="button"
            className={styles.creator}
            onClick={() => onOpenCreator(slide.creatorUid!)}
            aria-label={`${slide.creatorNaam} — ${t("bekijk profiel")}`}
          >
            <span
              className={styles.avatar}
              style={slide.creatorFoto ? { backgroundImage: `url(${slide.creatorFoto})` } : undefined}
            >
              {!slide.creatorFoto && initial}
            </span>
            <span className={styles.creatorText}>
              <span className={styles.creatorRol}>{t("creator")}</span>
              <span className={styles.creatorNaam}>{slide.creatorNaam || "Creator"}</span>
            </span>
          </button>
        ) : (
          <div className={styles.creator}>
            <span
              className={styles.avatar}
              style={slide.creatorFoto ? { backgroundImage: `url(${slide.creatorFoto})` } : undefined}
            >
              {!slide.creatorFoto && initial}
            </span>
            <span className={styles.creatorText}>
              <span className={styles.creatorNaam}>{slide.creatorNaam || "Creator"}</span>
            </span>
          </div>
        )}
        {slide.caption && <p className={styles.caption}>{slide.caption}</p>}
      </div>
    </div>
  );
}

function CreatorSheet({
  uid,
  stat,
  onClose,
}: {
  uid: string;
  stat?: CreatorStat;
  onClose: () => void;
}) {
  const t = useT();
  const [profiel, setProfiel] = useState<PublicCreator | null>(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    let actief = true;
    setLaden(true);
    getCreatorProfile(uid)
      .then((p) => {
        if (actief) setProfiel(p);
      })
      .finally(() => {
        if (actief) setLaden(false);
      });
    return () => {
      actief = false;
    };
  }, [uid]);

  const naam = profiel?.naam || "Creator";
  const initial = naam.replace(/[@.]/g, "").slice(0, 1).toUpperCase();
  const nf = (n?: number) => (typeof n === "number" ? n.toLocaleString("nl-NL") : "—");

  const kanalen = useMemo(() => {
    const out: { label: string; handle: string; volgers?: number }[] = [];
    if (profiel?.instagram) out.push({ label: "Instagram", handle: profiel.instagram, volgers: profiel.igVolgers });
    if (profiel?.tiktok) out.push({ label: "TikTok", handle: profiel.tiktok, volgers: profiel.ttVolgers });
    return out;
  }, [profiel]);

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.sheetClose} onClick={onClose} aria-label={t("Sluiten")}>✕</button>

        <div className={styles.sheetHead}>
          <span
            className={styles.sheetAvatar}
            style={profiel?.foto ? { backgroundImage: `url(${profiel.foto})` } : undefined}
          >
            {!profiel?.foto && initial}
          </span>
          <div>
            <div className={styles.sheetNaam}>{naam}</div>
            {profiel?.categorie && <div className={styles.sheetSub}>{profiel.categorie}</div>}
          </div>
        </div>

        {/* Bovenin: Dinely-punten */}
        <div className={styles.puntBox}>
          <span className={styles.puntGetal}>{nf(profiel?.punten ?? 0)}</span>
          <span className={styles.puntLbl}>{t("Dinely-punten")}</span>
        </div>

        <div className={styles.sheetBody}>
          {/* Volgers per kanaal */}
          <div className={styles.blokTitel}>{t("Volgers")}</div>
          {kanalen.length > 0 ? (
            <div className={styles.kanaalRij}>
              {kanalen.map((k) => (
                <div key={k.label} className={styles.kanaal}>
                  <div className={styles.kanaalVolg}>{nf(k.volgers)}</div>
                  <div className={styles.kanaalLbl}>{k.label}</div>
                  <div className={styles.kanaalHandle}>{k.handle}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.leeg}>{t("Nog geen kanalen bekend.")}</p>
          )}

          {/* Deals gedaan */}
          <div className={styles.blokTitel}>{t("Deals gedaan")}</div>
          <p className={styles.grootGetal}>{stat?.deals ?? 0}</p>

          {/* Restaurants waar hij heeft gegeten */}
          <div className={styles.blokTitel}>{t("Gegeten bij")}</div>
          {stat && stat.restaurants.length > 0 ? (
            <div className={styles.restLijst}>
              {stat.restaurants.map((r) => (
                <Link key={r.id} href={`/r/${r.id}`} className={styles.restChip} onClick={onClose}>
                  {r.naam}
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.leeg}>{t("Nog geen restaurants.")}</p>
          )}

          {laden && <p className={styles.leeg}>{t("Laden")}…</p>}
        </div>
      </div>
    </div>
  );
}
