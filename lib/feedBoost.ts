// Feed-boost: op-maat restaurants kunnen betalen om hoger in de feed/ontdek te
// staan. Hogere prioriteit = hoger. 0 = geen boost. (Spiegelt tably-dashboard.)
export function feedBoost(rest: { addons?: string[] } | null | undefined): number {
  const a = rest?.addons ?? [];
  if (a.includes("feed_top")) return 3;
  if (a.includes("feed_top5")) return 2;
  if (a.includes("feed_top10")) return 1;
  return 0;
}

// Sorteert restaurants met een boost naar voren, verder stabiel (oorspronkelijke
// volgorde blijft binnen dezelfde boost).
export function sorteerOpBoost<T extends { addons?: string[] }>(rows: T[]): T[] {
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => feedBoost(b.r) - feedBoost(a.r) || a.i - b.i)
    .map((x) => x.r);
}
