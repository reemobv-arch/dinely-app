export type Gender = "vrouw" | "man" | "alle";

export type PlatformEis = { platform: string; minVolgers: number };

// createdAt heeft in Firestore (Timestamp) én in demo-modus ({ seconds }) een .seconds.
export type Stamp = { seconds: number };

export type Media = {
  sfeer: (string | null)[]; // sfeerfoto's (swipebaar in de hero)
  eten?: (string | null)[]; // eten & drinken
  video: string | null;
  menu?: string | null; // legacy
  drank?: string | null; // legacy
};

export type Restaurant = {
  owner?: string;
  naam: string;
  adres: string;
  keuken: string;
  prijs: string;
  sfeer: string;
  omschrijving: string;
  media: Media;
  lat?: number;
  lng?: number;
  updatedAt?: Stamp;
};

export type Deal = {
  id?: string;
  owner: string;
  restaurantId: string;
  titel: string;
  omschrijving: string;
  beloningstype: "betaald" | "gratis";
  bedrag: number;
  eisen: PlatformEis[];
  eisRegio: string;
  geslacht: Gender;
  plekken: number;
  gevraagd: string;
  looptijdDagen: number;
  status: "open" | "gesloten";
  createdAt?: Stamp;
};

export type Application = {
  id?: string;
  dealId: string;
  restaurantId: string;
  creatorUid?: string;
  handle: string;
  volgers: number;
  platform: string;
  regio: string;
  geslacht: "vrouw" | "man" | "";
  bezoekDatum?: string; // ISO datum (YYYY-MM-DD) die de creator koos
  bezoekBevestigd?: boolean; // restaurant heeft het bezoek bevestigd
  reviewed?: boolean;
  contentPosted?: boolean;
  betaalStatus?: "open" | "betaald" | "uitbetaald";
  bedrag?: number;
  status: "wacht" | "geaccepteerd" | "afgewezen";
  createdAt?: Stamp;
};

export type ContentItem = { url: string; type: "image" | "video" };

export type Content = {
  id?: string;
  restaurantId: string;
  dealId: string;
  creatorUid: string;
  naam: string;
  caption: string;
  media: ContentItem[];
  goedgekeurd?: boolean;
  createdAt?: Stamp;
};

export type Review = {
  id?: string;
  restaurantId: string;
  creatorUid?: string;
  naam: string;
  food: number;
  vibe: number;
  service: number;
  sterren: number;
  tekst: string;
  vibeGoed?: string;
  vibeMinder?: string;
  etenGoed?: string;
  etenMinder?: string;
  createdAt?: Stamp;
};

export const EMPTY_RESTAURANT: Restaurant = {
  naam: "",
  adres: "",
  keuken: "",
  prijs: "€€",
  sfeer: "",
  omschrijving: "",
  media: { sfeer: [null, null, null], video: null, menu: null, drank: null },
};
