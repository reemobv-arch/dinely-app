import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, firebaseReady } from "./firebase";
import type { Restaurant, Deal, Application, Review } from "./types";

/**
 * Datalaag met twee modi:
 *  - Firebase (zodra .env.local is ingevuld) → echt opgeslagen.
 *  - Demo-modus (zonder Firebase) → lokaal in de browser (localStorage),
 *    zodat het dashboard nu al werkt en klikbaar is.
 * De pagina's roepen alleen deze functies aan en weten van niets.
 */

// ---------- demo-helpers ----------
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / geen storage — in demo best-effort */
  }
}
const nowStamp = () => ({ seconds: Math.floor(Date.now() / 1000) });
const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2);

const K = {
  restaurant: (u: string) => `tably-demo:restaurant:${u}`,
  deals: "tably-demo:deals",
  apps: "tably-demo:applications",
  reviews: "tably-demo:reviews",
};

function sortByDate<T extends { createdAt?: { seconds: number } }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
}

// ---------- restaurant ----------
export async function getRestaurant(uid: string): Promise<Restaurant | null> {
  if (firebaseReady) {
    const snap = await getDoc(doc(db, "restaurants", uid));
    return snap.exists() ? (snap.data() as Restaurant) : null;
  }
  return lsGet<Restaurant | null>(K.restaurant(uid), null);
}
export async function saveRestaurant(uid: string, data: Restaurant): Promise<void> {
  if (firebaseReady) {
    await setDoc(
      doc(db, "restaurants", uid),
      { ...data, owner: uid, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return;
  }
  lsSet(K.restaurant(uid), { ...data, owner: uid, updatedAt: nowStamp() });
}

// ---------- media ----------
export async function uploadMedia(
  uid: string,
  path: string,
  file: File
): Promise<string> {
  if (firebaseReady) {
    const r = ref(storage, `restaurants/${uid}/${path}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  }
  // demo: video als object-URL (te groot voor localStorage), afbeeldingen als data-URL
  if (file.type.startsWith("video")) return URL.createObjectURL(file);
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

// ---------- deals ----------
type NewDeal = Omit<
  Deal,
  "id" | "owner" | "restaurantId" | "status" | "createdAt"
>;

export async function listDeals(uid: string): Promise<Deal[]> {
  if (firebaseReady) {
    const snap = await getDocs(
      query(collection(db, "deals"), where("owner", "==", uid))
    );
    return sortByDate(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Deal) })));
  }
  return sortByDate(lsGet<Deal[]>(K.deals, []).filter((d) => d.owner === uid));
}
export async function createDeal(uid: string, deal: NewDeal): Promise<void> {
  if (firebaseReady) {
    await addDoc(collection(db, "deals"), {
      ...deal,
      owner: uid,
      restaurantId: uid,
      status: "open",
      createdAt: serverTimestamp(),
    });
    return;
  }
  const all = lsGet<Deal[]>(K.deals, []);
  all.push({
    ...deal,
    id: newId(),
    owner: uid,
    restaurantId: uid,
    status: "open",
    createdAt: nowStamp(),
  });
  lsSet(K.deals, all);
}
export async function updateDeal(id: string, patch: Partial<Deal>): Promise<void> {
  if (firebaseReady) {
    await updateDoc(doc(db, "deals", id), patch);
    return;
  }
  lsSet(
    K.deals,
    lsGet<Deal[]>(K.deals, []).map((d) => (d.id === id ? { ...d, ...patch } : d))
  );
}
export async function deleteDeal(id: string): Promise<void> {
  if (firebaseReady) {
    await deleteDoc(doc(db, "deals", id));
    return;
  }
  lsSet(K.deals, lsGet<Deal[]>(K.deals, []).filter((d) => d.id !== id));
}

// ---------- applications ----------
export async function listApplications(uid: string): Promise<Application[]> {
  if (firebaseReady) {
    const snap = await getDocs(
      query(collection(db, "applications"), where("restaurantId", "==", uid))
    );
    return sortByDate(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Application) }))
    );
  }
  return sortByDate(
    lsGet<Application[]>(K.apps, []).filter((a) => a.restaurantId === uid)
  );
}
export async function updateApplication(
  id: string,
  patch: Partial<Application>
): Promise<void> {
  if (firebaseReady) {
    await updateDoc(doc(db, "applications", id), patch);
    return;
  }
  lsSet(
    K.apps,
    lsGet<Application[]>(K.apps, []).map((a) =>
      a.id === id ? { ...a, ...patch } : a
    )
  );
}

// ---------- reviews ----------
export async function listReviews(uid: string): Promise<Review[]> {
  if (firebaseReady) {
    const snap = await getDocs(
      query(collection(db, "reviews"), where("restaurantId", "==", uid))
    );
    return sortByDate(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Review) })));
  }
  return sortByDate(
    lsGet<Review[]>(K.reviews, []).filter((r) => r.restaurantId === uid)
  );
}

// ---------- super-admin: alles inzien over restaurants heen ----------
export type AdminRestaurant = Restaurant & { owner: string };

export async function adminAllRestaurants(): Promise<AdminRestaurant[]> {
  if (firebaseReady) {
    const snap = await getDocs(collection(db, "restaurants"));
    return snap.docs.map((d) => ({ ...(d.data() as Restaurant), owner: d.id }));
  }
  // demo: enumereer lokale restaurant-keys
  const out: AdminRestaurant[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("tably-demo:restaurant:")) {
        const uid = key.replace("tably-demo:restaurant:", "");
        const r = lsGet<Restaurant | null>(key, null);
        if (r) out.push({ ...r, owner: uid });
      }
    }
  } catch {
    /* geen storage */
  }
  return out;
}

export async function adminAllDeals(): Promise<Deal[]> {
  if (firebaseReady) {
    const snap = await getDocs(collection(db, "deals"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Deal) }));
  }
  return lsGet<Deal[]>(K.deals, []);
}

export async function adminAllApplications(): Promise<Application[]> {
  if (firebaseReady) {
    const snap = await getDocs(collection(db, "applications"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Application) }));
  }
  return lsGet<Application[]>(K.apps, []);
}

export async function adminAllReviews(): Promise<Review[]> {
  if (firebaseReady) {
    const snap = await getDocs(collection(db, "reviews"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Review) }));
  }
  return lsGet<Review[]>(K.reviews, []);
}

// ---------- testdata seeden ----------
export async function seedTestData(uid: string): Promise<void> {
  // 1. minstens één deal
  let deals = await listDeals(uid);
  if (deals.length === 0) {
    await createDeal(uid, {
      titel: "Nieuw grill-menu — creators gezocht",
      omschrijving:
        "We openen ons nieuwe grill-menu en zoeken creators die de sfeer van een avond vastleggen.",
      beloningstype: "betaald",
      bedrag: 75,
      eisen: [{ platform: "Instagram", minVolgers: 10000 }],
      eisRegio: "Amsterdam",
      geslacht: "alle",
      plekken: 8,
      gevraagd: "2 reels + 3 stories",
      looptijdDagen: 14,
    });
    deals = await listDeals(uid);
  }
  const dealId = deals[0].id as string;

  // 2. sollicitaties (alleen als er nog geen zijn)
  const apps = await listApplications(uid);
  if (apps.length === 0) {
    const sample = [
      { handle: "@juul", volgers: 18400, platform: "Instagram", regio: "Amsterdam", geslacht: "vrouw" as const },
      { handle: "@foodbyric", volgers: 44100, platform: "TikTok · Instagram", regio: "Amsterdam", geslacht: "man" as const },
      { handle: "@mila.eats", volgers: 12700, platform: "Instagram", regio: "Haarlem", geslacht: "vrouw" as const },
      { handle: "@sasrecht", volgers: 6200, platform: "Instagram", regio: "Amsterdam", geslacht: "vrouw" as const },
    ];
    if (firebaseReady) {
      const batch = writeBatch(db);
      for (const s of sample) {
        batch.set(doc(collection(db, "applications")), {
          ...s,
          dealId,
          restaurantId: uid,
          status: "wacht",
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } else {
      const all = lsGet<Application[]>(K.apps, []);
      for (const s of sample) {
        all.push({ ...s, id: newId(), dealId, restaurantId: uid, status: "wacht", createdAt: nowStamp() });
      }
      lsSet(K.apps, all);
    }
  }

  // 3. reviews (alleen als er nog geen zijn)
  const revs = await listReviews(uid);
  if (revs.length === 0) {
    const sample = [
      { naam: "Marloes", food: 4.8, vibe: 9.2, service: 4.4, sterren: 5, tekst: "Wat een sfeer. De beelden in de app klopten precies — donker, intiem, geweldige grill." },
      { naam: "David", food: 4.6, vibe: 8.9, service: 4.5, sterren: 5, tekst: "Gereserveerd na een reel gezien te hebben. De short rib was het bekijken waard." },
      { naam: "Sanne", food: 4.2, vibe: 8.5, service: 4.0, sterren: 4, tekst: "Leuke avond, alleen wat luid na tienen. Verder een aanrader voor een date." },
    ];
    if (firebaseReady) {
      const batch = writeBatch(db);
      for (const r of sample) {
        batch.set(doc(collection(db, "reviews")), {
          ...r,
          restaurantId: uid,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } else {
      const all = lsGet<Review[]>(K.reviews, []);
      for (const r of sample) {
        all.push({ ...r, id: newId(), restaurantId: uid, createdAt: nowStamp() });
      }
      lsSet(K.reviews, all);
    }
  }
}
