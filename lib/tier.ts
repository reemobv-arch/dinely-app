// Creator-niveaus op basis van opgespaarde waarderingspunten.
// Onder de 25 punten: nog geen niveau. Daarna Bronze / Silver / Gold.
export type Tier = "bronze" | "silver" | "gold";

export const TIER_MIN: Record<Tier, number> = { bronze: 25, silver: 75, gold: 250 };
export const TIER_LABEL: Record<Tier, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold" };
export const TIER_COLOR: Record<Tier, string> = {
  bronze: "#c98a5a",
  silver: "#c3cdd6",
  gold: "#e4c67e",
};
export const TIER_ORDER: Tier[] = ["bronze", "silver", "gold"];

export function creatorTier(punten?: number): Tier | null {
  const p = punten ?? 0;
  if (p >= TIER_MIN.gold) return "gold";
  if (p >= TIER_MIN.silver) return "silver";
  if (p >= TIER_MIN.bronze) return "bronze";
  return null;
}

// Het eerstvolgende niveau + hoeveel punten er nog nodig zijn (null als al Gold).
export function nextTier(punten?: number): { tier: Tier; over: number } | null {
  const p = punten ?? 0;
  for (const t of TIER_ORDER) {
    if (p < TIER_MIN[t]) return { tier: t, over: TIER_MIN[t] - p };
  }
  return null;
}
