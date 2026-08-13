// Betaalde deals: Dinely houdt 15%, de creator krijgt 85%.
export const DINELY_FEE = 0.15;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Commissie voor Dinely (15%). */
export function dinelyFee(bedrag: number): number {
  return round2((bedrag || 0) * DINELY_FEE);
}

/** Bedrag dat de creator ontvangt (85%). */
export function creatorShare(bedrag: number): number {
  return round2((bedrag || 0) * (1 - DINELY_FEE));
}
