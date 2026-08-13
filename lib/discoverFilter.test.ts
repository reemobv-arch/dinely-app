import { describe, it, expect } from "vitest";
import { filterRestaurants, heeftOpenDeal, matchtRestaurant } from "./discoverFilter";

const rows = [
  { id: "a", naam: "Lumen", keuken: "Modern Europees", prijs: "€€€€", adres: "Prinsengracht 210, Amsterdam" },
  { id: "b", naam: "Noir", keuken: "Frans", prijs: "€€€", adres: "Reguliersdwarsstraat 12, Amsterdam" },
  { id: "c", naam: "Pasha", keuken: "Turks", prijs: "€€", adres: "Javastraat 41, Amsterdam" },
];
const deals = [
  { owner: "a", status: "open" },
  { owner: "b", status: "gesloten" },
];

describe("discoverFilter", () => {
  it("geen filters = alles", () => {
    expect(filterRestaurants(rows, {}, deals)).toHaveLength(3);
  });

  it("zoekt op naam en keuken", () => {
    expect(filterRestaurants(rows, { q: "noir" }, deals).map((r) => r.id)).toEqual(["b"]);
    expect(filterRestaurants(rows, { q: "turks" }, deals).map((r) => r.id)).toEqual(["c"]);
  });

  it("filtert op keuken en prijs", () => {
    expect(filterRestaurants(rows, { keuken: "Frans" }, deals).map((r) => r.id)).toEqual(["b"]);
    expect(filterRestaurants(rows, { prijs: "€€" }, deals).map((r) => r.id)).toEqual(["c"]);
  });

  it("'met deals' toont alleen restaurants met een open deal", () => {
    expect(filterRestaurants(rows, { metDeals: true }, deals).map((r) => r.id)).toEqual(["a"]);
  });

  it("combineert filters", () => {
    expect(filterRestaurants(rows, { stad: "amsterdam", keuken: "Turks" }, deals).map((r) => r.id)).toEqual(["c"]);
    expect(filterRestaurants(rows, { q: "zzz" }, deals)).toHaveLength(0);
  });

  it("heeftOpenDeal", () => {
    expect(heeftOpenDeal("a", deals)).toBe(true);
    expect(heeftOpenDeal("b", deals)).toBe(false);
    expect(heeftOpenDeal("c", deals)).toBe(false);
  });

  it("stad matcht op adres, ook zonder adres", () => {
    expect(matchtRestaurant({ id: "x", adres: "" }, { stad: "amsterdam" }, deals)).toBe(true);
    expect(matchtRestaurant({ id: "x", adres: "Rotterdam" }, { stad: "amsterdam" }, deals)).toBe(false);
  });
});
