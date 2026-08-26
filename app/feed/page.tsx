"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { listAllContent, listRestaurants, listCreatorFotos } from "@/lib/appdata";
import type { PublicRestaurant } from "@/lib/appdata";
import type { ContentItem } from "@/lib/types";
import BottomNav from "../BottomNav";
import styles from "./feed.module.css";

type FeedSlide = {
  key: string;
  media: ContentItem; // altijd een video
  creatorNaam: string;
  creatorFoto?: string;
  caption: string;
  restaurantId: string;
  restNaam: string;
  locatie: string;
  prijs: string;
  type: string;
};

export default function FeedPage() {
  const router = useRouter();
  const { session, loading } = useApp();
  const [slides, setSlides] = useState<FeedSlide[]>([]);
  const [busy, setBusy] = useState(true);

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
        const s: FeedSlide[] = [];
        content.forEach((c) => {
          const r = rmap[c.restaurantId];
          // Alleen video's komen in de feed (geen foto's).
          (c.media ?? []).forEach((m, i) => {
            if (m?.url && m.type === "video") {
              s.push({
                key: `${c.id}-${i}`,
                media: m,
                creatorNaam: c.naam,
                creatorFoto: c.creatorUid ? fotos[c.creatorUid] : undefined,
                caption: c.caption,
                restaurantId: c.restaurantId,
                restNaam: r?.naam ?? "Restaurant",
                locatie: r?.adres || "",
                prijs: r?.prijs || "",
                type: r?.keuken || "",
              });
            }
          });
        });
        setSlides(s);
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
          <div className={styles.emptyTitle}>Nog geen video&apos;s</div>
          <p className={styles.emptyText}>
            Zodra creators hun reels plaatsen, zie je ze hier voorbijkomen.
          </p>
          <Link href="/discover" className={styles.emptyBtn}>Ontdek restaurants →</Link>
        </div>
      ) : (
        <div className={styles.feed}>
          {slides.map((s) => (
            <FeedItem key={s.key} slide={s} />
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function FeedItem({ slide }: { slide: FeedSlide }) {
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

      {/* Bovenin: restaurant-info */}
      <Link href={`/r/${slide.restaurantId}`} className={styles.topbar}>
        <div className={styles.restNaam}>{slide.restNaam}</div>
        {restMeta && <div className={styles.restMeta}>{restMeta}</div>}
      </Link>

      {/* Onderin: creator-bolletje + caption */}
      <div className={styles.overlay}>
        <div className={styles.creator}>
          <span
            className={styles.avatar}
            style={slide.creatorFoto ? { backgroundImage: `url(${slide.creatorFoto})` } : undefined}
          >
            {!slide.creatorFoto && initial}
          </span>
          <span className={styles.creatorNaam}>{slide.creatorNaam || "Creator"}</span>
        </div>
        {slide.caption && <p className={styles.caption}>{slide.caption}</p>}
      </div>
    </div>
  );
}
