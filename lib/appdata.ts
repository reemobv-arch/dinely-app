import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, firebaseReady } from "./firebase";
import type {
  Restaurant,
  Deal,
  Review,
  Application,
  Content,
  ContentItem,
  ReferralLink,
  Reservation,
} from "./types";

export type NewApplication = {
  dealId: string;
  restaurantId: string;
  handle: string;
  volgers: number;
  platform: string;
  regio: string;
  geslacht: "vrouw" | "man" | "";
  bezoekDatum: string;
  toelichting?: string; // motivatie als de creator (nog) niet aan de bereik-eis voldoet
};

/**
 * Sollicitatie wegschrijven. Vereist een (anonieme) Firebase-login.
 * Gooit een fout als dat niet lukt, zodat de UI het kan melden.
 */
export async function createApplication(app: NewApplication): Promise<void> {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not-signed-in");
  await addDoc(collection(db, "applications"), {
    ...app,
    creatorUid: uid,
    reviewed: false,
    status: "wacht",
    createdAt: serverTimestamp(),
  });
  // Best-effort: het restaurant een mail sturen over de nieuwe sollicitatie.
  try {
    const base = process.env.NEXT_PUBLIC_DASHBOARD_URL;
    const idToken = await auth.currentUser?.getIdToken();
    if (base && idToken) {
      void fetch(`${base}/api/notify-application`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          restaurantId: app.restaurantId,
          dealId: app.dealId,
          handle: app.handle,
        }),
      }).catch(() => {});
    }
  } catch {
    /* mail is bijzaak, nooit de sollicitatie-flow blokkeren */
  }
}

export type NewReview = {
  restaurantId: string;
  naam: string;
  sterren: number;
  vibeGoed: string;
  vibeMinder: string;
  etenGoed: string;
  etenMinder: string;
};

/** Review wegschrijven. vibe/food-cijfers worden afgeleid uit de sterren
 *  zodat de dashboard-scores blijven werken. */
export async function createReview(r: NewReview): Promise<void> {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not-signed-in");
  const tekst = [
    r.vibeGoed && `Vibe (top): ${r.vibeGoed}`,
    r.vibeMinder && `Vibe (minder): ${r.vibeMinder}`,
    r.etenGoed && `Eten (top): ${r.etenGoed}`,
    r.etenMinder && `Eten (minder): ${r.etenMinder}`,
  ].filter(Boolean).join("\n");
  await addDoc(collection(db, "reviews"), {
    restaurantId: r.restaurantId,
    creatorUid: uid,
    naam: r.naam || "Creator",
    sterren: r.sterren,
    vibe: Math.round(r.sterren * 2 * 10) / 10, // op schaal /10
    food: r.sterren, // op schaal /5
    service: r.sterren,
    vibeGoed: r.vibeGoed,
    vibeMinder: r.vibeMinder,
    etenGoed: r.etenGoed,
    etenMinder: r.etenMinder,
    tekst,
    createdAt: serverTimestamp(),
  });
}

export async function markApplicationReviewed(id: string): Promise<void> {
  if (!firebaseReady) return;
  await updateDoc(doc(db, "applications", id), { reviewed: true });
}

// ---------- content (foto's/video die de creator plaatst) ----------
export async function uploadContentFile(file: File): Promise<ContentItem> {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not-signed-in");
  const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
  const name = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const r = ref(storage, `content/${uid}/${name}`);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return { url, type };
}

export async function createContent(c: {
  restaurantId: string;
  dealId: string;
  naam: string;
  caption: string;
  media: ContentItem[];
}): Promise<void> {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not-signed-in");
  await addDoc(collection(db, "content"), {
    ...c,
    creatorUid: uid,
    createdAt: serverTimestamp(),
  });
  // Best-effort: het restaurant een mail sturen over de nieuwe content.
  try {
    const base = process.env.NEXT_PUBLIC_DASHBOARD_URL;
    const idToken = await auth.currentUser?.getIdToken();
    if (base && idToken) {
      void fetch(`${base}/api/notify-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          restaurantId: c.restaurantId,
          dealId: c.dealId,
          naam: c.naam,
        }),
      }).catch(() => {});
    }
  } catch {
    /* mail is bijzaak, nooit de content-flow blokkeren */
  }
}

export async function markApplicationContentPosted(id: string): Promise<void> {
  if (!firebaseReady) return;
  await updateDoc(doc(db, "applications", id), { contentPosted: true });
}

export async function listContentFor(restaurantId: string): Promise<Content[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(
    query(collection(db, "content"), where("restaurantId", "==", restaurantId))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Content) }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

// ---------- deel-links + reserveringen (gast-flow) ----------

// Haalt een deel-link op via zijn code. Publiek leesbaar (geen login nodig).
export async function getReferralLink(code: string): Promise<ReferralLink | null> {
  if (!firebaseReady || !code) return null;
  const snap = await getDoc(doc(db, "links", code));
  return snap.exists() ? (snap.data() as ReferralLink) : null;
}

export type NewReservation = {
  naam: string;
  email: string;
  telefoon: string;
  leeftijd?: number;
  aantal: number;
  metWie?: string;
};

// Legt een reservering vast die aan een deel-link (en dus creator/deal) hangt.
// Geen login nodig: de gast komt binnen via de link.
export async function createReservation(
  link: ReferralLink,
  data: NewReservation
): Promise<void> {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const payload: Omit<Reservation, "id"> = {
    restaurantId: link.restaurantId,
    dealId: link.dealId,
    creatorUid: link.creatorUid,
    linkCode: link.code,
    naam: data.naam,
    email: data.email,
    telefoon: data.telefoon,
    aantal: data.aantal,
    ...(data.leeftijd != null ? { leeftijd: data.leeftijd } : {}),
    ...(data.metWie ? { metWie: data.metWie } : {}),
    createdAt: serverTimestamp() as unknown as Reservation["createdAt"],
  };
  const ref = await addDoc(collection(db, "reservations"), payload);
  // Best-effort: het restaurant mailen over de nieuwe reservering.
  try {
    const base = process.env.NEXT_PUBLIC_DASHBOARD_URL;
    if (base) {
      void fetch(`${base}/api/notify-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: ref.id }),
      }).catch(() => {});
    }
  } catch {
    /* mail is bijzaak, nooit de reservering blokkeren */
  }
}

