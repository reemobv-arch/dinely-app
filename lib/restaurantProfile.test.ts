import { describe, it, expect } from "vitest";
import { heeftFoto, isProfielCompleet } from "./restaurantProfile";
import type { Restaurant } from "./types";

const compleet: Partial<Restaurant> = {
  naam: "Gyozabar",
  adres: "Kerkstraat 1",
  stad: "Amsterdam",
  keuken: "Aziatisch",
  omschrijving: "Lekkere gyoza in hartje Amsterdam.",
  media: { sfeer: ["https://foto/1.jpg"], eten: [], video: null },
};

describe("heeftFoto", () => {
  it("true bij een sfeer- of etenfoto", () => {
    expect(heeftFoto({ sfeer: ["x"], eten: [], video: null })).toBe(true);
    expect(heeftFoto({ sfeer: [null], eten: ["y"], video: null })).toBe(true);
  });
  it("false zonder foto's", () => {
    expect(heeftFoto({ sfeer: [null], eten: [], video: null })).toBe(false);
    expect(heeftFoto(null)).toBe(false);
    expect(heeftFoto(undefined)).toBe(false);
  });
});

describe("isProfielCompleet", () => {
  it("true als alle basisvelden + een foto aanwezig zijn", () => {
    expect(isProfielCompleet(compleet)).toBe(true);
  });

  it("false als een verplicht veld leeg is", () => {
    expect(isProfielCompleet({ ...compleet, naam: "" })).toBe(false);
    expect(isProfielCompleet({ ...compleet, adres: "   " })).toBe(false);
    expect(isProfielCompleet({ ...compleet, keuken: undefined })).toBe(false);
    expect(isProfielCompleet({ ...compleet, omschrijving: "" })).toBe(false);
  });

  it("false zonder foto", () => {
    expect(isProfielCompleet({ ...compleet, media: { sfeer: [], eten: [], video: null } })).toBe(false);
  });

  it("false voor leeg/ontbrekend", () => {
    expect(isProfielCompleet(null)).toBe(false);
    expect(isProfielCompleet({})).toBe(false);
  });
});
