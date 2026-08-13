"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/appauth";
import { updateMyStad, getMyCreator, updateMyPayout } from "@/lib/appdata";
import { enablePush, savePushPrefs, DEFAULT_PREFS, type PushPrefs } from "@/lib/push";
import styles from "./instellingen.module.css";

export default function InstellingenPage() {
  const router = useRouter();
  const { session, uid, loading, profile, saveProfile } = useApp();

  const [stad, setStad] = useState(profile.regio || "Amsterdam");
  const [pushOn, setPushOn] = useState(false);
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PREFS);
  const [iban, setIban] = useState("");
  const [ibanNaam, setIbanNaam] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  useEffect(() => {
    setStad(profile.regio || "Amsterdam");
    try {
      setPushOn(localStorage.getItem("dinely-app:pushOn") === "1");
      const p = localStorage.getItem("dinely-app:pushPrefs");
      if (p) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(p) });
    } catch {
      /* negeer */
    }
  }, [profile.regio]);

  function persistPrefs(next: PushPrefs, on: boolean) {
    try {
      localStorage.setItem("dinely-app:pushPrefs", JSON.stringify(next));
      localStorage.setItem("dinely-app:pushOn", on ? "1" : "0");
    } catch {
      /* negeer */
    }
  }

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const c = await getMyCreator(uid);
        if (c?.iban) setIban(c.iban);
        if (c?.ibanNaam) setIbanNaam(c.ibanNaam);
      } catch {
        /* negeer */
      }
    })();
  }, [uid]);

  async function saveStad() {
    saveProfile({ ...profile, regio: stad });
    try {
      await updateMyStad(stad);
    } catch {
      /* negeer */
    }
  }

  async function saveIban() {
    try {
      await updateMyPayout(iban.trim().toUpperCase(), ibanNaam.trim());
    } catch {
      /* negeer */
    }
  }

  async function toggleMaster() {
    if (!pushOn) {
      setMsg("Notificaties aanzetten…");
      const res = await enablePush(prefs);
      if (res === "ok") {
        setPushOn(true);
        persistPrefs(prefs, true);
        setMsg("Notificaties staan aan ✓");
      } else if (res === "denied") {
        setMsg("Je hebt meldingen geblokkeerd. Zet ze aan in je browser-/telefooninstellingen.");
      } else if (res === "unsupported") {
        setMsg("Deze browser ondersteunt geen push. Zet de app op je beginscherm en probeer opnieuw.");
      } else {
        setMsg("Aanzetten lukte niet. Probeer het opnieuw.");
      }
    } else {
      setPushOn(false);
      persistPrefs(prefs, false);
      await savePushPrefs(prefs, false);
      setMsg("Notificaties staan uit.");
    }
  }

  function togglePref(k: keyof PushPrefs) {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    persistPrefs(next, pushOn);
    if (pushOn) savePushPrefs(next, true);
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <Link href="/mij" className={styles.back}>‹</Link>
        <div className={styles.brand}>Instellingen</div>
        <div style={{ width: 30 }} />
      </header>

      <div className={styles.body}>
        <div className={styles.groupLbl}>Account</div>
        <div className={styles.card}>
          <div className={styles.rowStatic}>
            <span>Telefoonnummer</span>
            <b>{session?.phone || "—"}</b>
          </div>
          <div className={styles.rowStatic}>
            <span>E-mailadres</span>
            <b>—</b>
          </div>
          <div className={styles.rowEdit}>
            <label className={styles.editLbl}>Stad</label>
            <input
              className={styles.editInput}
              value={stad}
              onChange={(e) => setStad(e.target.value)}
              onBlur={saveStad}
              placeholder="Amsterdam"
            />
          </div>
        </div>
        <p className={styles.hint}>Telefoonnummer en e-mail horen bij je account en kun je niet wijzigen. Je stad wel, bijvoorbeeld als je verhuist.</p>

        <div className={styles.groupLbl}>Uitbetaling</div>
        <div className={styles.card}>
          <div className={styles.rowEdit}>
            <label className={styles.editLbl}>IBAN</label>
            <input
              className={styles.editInput}
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              onBlur={saveIban}
              placeholder="NL00 BANK 0000 0000 00"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>
          <div className={styles.rowEdit}>
            <label className={styles.editLbl}>Naam op rekening</label>
            <input
              className={styles.editInput}
              value={ibanNaam}
              onChange={(e) => setIbanNaam(e.target.value)}
              onBlur={saveIban}
              placeholder="J. Bakker"
            />
          </div>
        </div>
        <p className={styles.hint}>Hierop maken we je verdiensten over zodra een restaurant je content heeft goedgekeurd.</p>

        <div className={styles.groupLbl}>Notificaties</div>
        <div className={styles.card}>
          <Toggle label="Push-notificaties" checked={pushOn} onChange={toggleMaster} strong />
          <div className={`${styles.subs} ${pushOn ? "" : styles.subsOff}`}>
            <Toggle label="Bij goedkeuring of afwijzing" checked={prefs.approval} onChange={() => togglePref("approval")} />
            <Toggle label="Als een deal is geaccepteerd" checked={prefs.accepted} onChange={() => togglePref("accepted")} />
            <Toggle label="Nieuwe deals in jouw stad" checked={prefs.newDeals} onChange={() => togglePref("newDeals")} />
          </div>
        </div>
        {msg && <p className={styles.msg}>{msg}</p>}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  strong,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  strong?: boolean;
}) {
  return (
    <button type="button" className={styles.toggleRow} onClick={onChange}>
      <span className={strong ? styles.toggleStrong : styles.toggleLbl}>{label}</span>
      <span className={`${styles.switch} ${checked ? styles.switchOn : ""}`}>
        <span className={styles.knob} />
      </span>
    </button>
  );
}
