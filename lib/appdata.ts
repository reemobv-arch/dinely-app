import {
  collection,
  getDocs,
  getDoc,
  doc,
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

export async function listMyApplications(uid: string): Promise<Application[]> {
  if (!firebaseReady || !uid) return [];
  const snap = await getDocs(
    query(collection(db, "applications"), where("creatorUid", "==", uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Application) }));
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
