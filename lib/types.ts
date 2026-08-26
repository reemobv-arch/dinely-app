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
  kortingPct?: number; // korting voor de gast via de creator-deellink (default 20)
  eisen: PlatformEis[];
  eisRegio: string;
  geslacht: Gender;
  plekken: number;
  gevraagd: string;
  looptijdDagen: number;
  zichtbaarheid?: "open" | "invite"; // invite = exclusief, alleen genodigde creators
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
  toelichting?: string; // motivatie als de creator onder de bereik-eis zit
  linkCode?: string; // unieke deel-link die de creator na acceptatie krijgt
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
  soort?: "food" | "sfeer"; // food-content of sfeer-content
  gerecht?: string; // welk gerecht (bij food)
  goedgekeurd?: boolean;
  uitgelicht?: boolean; // door het restaurant op het publieke profiel gezet
  createdAt?: Stamp;
};

// Unieke deel-link van een creator voor een deal (collectie "links"), publiek leesbaar.
export type ReferralLink = {
  code: string;
  restaurantId: string;
  dealId: string;
  creatorUid: string;
  creatorNaam?: string;
  kortingPct: number;
  createdAt?: Stamp;
};

// Reservering die een gast via zo'n deel-link achterlaat (collectie "reservations").
export type Reservation = {
  id?: string;
  restaurantId: string;
  dealId: string;
  creatorUid: string;
  linkCode: string;
  naam: string;
  email: string;
  telefoon: string;
  leeftijd?: number;
  aantal: number;
  metWie?: string;
  createdAt?: Stamp;
};

export type Review = {
  id?: string;
  restaurantId: string;
  creatorUid?: string;
  naam: string;
  // Sterren-categorieën (0-5) die de creator geeft.
  communicatie?: number;
  voedsel?: number;
  sfeer?: number;
  waarde?: number;
  // Afgeleid, voor compatibiliteit met bestaande weergaven.
  food: number;
  vibe: number;
  service: number;
  sterren: number;
  tekst: string;
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
