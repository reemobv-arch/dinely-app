// Seedt de Firestore-emulator met een restaurant + een open en een invite-only
// deal. Draait via de client-SDK tegen de emulator (test-rules staan alles toe).
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from "firebase/firestore";

const app = initializeApp({ projectId: "dinely-e1ba7", apiKey: "fake-api-key" });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const RID = "resto-e2e";
const media = { sfeer: [], eten: [], video: null, menu: null, drank: null };

await setDoc(doc(db, "restaurants", RID), {
  owner: RID,
  naam: "E2E Bistro",
  adres: "Teststraat 1, Amsterdam",
  keuken: "Bistro",
  prijs: "€€",
  sfeer: "Testsfeer",
  omschrijving: "Restaurant voor de e2e-test.",
  media,
});

const baseDeal = {
  owner: RID,
  restaurantId: RID,
  omschrijving: "",
  beloningstype: "betaald",
  bedrag: 75,
  eisen: [{ platform: "Instagram", minVolgers: 1000 }],
  eisRegio: "Amsterdam",
  geslacht: "alle",
  plekken: 4,
  gevraagd: "1 reel",
  looptijdDagen: 21,
  status: "open",
};

await setDoc(doc(db, "deals", "deal-open-e2e"), {
  ...baseDeal,
  titel: "Open deal e2e",
  zichtbaarheid: "open",
});
await setDoc(doc(db, "deals", "deal-invite-e2e"), {
  ...baseDeal,
  titel: "Invite-only deal e2e",
  zichtbaarheid: "invite",
});

console.log("[e2e] seed klaar: restaurant", RID, "+ 1 open + 1 invite-only deal");
process.exit(0);
