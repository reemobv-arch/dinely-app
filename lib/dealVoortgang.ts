// Voortgang van een aangevraagde/lopende deal voor de creator. Pure logica zodat
// het "Mijn deals"-scherm (Lopend/Aangevraagd/Klaar) testbaar blijft.

type App = {
  status?: "wacht" | "geaccepteerd" | "afgewezen";
  bezoekDatum?: string;
  bezoekTijd?: string;
  bezoekBevestigd?: boolean;
  contentPosted?: boolean;
  reachSubmitted?: boolean;
  betaalStatus?: "open" | "betaald" | "uitbetaald";
  datumGewijzigd?: boolean;
};

// 6 stappen: content (binnen 48u) en statistieken (na 48u) zijn aparte stappen.
export const VOORTGANG_STAPPEN = [
  "Sollicitatie",
  "Geaccepteerd",
  "Datum gepland",
  "Content uploaden",
  "Statistieken",
  "Betaald",
];

export type DealFase =
  | "aangevraagd" // wacht op accept van het restaurant
  | "gewijzigd" // datum aangepast, wacht op herbevestiging
  | "gepland" // geaccepteerd, bezoek staat in de toekomst -> instructies tonen
  | "teDoen" // bezoek bevestigd -> content/statistieken doorgeven
  | "klaar";

// isBetaald: bij een betaalde deal telt de laatste stap "Betaald" pas als de
// uitbetaling is gedaan; bij een gratis diner is de deal klaar zodra de
// statistieken zijn geleverd (er gaat geen cash naar de creator).
export function dealVoortgang(a: App, isBetaald = false): { gedaan: number; totaal: number; fase: DealFase; klaar: boolean } {
  const geaccepteerd = a.status === "geaccepteerd";
  const bezoek = !!a.bezoekBevestigd;
  const content = !!a.contentPosted;
  const stats = !!a.reachSubmitted;
  const betaald = isBetaald ? a.betaalStatus === "uitbetaald" : stats;

  const flags = [true, geaccepteerd, bezoek, content, stats, betaald];
  let gedaan = 0;
  for (const f of flags) {
    if (f) gedaan++;
    else break;
  }
  const klaar = betaald && stats && content;

  let fase: DealFase;
  if (!geaccepteerd) fase = "aangevraagd";
  else if (klaar) fase = "klaar";
  else if (a.datumGewijzigd) fase = "gewijzigd";
  else if (!bezoek) fase = "gepland";
  else fase = "teDoen";

  return { gedaan, totaal: 6, fase, klaar };
}

// In welke tab hoort deze deal thuis.
export function dealTab(a: App, isBetaald = false): "lopend" | "aangevraagd" | "klaar" {
  if (a.status === "geaccepteerd") {
    return dealVoortgang(a, isBetaald).klaar ? "klaar" : "lopend";
  }
  return "aangevraagd"; // wacht of afgewezen
}
