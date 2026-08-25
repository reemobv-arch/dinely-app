"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
};

const DISMISS_KEY = "dinely:install-dismissed";

// Pop-up (modal) die helpt de app op het beginscherm te zetten. Verschijnt gecentreerd
// met een donkere waas over het hele scherm, alleen als de app nog niet is geïnstalleerd.
// De gebruiker kiest z'n toestel (iPhone / Android); daarachter staat de uitleg per systeem.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [choice, setChoice] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* geen storage */
    }

    // Android/Chrome geeft dit signaal; we bewaren het voor de echte install-knop.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const timer = setTimeout(() => setShow(true), 1200);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* negeer */
    }
  }

  async function androidInstall() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* negeer */
    }
    dismiss();
  }

  if (!show) return null;

  const goldBtn: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 100,
    fontFamily: "var(--ff-mono,inherit)",
    fontSize: 12,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#20180a",
    background: "linear-gradient(180deg, var(--gold-2,#e4c67e), var(--gold,#c9a24b))",
    boxShadow: "0 12px 30px -10px rgba(201,162,75,.55)",
  };
  const stepBox: React.CSSProperties = {
    textAlign: "left",
    fontSize: 14,
    color: "var(--text,#f5f0e7)",
    lineHeight: 1.7,
    background: "var(--bg-2,#28221b)",
    border: "1px solid var(--line-2,#564a3f)",
    borderRadius: 14,
    padding: "14px 16px",
  };

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        background: "rgba(6,4,3,.72)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Zet Dinely op je beginscherm"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "linear-gradient(180deg, var(--surface-2,#3c3227), var(--surface,#332a22))",
          border: "1px solid var(--gold-dim,#8c7231)",
          borderRadius: 22,
          boxShadow: "0 40px 90px -24px rgba(0,0,0,.85)",
          padding: "26px 24px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Sluiten"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: "50%",
            color: "var(--muted,#b4a797)",
            border: "1px solid var(--line-2,#564a3f)",
            fontSize: 16,
          }}
        >
          ×
        </button>

        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 22,
            color: "var(--text,#f5f0e7)",
            marginBottom: 6,
          }}
        >
          Zet Dinely op je beginscherm
        </div>

        {choice === null && (
          <>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--muted,#b4a797)", margin: "0 0 20px" }}>
              Open Dinely voortaan als een echte app. Welk toestel heb je?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <DeviceTile label="iPhone" onClick={() => setChoice("ios")} icon={<AppleIcon />} />
              <DeviceTile label="Android" onClick={() => setChoice("android")} icon={<AndroidIcon />} />
            </div>
          </>
        )}

        {choice === "ios" && (
          <>
            <div style={{ margin: "6px auto 16px" }}>
              <AppleIcon size={40} />
            </div>
            <div style={stepBox}>
              <div>
                1. Tik onderin op het <b>Deel</b>-icoon{" "}
                <span aria-hidden style={{ color: "var(--gold,#c9a24b)" }}>⬆︎</span>
              </div>
              <div>
                2. Kies <b>Zet op beginscherm</b>
              </div>
              <div>
                3. Tik op <b>Voeg toe</b>
              </div>
            </div>
            <BackLink onClick={() => setChoice(null)} />
          </>
        )}

        {choice === "android" && (
          <>
            <div style={{ margin: "6px auto 16px" }}>
              <AndroidIcon size={40} />
            </div>
            {deferred ? (
              <button onClick={androidInstall} style={goldBtn}>
                Installeer de app
              </button>
            ) : (
              <div style={stepBox}>
                <div>
                  1. Tik rechtsboven op het <b>menu</b> (⋮)
                </div>
                <div>
                  2. Kies <b>App installeren</b> of <b>Toevoegen aan startscherm</b>
                </div>
                <div>
                  3. Tik op <b>Installeren</b>
                </div>
              </div>
            )}
            <BackLink onClick={() => setChoice(null)} />
          </>
        )}
      </div>
    </div>
  );
}

function DeviceTile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "22px 12px",
        borderRadius: 16,
        background: "var(--bg-2,#28221b)",
        border: `1px solid ${hover ? "var(--gold,#c9a24b)" : "var(--line-2,#564a3f)"}`,
        transition: ".18s",
        transform: hover ? "translateY(-2px)" : "none",
      }}
    >
      {icon}
      <span
        style={{
          fontFamily: "var(--ff-mono,inherit)",
          fontSize: 12,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: hover ? "var(--gold,#c9a24b)" : "var(--text,#f5f0e7)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ marginTop: 16, fontSize: 13, color: "var(--muted-2,#867b6c)" }}>
      ‹ Ander toestel
    </button>
  );
}

function AppleIcon({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--text,#f5f0e7)" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.75.84-1.98 1.49-3.02 1.41-.13-1.1.42-2.26 1.09-3 .76-.83 2.06-1.44 3.05-1.39zM20.5 17.02c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.52-4.12 3.53-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.01-3.05-1.77-4.04-3.34C-.13 16.9-.34 12.02 1.4 9.47c1.02-1.5 2.63-2.38 4.15-2.38 1.55 0 2.52 1 3.8 1 1.24 0 2-1 3.8-1 1.36 0 2.8.74 3.83 2.02-3.36 1.84-2.82 6.64.52 7.91z" />
    </svg>
  );
}

function AndroidIcon({ size = 46 }: { size?: number }) {
  const g = "#7cbb3a";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={g} aria-hidden>
      <path d="M6 9v7a1.5 1.5 0 0 0 1.5 1.5H8V20a1 1 0 1 0 2 0v-2.5h4V20a1 1 0 1 0 2 0v-2.5h.5A1.5 1.5 0 0 0 18 16V9H6zM3.5 9A1.5 1.5 0 0 0 2 10.5v4a1.5 1.5 0 0 0 3 0v-4A1.5 1.5 0 0 0 3.5 9zm17 0A1.5 1.5 0 0 0 19 10.5v4a1.5 1.5 0 0 0 3 0v-4A1.5 1.5 0 0 0 20.5 9zM15.6 3.2l.9-1.3a.3.3 0 1 0-.5-.35l-.94 1.34A6.3 6.3 0 0 0 12 2.2c-1.1 0-2.14.24-3.06.69L8 1.55a.3.3 0 0 0-.5.35l.9 1.3A5.6 5.6 0 0 0 6 8h12a5.6 5.6 0 0 0-2.4-4.8zM9.5 6.2a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4zm5 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z" />
    </svg>
  );
}
