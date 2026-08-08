"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getRestaurantById,
  listDealsFor,
  listReviewsFor,
  listContentFor,
  type PublicRestaurant,
} from "@/lib/appdata";
import type { Deal, Review, Content } from "@/lib/types";
import styles from "./restaurant.module.css";

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

export default function RestaurantPage() {
  const params = useParams();
  const id = String(params.id);
  const [r, setR] = useState<PublicRestaurant | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
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
        setContent(c);
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  if (busy) return <div className={styles.loading}>Laden…</div>;
  if (!r) return <div className={styles.loading}>Restaurant niet gevonden.</div>;

  const photos = (r.media?.sfeer ?? []).filter(Boolean) as string[];
  const cover = photos[0];
  const vibe = avg(reviews.map((x) => x.vibe ?? 0));
  const food = avg(reviews.map((x) => x.food ?? 0));
  const service = avg(reviews.map((x) => x.service ?? 0));

  return (
    <div className={styles.wrap}>
      <div className={styles.hero} style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
        <div className={styles.heroGrad} />
        <Link href="/discover" className={styles.back}>‹</Link>
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

      {photos.length > 1 && (
        <div className={styles.gallery}>
          {photos.slice(1).map((p, i) => (
            <div key={i} className={styles.gphoto} style={{ backgroundImage: `url(${p})` }} />
          ))}
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

      <div className={styles.section}>
        <h2 className={styles.h2}>Open deals</h2>
        {deals.length === 0 ? (
          <div className={styles.empty}>Dit restaurant heeft nu geen open deals.</div>
        ) : (
          <div className={styles.deals}>
            {deals.map((d) => (
              <div key={d.id} className={styles.deal}>
                <div className={styles.dealTop}>
                  <h3>{d.titel}</h3>
                  <span className={styles.reward}>
                    {d.beloningstype === "betaald" ? `€${d.bedrag} + diner` : "Gratis diner"}
                  </span>
                </div>
                {d.gevraagd && <div className={styles.dealAsk}>Gevraagd: {d.gevraagd}</div>}
                <Link href={`/creator?deal=${d.id}`} className={styles.apply}>
                  Solliciteer als creator →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
