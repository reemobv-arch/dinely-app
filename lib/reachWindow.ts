// Bepaalt of een creator het bereik/de statistieken al mag doorgeven. Dat kan
// pas 48 uur na het bezoek (eerst content plaatsen, daarna het bereik meten).

const UREN_48 = 48 * 60 * 60 * 1000;

export function reachBeschikbaar(
  bezoekDatum?: string,
  bezoekTijd?: string,
  now: number = Date.now()
): boolean {
  if (!bezoekDatum) return true; // geen datum bekend -> niet blokkeren
  const tijd = bezoekTijd && /^\d{1,2}:\d{2}$/.test(bezoekTijd) ? bezoekTijd : "00:00";
  const dt = new Date(`${bezoekDatum}T${tijd.padStart(5, "0")}:00`);
  if (Number.isNaN(dt.getTime())) return true;
  return now >= dt.getTime() + UREN_48;
}
