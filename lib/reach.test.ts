import { describe, it, expect } from "vitest";
import { reachTotal, isValidEntry, canSubmitReach } from "./reach";

describe("reachTotal", () => {
  it("telt bereik op", () => {
    expect(reachTotal([{ bereik: 1000000 }, { bereik: 250000 }])).toBe(1250000);
  });
  it("negeert negatief/ongeldig", () => {
    expect(reachTotal([{ bereik: -5 }, { bereik: NaN as unknown as number }, { bereik: 100 }])).toBe(100);
  });
  it("lege lijst -> 0", () => {
    expect(reachTotal([])).toBe(0);
  });
});

describe("isValidEntry", () => {
  it("kanaal + bereik is geldig", () => {
    expect(isValidEntry({ kanaal: "Instagram", bereik: 5000 })).toBe(true);
  });
  it("alleen een screenshot is ook geldig", () => {
    expect(isValidEntry({ foto: "https://…/x.jpg" })).toBe(true);
  });
  it("alleen kanaal of alleen bereik is niet genoeg", () => {
    expect(isValidEntry({ kanaal: "Instagram" })).toBe(false);
    expect(isValidEntry({ bereik: 5000 })).toBe(false);
    expect(isValidEntry({})).toBe(false);
  });
});

describe("canSubmitReach", () => {
  it("waar zodra één post bruikbaar is", () => {
    expect(canSubmitReach([{}, { kanaal: "TikTok", bereik: 10 }])).toBe(true);
    expect(canSubmitReach([{}, {}])).toBe(false);
  });
});
