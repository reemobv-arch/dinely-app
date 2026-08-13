// Bepaalt of een creator aan de bereik-eisen van een deal voldoet.
// Een deal zonder eisen staat voor iedereen open. Bij eisen volstaat het als de
// creator op minstens één geëist platform genoeg volgers heeft.

export type Eis = { platform: string; minVolgers: number };

export function qualifiesForDeal(
  eisen: Eis[] | undefined,
  platforms: string,
  volgers: number
): boolean {
  const list = eisen ?? [];
  if (list.length === 0) return true;
  return list.some(
    (e) =>
      platforms.toLowerCase().includes(e.platform.toLowerCase()) && volgers >= e.minVolgers
  );
}
