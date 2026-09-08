// Voortgang van een aangevraagde/lopende deal voor de creator. Pure logica zodat
// het "Mijn deals"-scherm (Lopend/Aangevraagd/Klaar) testbaar blijft.

type App = {
  status?: "wacht" | "geaccepteerd" | "afgewezen";
  bezoekDatum?: string;
  bezoekTijd?: string;
  bezoekBevestigd?: boolean;
  contentPosted?: boolean;
  reachSubmitted?: boolean;
  datumGewijzigd?: boolean;
};

export const VOORTGANG_STAPPEN = ["Aangevraagd", "Geaccepteerd", "Bezoek", "Content", "Bereik"];

export type DealFase =
  | "aangevraagd" // wacht op accept van het restaurant
  | "gewijzigd" // datum aangepast, wacht op herbevestiging
  | "gepland" // geaccepteerd, bezoek staat in de toekomst -> instructies tonen
  | "teDoen" // bezoek bevestigd -> content/bereik doorgeven
  | "klaar";

export function dealVoortgang(a: App): { gedaan: number; totaal: number; fase: DealFase; klaar: boolean } {
  const geaccepteerd = a.status === "geaccepteerd";
  const bezoek = !!a.bezoekBevestigd;
  const content = !!a.contentPosted;
  const bereik = !!a.reachSubmitted;
  const gedaan = [true, geaccepteerd, bezoek, content, bereik].filter(Boolean).length;
  const klaar = geaccepteerd && content && bereik;

  let fase: DealFase;
  if (!geaccepteerd) fase = "aangevraagd";
  else if (klaar) fase = "klaar";
  else if (a.datumGewijzigd) fase = "gewijzigd";
  else if (!bezoek) fase = "gepland";
  else fase = "teDoen";

  return { gedaan, totaal: 5, fase, klaar };
}

// In welke tab hoort deze deal thuis.
export function dealTab(a: App): "lopend" | "aangevraagd" | "klaar" {
  if (a.status === "geaccepteerd") {
    return dealVoortgang(a).klaar ? "klaar" : "lopend";
  }
  return "aangevraagd"; // wacht of afgewezen
}
