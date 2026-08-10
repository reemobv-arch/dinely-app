import { getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseReady } from "./firebase";

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushPrefs = {
  approval: boolean; // goedkeuring / afwijzing
  accepted: boolean; // deal geaccepteerd
  newDeals: boolean; // nieuwe deals in jouw stad
};

export const DEFAULT_PREFS: PushPrefs = { approval: true, accepted: true, newDeals: true };

export type PushResult = "ok" | "denied" | "unsupported" | "error";

/** Vraagt toestemming, haalt een FCM-token op en slaat 't op bij de creator. */
export async function enablePush(prefs: PushPrefs): Promise<PushResult> {
  if (!firebaseReady || !VAPID) return "error";
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (!(await isSupported().catch(() => false))) return "unsupported";
  const uid = auth.currentUser?.uid;
  if (!uid) return "error";
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return "denied";
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, {
      vapidKey: VAPID,
      serviceWorkerRegistration: reg,
    });
    if (!token) return "error";
    await setDoc(
      doc(db, "creators", uid),
      { fcmTokens: arrayUnion(token), pushPrefs: prefs, pushOn: true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return "ok";
  } catch {
    return "error";
  }
}

/** Alleen de voorkeuren opslaan (zonder opnieuw permissie te vragen). */
export async function savePushPrefs(prefs: PushPrefs, on: boolean): Promise<void> {
  if (!firebaseReady) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, "creators", uid), { pushPrefs: prefs, pushOn: on }, { merge: true });
}
