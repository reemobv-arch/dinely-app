"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { saveCreator, uploadCreatorPhoto, validateStatsImage } from "@/lib/appdata";
import { useT } from "@/lib/i18n";
import Waiting from "../Waiting";
import styles from "./profiel.module.css";

const CATEGORIEEN = ["Food", "Lifestyle", "Fashion", "Travel", "Fitness", "Beauty", "Vegan", "Overig"];

export default function ProfielPage() {
  const router = useRouter();
  const t = useT();
  const { session, loading, profile, saveProfile } = useApp();

  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [stad, setStad] = useState("Amsterdam");
  const [geslacht, setGeslacht] = useState<"vrouw" | "man" | "">("");
  const [ig, setIg] = useState({ handle: "", vol: 0 });
  const [tt, setTt] = useState({ handle: "", vol: 0 });
  const [categorieen, setCategorieen] = useState<string[]>([]);
  const [foto, setFoto] = useState("");
  const [statsFoto, setStatsFoto] = useState("");
  const [fotoBusy, setFotoBusy] = useState(false);
  const [statsBusy, setStatsBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    setNaam(profile.naam || "");
    setEmail(profile.email || "");
    setStad(profile.regio || "Amsterdam");
    setGeslacht(profile.geslacht || "");
    setIg({ handle: profile.instagram || "", vol: profile.igVolgers || 0 });
    setTt({ handle: profile.tiktok || "", vol: profile.ttVolgers || 0 });
    setFoto(profile.foto || "");
    setStatsFoto(profile.statsFoto || "");
    if (profile.categorie)
      setCategorieen(profile.categorie.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3));
  }, [profile]);

  function toggleCategorie(c: string) {
    setCategorieen((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : prev.length < 3 ? [...prev, c] : prev
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const kanOpslaan = !!naam.trim() && emailOk && !!foto && !saving;

  async function opslaan() {
    if (!kanOpslaan) {
      setMsg(!foto ? t("Een profielfoto is verplicht.") : t("Vul je naam en een geldig e-mailadres in."));
      return;
    }
    setSaving(true);
    setMsg(null);
    const totaal = (ig.vol || 0) + (tt.vol || 0);
    const prof = {
      naam: naam.trim(),
      email: email.trim(),
      instagram: ig.handle.trim(),
      tiktok: tt.handle.trim(),
      volgers: totaal,
      igVolgers: ig.vol || 0,
      ttVolgers: tt.vol || 0,
      foto,
      statsFoto,
      categorie: categorieen.join(", "),
      regio: stad.trim() || "Amsterdam",
      geslacht,
    };
    saveProfile(prof);
    try {
      const tel = session?.phone ? { telefoon: session.phone } : {};
      await saveCreator({ ...prof, ...tel });
      router.push("/mij");
    } catch {
      setMsg(t("Opslaan lukte niet. Probeer het opnieuw."));
      setSaving(false);
    }
  }

  if (loading || !session) return null;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/mij" className={styles.back}>‹</Link>
        <div className={styles.brand}>{t("Profiel bewerken")}</div>
        <div style={{ width: 42 }} />
      </header>

      <div className={styles.body}>
        {/* Foto */}
        <div className={styles.groupLbl}>{t("Profielfoto")}</div>
        <label
          className={styles.fotoTile}
          style={foto ? { backgroundImage: `url(${foto})` } : undefined}
        >
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!f) return;
              setFotoBusy(true);
              try {
                setFoto(await uploadCreatorPhoto(f));
              } catch {
                setMsg(t("Foto uploaden mislukt."));
              } finally {
                setFotoBusy(false);
              }
            }}
          />
          {fotoBusy ? (
            <span className={styles.fotoHint}><Waiting label={t("Uploaden")} /></span>
          ) : foto ? (
            <span className={styles.fotoChange}>{t("Wijzig foto")}</span>
          ) : (
            <span className={styles.fotoHint}>＋ {t("Kies een foto")}</span>
          )}
        </label>

        {/* Gegevens */}
        <div className={styles.groupLbl}>{t("Gegevens")}</div>
        <div className={styles.card}>
          <label className={styles.lbl}>{t("Naam")}</label>
          <input className="inp" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Juul Bakker" />
          <label className={styles.lbl}>{t("E-mailadres")}</label>
          <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@email.nl" />
          <label className={styles.lbl}>{t("Stad")}</label>
          <input className="inp" value={stad} onChange={(e) => setStad(e.target.value)} placeholder="Amsterdam" />
          <label className={styles.lbl}>{t("Ik ben")}</label>
          <div className={styles.seg}>
            {(["vrouw", "man"] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={`${styles.segBtn} ${geslacht === g ? styles.segOn : ""}`}
                onClick={() => setGeslacht(g)}
              >
                {g === "vrouw" ? t("Vrouw") : t("Man")}
              </button>
            ))}
          </div>
        </div>

        {/* Socials */}
        <div className={styles.groupLbl}>{t("Socials")}</div>
        <div className={styles.card}>
          <label className={styles.lbl}>Instagram</label>
          <input className="inp" value={ig.handle} onChange={(e) => setIg((s) => ({ ...s, handle: e.target.value }))} placeholder="@jouwnaam" />
          <input className="inp" style={{ marginTop: 8 }} type="number" min={0} value={ig.vol || ""} onChange={(e) => setIg((s) => ({ ...s, vol: Number(e.target.value) }))} placeholder={t("Aantal volgers")} />
          <label className={styles.lbl}>TikTok</label>
          <input className="inp" value={tt.handle} onChange={(e) => setTt((s) => ({ ...s, handle: e.target.value }))} placeholder="@jouwnaam" />
          <input className="inp" style={{ marginTop: 8 }} type="number" min={0} value={tt.vol || ""} onChange={(e) => setTt((s) => ({ ...s, vol: Number(e.target.value) }))} placeholder={t("Aantal volgers")} />
        </div>

        {/* Categorie */}
        <div className={styles.groupLbl}>{t("Content-categorie (max 3)")}</div>
        <div className={styles.cats}>
          {CATEGORIEEN.map((c) => {
            const on = categorieen.includes(c);
            const vol = categorieen.length >= 3 && !on;
            return (
              <button
                key={c}
                type="button"
                className={`${styles.catChip} ${on ? styles.catChipOn : ""}`}
                onClick={() => toggleCategorie(c)}
                disabled={vol}
                style={vol ? { opacity: 0.4 } : undefined}
              >
                {t(c)}
              </button>
            );
          })}
        </div>

        {/* Stats-screenshot */}
        <div className={styles.groupLbl}>{t("Bereik-bewijs (optioneel)")}</div>
        <label
          className={styles.fotoTile}
          style={statsFoto ? { backgroundImage: `url(${statsFoto})` } : undefined}
        >
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!f) return;
              setStatsBusy(true);
              setMsg(null);
              try {
                const url = await uploadCreatorPhoto(f, { maxDim: 2200, quality: 0.85 });
                const check = await validateStatsImage(url);
                if (!check.ok) {
                  setMsg(
                    `${t("Dit lijkt geen statistieken-screenshot.")} ${check.detail || ""} ${t("Upload een screenshot waarop je bereik en de periode (bijv. 30 dagen) staan, of sla deze stap over.")}`.trim()
                  );
                } else {
                  setStatsFoto(url);
                }
              } catch {
                setMsg(t("Screenshot uploaden mislukt."));
              } finally {
                setStatsBusy(false);
              }
            }}
          />
          {statsBusy ? (
            <span className={styles.fotoHint}><Waiting label={t("Uploaden")} /></span>
          ) : statsFoto ? (
            <span className={styles.fotoChange}>{t("Andere screenshot")}</span>
          ) : (
            <span className={styles.fotoHint}>＋ {t("Upload screenshot")}</span>
          )}
        </label>

        {msg && <p className={styles.msg}>{msg}</p>}
      </div>

      <div className={styles.footer}>
        <button className="btn btn-gold" style={{ flex: 1 }} disabled={!kanOpslaan} onClick={opslaan}>
          {saving ? <Waiting label={t("Opslaan")} /> : t("Opslaan")}
        </button>
      </div>
    </div>
  );
}
