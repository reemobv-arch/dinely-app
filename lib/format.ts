export function formatNL(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function todayISO(): string {
  // Lokale datum (niet UTC), anders klopt de datum 's avonds/'s nachts niet.
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Datum n dagen na een YYYY-MM-DD (bijv. voor een max-datum). */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Ligt een YYYY-MM-DD-datum vóór vandaag? */
export function isPastISO(iso: string): boolean {
  return !!iso && iso < todayISO();
}
