import { describe, it, expect } from "vitest";
import { qualifiesForDeal } from "./qualify";

describe("qualifiesForDeal", () => {
  it("zonder eisen staat de deal voor iedereen open", () => {
    expect(qualifiesForDeal([], "Instagram", 0)).toBe(true);
    expect(qualifiesForDeal(undefined, "", 0)).toBe(true);
  });

  it("voldoet als een geëist platform genoeg volgers heeft", () => {
    const eisen = [{ platform: "Instagram", minVolgers: 10000 }];
    expect(qualifiesForDeal(eisen, "Instagram", 12000)).toBe(true);
    expect(qualifiesForDeal(eisen, "Instagram", 9000)).toBe(false);
  });

  it("matcht platform hoofdletter-ongevoelig en op deel-string", () => {
    const eisen = [{ platform: "TikTok", minVolgers: 5000 }];
    expect(qualifiesForDeal(eisen, "instagram · tiktok", 6000)).toBe(true);
    expect(qualifiesForDeal(eisen, "Instagram", 6000)).toBe(false);
  });

  it("één voldane eis is genoeg", () => {
    const eisen = [
      { platform: "Instagram", minVolgers: 50000 },
      { platform: "TikTok", minVolgers: 3000 },
    ];
    expect(qualifiesForDeal(eisen, "Instagram · TikTok", 4000)).toBe(true);
    expect(qualifiesForDeal(eisen, "Instagram · TikTok", 2000)).toBe(false);
  });
});
