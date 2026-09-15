import { describe, it, expect } from "vitest";
import { reachBeschikbaar } from "./reachWindow";

const C = Date.parse("2026-01-10T12:00:00Z");
const sec = Math.floor(C / 1000);
const na = (uur: number) => C + uur * 3600 * 1000;

describe("reachBeschikbaar", () => {
  it("geen content geplaatst -> false", () => {
    expect(reachBeschikbaar(false, undefined, na(100))).toBe(false);
    expect(reachBeschikbaar(false, sec, na(100))).toBe(false);
  });
  it("content zonder tijdstip (oude deal) -> niet blokkeren", () => {
    expect(reachBeschikbaar(true, undefined, na(1))).toBe(true);
  });
  it("nog geen 48u na de content-upload -> false", () => {
    expect(reachBeschikbaar(true, sec, na(24))).toBe(false);
    expect(reachBeschikbaar(true, sec, na(47))).toBe(false);
  });
  it("precies 48u of later -> true", () => {
    expect(reachBeschikbaar(true, sec, na(48))).toBe(true);
    expect(reachBeschikbaar(true, sec, na(100))).toBe(true);
  });
});
