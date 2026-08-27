// Kleine stale-while-revalidate cache in localStorage: toon de laatst bekende
// data meteen, ververs op de achtergrond. Puur best-effort (nooit blokkeren).

export function readSnapshot<T>(key: string): T | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

export function writeSnapshot(key: string, data: unknown): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* vol of uitgeschakeld: geen cache */
  }
}
