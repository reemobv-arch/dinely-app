import { describe, it, expect } from "vitest";
import { profileGaps, isProfileComplete } from "./profileGaps";

describe("profileGaps", () => {
  it("leeg profiel mist alles", () => {
    expect(profileGaps({})).toEqual(["iban", "ibanNaam", "socials"]);
  });

  it("één social volstaat voor socials", () => {
    expect(profileGaps({ iban: "NL..", ibanNaam: "J", instagram: "@x" })).toEqual([]);
    expect(profileGaps({ iban: "NL..", ibanNaam: "J", tiktok: "@x" })).toEqual([]);
  });

  it("mist alleen IBAN", () => {
    expect(profileGaps({ ibanNaam: "J", tiktok: "@x" })).toEqual(["iban"]);
  });

  it("spaties tellen als leeg", () => {
    expect(profileGaps({ iban: "  ", ibanNaam: "  ", instagram: "  ", tiktok: "  " })).toEqual([
      "iban",
      "ibanNaam",
      "socials",
    ]);
  });

  it("isProfileComplete", () => {
    expect(isProfileComplete({ iban: "NL", ibanNaam: "J", instagram: "@x" })).toBe(true);
    expect(isProfileComplete({})).toBe(false);
  });
});
