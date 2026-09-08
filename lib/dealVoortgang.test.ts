import { describe, it, expect } from "vitest";
import { dealVoortgang, dealTab } from "./dealVoortgang";

describe("dealVoortgang", () => {
  it("aangevraagd: nog niet geaccepteerd", () => {
    const r = dealVoortgang({ status: "wacht" });
    expect(r.fase).toBe("aangevraagd");
    expect(r.gedaan).toBe(1);
    expect(r.klaar).toBe(false);
  });

  it("gepland: geaccepteerd, bezoek nog niet bevestigd", () => {
    const r = dealVoortgang({ status: "geaccepteerd", bezoekDatum: "2026-12-01" });
    expect(r.fase).toBe("gepland");
    expect(r.gedaan).toBe(2);
  });

  it("gewijzigd: datum aangepast na acceptatie", () => {
    const r = dealVoortgang({ status: "geaccepteerd", datumGewijzigd: true });
    expect(r.fase).toBe("gewijzigd");
  });

  it("teDoen: bezoek bevestigd, content/bereik nog niet", () => {
    const r = dealVoortgang({ status: "geaccepteerd", bezoekBevestigd: true });
    expect(r.fase).toBe("teDoen");
    expect(r.gedaan).toBe(3);
  });

  it("klaar: content + bereik gedaan", () => {
    const r = dealVoortgang({ status: "geaccepteerd", bezoekBevestigd: true, contentPosted: true, reachSubmitted: true });
    expect(r.fase).toBe("klaar");
    expect(r.klaar).toBe(true);
    expect(r.gedaan).toBe(5);
  });
});

describe("dealTab", () => {
  it("wacht -> aangevraagd", () => {
    expect(dealTab({ status: "wacht" })).toBe("aangevraagd");
    expect(dealTab({ status: "afgewezen" })).toBe("aangevraagd");
  });
  it("geaccepteerd + niet klaar -> lopend", () => {
    expect(dealTab({ status: "geaccepteerd" })).toBe("lopend");
  });
  it("geaccepteerd + klaar -> klaar", () => {
    expect(dealTab({ status: "geaccepteerd", bezoekBevestigd: true, contentPosted: true, reachSubmitted: true })).toBe("klaar");
  });
});
