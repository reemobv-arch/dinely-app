import { describe, it, expect } from "vitest";
import { creatorShare, dinelyFee, DINELY_FEE } from "./money";

describe("money (85/15 split)", () => {
  it("creator krijgt 85%", () => {
    expect(creatorShare(75)).toBe(63.75);
    expect(creatorShare(100)).toBe(85);
    expect(creatorShare(60)).toBe(51);
  });

  it("Dinely houdt 15%", () => {
    expect(dinelyFee(75)).toBe(11.25);
    expect(dinelyFee(100)).toBe(15);
  });

  it("share + fee telt op tot het bedrag", () => {
    for (const b of [10, 33, 49.99, 120, 250]) {
      expect(creatorShare(b) + dinelyFee(b)).toBeCloseTo(b, 2);
    }
  });

  it("gaat netjes om met 0 en ongeldige invoer", () => {
    expect(creatorShare(0)).toBe(0);
    expect(dinelyFee(0)).toBe(0);
    // @ts-expect-error bewust ongeldige invoer
    expect(creatorShare(undefined)).toBe(0);
  });

  it("fee is 15%", () => {
    expect(DINELY_FEE).toBe(0.15);
  });
});
