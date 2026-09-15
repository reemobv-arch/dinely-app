import { describe, it, expect } from "vitest";
import { reachBeschikbaar } from "./reachWindow";

const t = (iso: string) => new Date(iso).getTime();

describe("reachBeschikbaar", () => {
  it("geen bezoekdatum -> niet blokkeren (true)", () => {
    expect(reachBeschikbaar(undefined, undefined, t("2026-01-10T00:00:00"))).toBe(true);
  });
  it("nog geen 48 uur na het bezoek -> false", () => {
    expect(reachBeschikbaar("2026-01-10", "19:00", t("2026-01-11T19:00:00"))).toBe(false); // +24u
    expect(reachBeschikbaar("2026-01-10", "19:00", t("2026-01-12T18:59:00"))).toBe(false); // net <48u
  });
  it("precies 48 uur of later -> true", () => {
    expect(reachBeschikbaar("2026-01-10", "19:00", t("2026-01-12T19:00:00"))).toBe(true); // exact 48u
    expect(reachBeschikbaar("2026-01-10", "19:00", t("2026-01-20T12:00:00"))).toBe(true);
  });
  it("zonder tijd valt terug op middernacht", () => {
    expect(reachBeschikbaar("2026-01-10", "", t("2026-01-12T00:00:00"))).toBe(true); // 12-01 00:00 = +48u
    expect(reachBeschikbaar("2026-01-10", "", t("2026-01-11T23:00:00"))).toBe(false);
  });
  it("ongeldige datum -> niet blokkeren", () => {
    expect(reachBeschikbaar("onzin", "19:00", t("2026-01-12T19:00:00"))).toBe(true);
  });
});
