"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { listAllContent, listRestaurants } from "@/lib/appdata";
import type { ContentItem } from "@/lib/types";
import BottomNav from "../BottomNav";
import styles from "./feed.module.css";

type FeedSlide = {
  key: string;
  media: ContentItem;
  naam: string;
  caption: string;
  restaurantId: string;
  restNaam: string;
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
        const [content, rests] = await Promise.all([listAllContent(), listRestaurants()]);
        const names: Record<string, string> = {};
        rests.forEach((r) => (names[r.id] = r.naam));
        const s: FeedSlide[] = [];
        content.forEach((c) => {
          (c.media ?? []).forEach((m, i) => {
            if (m?.url) {
              s.push({
                key: `${c.id}-${i}`,
                media: m,
                naam: c.naam,
                caption: c.caption,
                restaurantId: c.restaurantId,
                restNaam: names[c.restaurantId] ?? "Restaurant",
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
          <div className={styles.emptyTitle}>Nog geen content</div>
          <p className={styles.emptyText}>
            Zodra creators hun reels en foto&apos;s plaatsen, zie je ze hier voorbijkomen.
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

  return (
    <div className={styles.slide} ref={ref}>
      {slide.media.type === "video" ? (
        <video
          ref={videoRef}
          src={slide.media.url}
          className={styles.media}
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <div className={styles.media} style={{ backgroundImage: `url(${slide.media.url})` }} />
      )}
      <div className={styles.grad} />
      <div className={styles.overlay}>
        <Link href={`/r/${slide.restaurantId}`} className={styles.rest}>{slide.restNaam} →</Link>
        <div className={styles.creator}>{slide.naam}</div>
        {slide.caption && <p className={styles.caption}>{slide.caption}</p>}
      </div>
    </div>
  );
}
