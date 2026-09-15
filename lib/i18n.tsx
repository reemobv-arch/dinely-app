"use client";

// Simpel taalsysteem NL/EN. We houden de Nederlandse tekst als "sleutel": t("...")
// geeft in het Engels de vertaling uit het woordenboek terug, en anders gewoon de
// Nederlandse tekst. Ontbreekt een vertaling, dan valt-ie veilig terug op NL.
// De keuze wordt onthouden in localStorage zodat de hele app in dezelfde taal blijft.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { EN } from "./translations";

export type Lang = "nl" | "en";
const KEY = "dinely:lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (nl: string) => string;
};

const LangContext = createContext<Ctx>({ lang: "nl", setLang: () => {}, t: (s) => s });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "nl") setLangState(saved);
    } catch {
      /* localStorage kan geblokkeerd zijn */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* negeren */
    }
    try {
      document.documentElement.setAttribute("lang", l);
    } catch {
      /* negeren */
    }
  }, []);

  const t = useCallback(
    (nl: string) => (lang === "en" ? EN[nl] ?? nl : nl),
    [lang]
  );

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useI18n(): Ctx {
  return useContext(LangContext);
}

// Handige korte hook: const t = useT();
export function useT(): (nl: string) => string {
  return useContext(LangContext).t;
}
