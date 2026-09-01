// Bereik-bewijs: één of meer posts met het bereik (aantal mensen bereikt),
// óf via een geüploade statistieken-screenshot óf handmatig ingevuld.

export type ReachEntry = {
  datum?: string; // ISO datum van de post
  kanaal?: string; // Instagram / TikTok / …
  bereik: number; // aantal mensen bereikt
  foto?: string; // optionele screenshot
  statsGeldig?: boolean;
};

/** Som van het bereik over alle posts (negatieve/ongeldige waarden tellen als 0). */
export function reachTotal(entries: ReachEntry[]): number {
  return entries.reduce(
    (s, e) => s + (Number.isFinite(e.bereik) && e.bereik > 0 ? Math.floor(e.bereik) : 0),
    0
  );
}

/** Een post is bruikbaar als er een kanaal + bereikcijfer is, of een screenshot. */
export function isValidEntry(e: { kanaal?: string; bereik?: number; foto?: string }): boolean {
  const heeftBereik = typeof e.bereik === "number" && e.bereik > 0;
  const heeftKanaal = !!e.kanaal?.trim();
  return (heeftBereik && heeftKanaal) || !!e.foto;
}

/** Kunnen we het bereik-bewijs indienen? Minstens één bruikbare post. */
export function canSubmitReach(entries: Array<{ kanaal?: string; bereik?: number; foto?: string }>): boolean {
  return entries.some(isValidEntry);
}
