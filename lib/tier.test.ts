import { describe, it, expect } from "vitest";
import { creatorTier, nextTier, meetsMinTier, TIER_MIN } from "./tier";

describe("creatorTier (Bronze 25 / Silver 75 / Gold 250)", () => {
  it("geen niveau onder de 25", () => {
    expect(creatorTier(0)).toBeNull();
    expect(creatorTier(24)).toBeNull();
    expect(creatorTier(undefined)).toBeNull();
  });

  it("grenswaarden vallen in het juiste niveau", () => {
    expect(creatorTier(25)).toBe("bronze");
    expect(creatorTier(74)).toBe("bronze");
    expect(creatorTier(75)).toBe("silver");
    expect(creatorTier(249)).toBe("silver");
    expect(creatorTier(250)).toBe("gold");
    expect(creatorTier(9999)).toBe("gold");
  });

  it("drempels staan op 25 / 75 / 250", () => {
    expect(TIER_MIN).toEqual({ bronze: 25, silver: 75, gold: 250 });
  });
});

describe("nextTier (volgende niveau + resterende punten)", () => {
  it("wijst naar Bronze vanaf 0", () => {
    expect(nextTier(0)).toEqual({ tier: "bronze", over: 25 });
    expect(nextTier(10)).toEqual({ tier: "bronze", over: 15 });
  });

  it("wijst naar Silver binnen Bronze", () => {
    expect(nextTier(25)).toEqual({ tier: "silver", over: 50 });
    expect(nextTier(74)).toEqual({ tier: "silver", over: 1 });
  });

  it("wijst naar Gold binnen Silver", () => {
    expect(nextTier(75)).toEqual({ tier: "gold", over: 175 });
  });

  it("is null zodra je Gold hebt", () => {
    expect(nextTier(250)).toBeNull();
    expect(nextTier(1000)).toBeNull();
  });
});

describe("meetsMinTier (niveau-filter: minimaal)", () => {
  it("Bronze+ vanaf 25 punten", () => {
    expect(meetsMinTier(24, "bronze")).toBe(false);
    expect(meetsMinTier(25, "bronze")).toBe(true);
    expect(meetsMinTier(999, "bronze")).toBe(true);
  });

  it("Silver+ vanaf 75 punten (Bronze valt af)", () => {
    expect(meetsMinTier(74, "silver")).toBe(false);
    expect(meetsMinTier(75, "silver")).toBe(true);
  });

  it("Gold vanaf 250 punten", () => {
    expect(meetsMinTier(249, "gold")).toBe(false);
    expect(meetsMinTier(250, "gold")).toBe(true);
  });

  it("undefined punten telt als 0", () => {
    expect(meetsMinTier(undefined, "bronze")).toBe(false);
  });
});
