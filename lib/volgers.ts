// Volgers-logica: intern tellen we een totaal op, maar in de UI tonen we ze
// ALTIJD per kanaal (nooit opgeteld) als iemand twee kanalen heeft.

export function totaalVolgers(ig?: number, tt?: number): number {
  return (ig || 0) + (tt || 0);
}

/** "Instagram 24.000 · TikTok 12.000", of alleen het kanaal dat is ingevuld. */
export function perChannelVolgers(ig?: number, tt?: number): string {
  const parts: string[] = [];
  if (ig && ig > 0) parts.push(`Instagram ${ig.toLocaleString("nl-NL")}`);
  if (tt && tt > 0) parts.push(`TikTok ${tt.toLocaleString("nl-NL")}`);
  return parts.join(" · ");
}