// Publieke leeslaag voor de app. Restaurants/deals/reviews zijn publiek leesbaar
// (zie firestore.rules), dus hier is geen login nodig om te browsen.

export type PublicRestaurant = Restaurant & { id: string };

export async function listRestaurants(): Promise<PublicRestaurant[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(collection(db, "restaurants"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Restaurant) }));
}

export async function getRestaurantById(id: string): Promise<PublicRestaurant | null> {
  if (!firebaseReady) return null;
  const snap = await getDoc(doc(db, "restaurants", id));
  return snap.exists() ? { id, ...(snap.data() as Restaurant) } : null;
}

export async function listAllDeals(): Promise<Deal[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(collection(db, "deals"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Deal) }));
}

export async function listDealsFor(id: string): Promise<Deal[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(query(collection(db, "deals"), where("owner", "==", id)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Deal) }));
}

export async function listReviewsFor(id: string): Promise<Review[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(
    query(collection(db, "reviews"), where("restaurantId", "==", id))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Review) }));
}

// Profielfoto van de creator uploaden (verplicht in de onboarding).
export async function uploadCreatorPhoto(file: File): Promise<string> {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not-signed-in");
  const r = ref(storage, `creators/${uid}/foto-${Date.now()}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

export async function saveCreator(p: {
  naam: string;
  email?: string;
  instagram: string;
  tiktok: string;
  volgers: number;
  igVolgers?: number;
  ttVolgers?: number;
  regio: string;
  geslacht: "vrouw" | "man" | "";
  leeftijd?: number;
  telefoon?: string;
  foto?: string;
}): Promise<void> {
  if (!firebaseReady) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const r = doc(db, "creators", uid);
  const snap = await getDoc(r);
  const isNew = !snap.exists();
  const base: Record<string, unknown> = { ...p, uid, updatedAt: serverTimestamp() };
  if (isNew) {
    base.status = "pending";
    base.createdAt = serverTimestamp();
  }
  await setDoc(r, base, { merge: true });

  // Publieke directory (leesbaar voor restaurants): geen telefoon/IBAN.
  const pub: Record<string, unknown> = {
    uid,
    naam: p.naam,
    regio: p.regio,
    instagram: p.instagram,
    tiktok: p.tiktok,
    volgers: p.volgers,
    igVolgers: p.igVolgers ?? 0,
    ttVolgers: p.ttVolgers ?? 0,
    geslacht: p.geslacht,
    updatedAt: serverTimestamp(),
  };
  if (p.foto) pub.foto = p.foto;
  if (typeof p.leeftijd === "number") pub.leeftijd = p.leeftijd;
  if (isNew) {
    pub.status = "pending";
    pub.createdAt = serverTimestamp();
  }
  await setDoc(doc(db, "creatorProfiles", uid), pub, { merge: true });
}

export async function getMyCreator(
  uid: string
): Promise<{ status?: string; regio?: string; iban?: string; ibanNaam?: string } | null> {
  if (!firebaseReady || !uid) return null;
  const snap = await getDoc(doc(db, "creators", uid));
  return snap.exists()
    ? (snap.data() as { status?: string; regio?: string; iban?: string; ibanNaam?: string })
    : null;
}

export async function updateMyPayout(iban: string, ibanNaam: string): Promise<void> {
  if (!firebaseReady) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, "creators", uid), { iban, ibanNaam }, { merge: true });
}

export async function updateMyStad(regio: string): Promise<void> {
  if (!firebaseReady) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, "creators", uid), { regio }, { merge: true });
}

export async function listAllContent(): Promise<Content[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(collection(db, "content"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Content) }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function listMyApplications(uid: string): Promise<Application[]> {
  if (!firebaseReady || !uid) return [];
  const snap = await getDocs(
    query(collection(db, "applications"), where("creatorUid", "==", uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Application) }));
}

export async function listMyContent(uid: string): Promise<Content[]> {
  if (!firebaseReady || !uid) return [];
  const snap = await getDocs(
    query(collection(db, "content"), where("creatorUid", "==", uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Content) }));
}

export async function listAllReviews(): Promise<Review[]> {
  if (!firebaseReady) return [];
  const snap = await getDocs(collection(db, "reviews"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Review) }));
}

// Deterministische pseudo-coordinaten rond Amsterdam op basis van het id,
// zodat de kaart gevuld is zolang restaurants nog geen echte lat/lng hebben.
const AMS: [number, number] = [52.3676, 4.9041];
export function coordsFor(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const dLat = (((h & 0xff) / 255) - 0.5) * 0.055;
  const dLng = ((((h >> 8) & 0xff) / 255) - 0.5) * 0.10;
  return [AMS[0] + dLat, AMS[1] + dLng];
}

export function avgVibe(reviews: Review[]): number | null {
  if (!reviews.length) return null;
  const v = reviews.reduce((s, r) => s + (r.vibe ?? 0), 0) / reviews.length;
  return Math.round(v * 10) / 10;
}
