// Bepaalt wat een creator nog moet invullen voordat het profiel "af" is.
// Eén bron van waarheid voor het rode puntje (Mijn / Instellingen) én voor de
// checklist op het instellingen-scherm.

export type ProfileGap = "iban" | "ibanNaam" | "socials";

export const GAP_LABEL: Record<ProfileGap, string> = {
  iban: "IBAN",
  ibanNaam: "Rekeninghouder",
  socials: "Social media (Instagram of TikTok)",
};

export function profileGaps(p: {
  iban?: string;
  ibanNaam?: string;
  instagram?: string;
  tiktok?: string;
}): ProfileGap[] {
  const gaps: ProfileGap[] = [];
  if (!p.iban?.trim()) gaps.push("iban");
  if (!p.ibanNaam?.trim()) gaps.push("ibanNaam");
  if (!p.instagram?.trim() && !p.tiktok?.trim()) gaps.push("socials");
  return gaps;
}

export function isProfileComplete(p: {
  iban?: string;
  ibanNaam?: string;
  instagram?: string;
  tiktok?: string;
}): boolean {
  return profileGaps(p).length === 0;
}
