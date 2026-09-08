import type { Restaurant, Media } from "./types";

// Heeft het restaurant minstens één echte foto (sfeer of eten)?
export function heeftFoto(m?: Media | null): boolean {
  const sfeer = (m?.sfeer ?? []).some((x) => !!x);
  const eten = (m?.eten ?? []).some((x) => !!x);
  return sfeer || eten;
}

// Is het profiel "afgemaakt" genoeg om in de app en op de kaart te tonen? We eisen
// de basis die een gast nodig heeft: naam, adres, keuken, omschrijving en een foto.
export function isProfielCompleet(r: Partial<Restaurant> | null | undefined): boolean {
  if (!r) return false;
  const gevuld = (v?: string) => !!(v && v.trim());
  // Stad is aanbevolen (kaart/filter) maar niet verplicht om zichtbaar te zijn.
  return (
    gevuld(r.naam) &&
    gevuld(r.adres) &&
    gevuld(r.keuken) &&
    gevuld(r.omschrijving) &&
    heeftFoto(r.media)
  );
}
