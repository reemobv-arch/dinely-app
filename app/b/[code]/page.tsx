"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getReferralLink,
  getRestaurantById,
  type PublicRestaurant,
} from "@/lib/appdata";
import { createReservation } from "@/lib/appdata";
import type { ReferralLink } from "@/lib/types";
import styles from "./b.module.css";

export default function BookingPage() {
  const params = useParams();
  const code = String(params.code);

  const [link, setLink] = useState<ReferralLink | null>(null);
  const [rest, setRest] = useState<PublicRestaurant | null>(null);
  const [busy, setBusy] = useState(true);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [leeftijd, setLeeftijd] = useState("");
  const [aantal, setAantal] = useState(2);
  const [metWie, setMetWie] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const l = await getReferralLink(code);
        setLink(l);
        if (l) setRest(await getRestaurantById(l.restaurantId));
      } finally {
        setBusy(false);
      }
    })();
  }, [code]);

  const korting = link?.kortingPct ?? 20;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!link) return;
    setSending(true);
    setError(null);
    try {
      await createReservation(link, {
        naam: naam.trim(),
        email: email.trim(),
        telefoon: telefoon.trim(),
        leeftijd: leeftijd ? Number(leeftijd) : undefined,
        aantal,
        metWie: metWie.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError("Versturen lukte niet. Probeer het zo nog eens.");
    } finally {
      setSending(false);
    }
  }

  if (busy) return <div className={styles.state}>Laden…</div>;

  if (!link) {
    return (
      <div className={styles.state}>
        <div className={styles.stateInner}>
          <div className={styles.logo}>
            Dine<span>ly</span>
          </div>
          <p>Deze link is niet (meer) geldig.</p>
        </div>
      </div>
    );
  }

  const naamRest = rest?.naam || "dit restaurant";
  const cover = (rest?.media?.sfeer ?? []).filter(Boolean)[0] as string | undefined;

  if (done) {
    return (
      <div className={styles.wrap}>
        <div className={styles.doneCard}>
          <div className={styles.check}>✓</div>
          <h1 className={styles.doneTitle}>Tot snel bij {naamRest}!</h1>
          <p className={styles.doneText}>
            Je reservering staat genoteerd. Toon deze bevestiging bij aankomst voor{" "}
            <b>{korting}% korting</b>. We hebben je gegevens goed ontvangen.
          </p>
          <div className={styles.doneMeta}>
            {naam} · {aantal} {aantal === 1 ? "persoon" : "personen"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div
        className={styles.hero}
        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
      >
        <div className={styles.heroGrad} />
        <div className={styles.heroText}>
          <div className={styles.logo}>
            Dine<span>ly</span>
          </div>
          {rest?.keuken && <span className="eyebrow">{rest.keuken}</span>}
          <h1 className={styles.name}>{naamRest}</h1>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.kortingBadge}>
          <b>{korting}% korting</b>
          <span>voor jou en je gezelschap</span>
        </div>
        <p className={styles.intro}>
          {link.creatorNaam ? `${link.creatorNaam} tipt je ${naamRest}. ` : ""}
          Laat je gegevens achter, dan houdt {naamRest} een tafel voor je vrij en krijg je{" "}
          {korting}% korting op de rekening.
        </p>

        {error && (
          <div className="notice err" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className={styles.form}>
          <div className="field">
            <label className="flabel">Naam hoofdboeker</label>
            <input
              className="inp"
              required
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Voor- en achternaam"
            />
          </div>
          <div className="field">
            <label className="flabel">E-mail</label>
            <input
              className="inp"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.nl"
            />
          </div>
          <div className="field">
            <label className="flabel">Telefoon</label>
            <input
              className="inp"
              type="tel"
              required
              value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)}
              placeholder="06 12345678"
            />
          </div>
          <div className={styles.row2}>
            <div className="field">
              <label className="flabel">Aantal personen</label>
              <input
                className="inp"
                type="number"
                min={1}
                max={30}
                required
                value={aantal}
                onChange={(e) => setAantal(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label className="flabel">Leeftijd (optioneel)</label>
              <input
                className="inp"
                type="number"
                min={16}
                max={120}
                value={leeftijd}
                onChange={(e) => setLeeftijd(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
          <div className="field">
            <label className="flabel">Met wie kom je? (optioneel)</label>
            <input
              className="inp"
              value={metWie}
              onChange={(e) => setMetWie(e.target.value)}
              placeholder="Bijv. vrienden, familie, date"
            />
          </div>

          <button className="btn btn-gold" style={{ width: "100%", marginTop: 6 }} disabled={sending}>
            {sending ? "Versturen…" : `Reserveer met ${korting}% korting →`}
          </button>
          <p className={styles.small}>
            Je gegevens gaan alleen naar {naamRest} voor deze reservering.
          </p>
        </form>
      </div>
    </div>
  );
}
