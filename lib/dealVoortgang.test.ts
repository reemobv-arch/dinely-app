import { describe, it, expect } from "vitest";
import { dealVoortgang, dealTab } from "./dealVoortgang";

describe("dealVoortgang (6 stappen)", () => {
  it("aangevraagd: nog niet geaccepteerd", () => {
    const r = dealVoortgang({ status: "wacht" });
    expect(r.fase).toBe("aangevraagd");
    expect(r.gedaan).toBe(1);
    expect(r.totaal).toBe(6);
    expect(r.klaar).toBe(false);
  });

  it("gepland: geaccepteerd, bezoek nog niet bevestigd", () => {
    const r = dealVoortgang({ status: "geaccepteerd", bezoekDatum: "2026-12-01" });
    expect(r.fase).toBe("gepland");
    expect(r.gedaan).toBe(2);
  });

  it("gewijzigd: datum aangepast na acceptatie", () => {
    expect(dealVoortgang({ status: "geaccepteerd", datumGewijzigd: true }).fase).toBe("gewijzigd");
  });

  it("teDoen: bezoek bevestigd, content nog niet", () => {
    const r = dealVoortgang({ status: "geaccepteerd", bezoekBevestigd: true });
    expect(r.fase).toBe("teDoen");
    expect(r.gedaan).toBe(3);
  });

  it("content geplaatst -> stap 5 (statistieken) is de volgende", () => {
    const r = dealVoortgang({ status: "geaccepteerd", bezoekBevestigd: true, contentPosted: true });
    expect(r.gedaan).toBe(4);
    expect(r.fase).toBe("teDoen");
  });

  it("gratis diner: klaar zodra statistieken zijn geleverd", () => {
    const r = dealVoortgang(
      { status: "geaccepteerd", bezoekBevestigd: true, contentPosted: true, reachSubmitted: true },
      false
    );
    expect(r.gedaan).toBe(6);
    expect(r.klaar).toBe(true);
    expect(r.fase).toBe("klaar");
  });

  it("betaalde deal: pas klaar als de uitbetaling is gedaan", () => {
    const base = { status: "geaccepteerd" as const, bezoekBevestigd: true, contentPosted: true, reachSubmitted: true };
    expect(dealVoortgang({ ...base, betaalStatus: "betaald" }, true).klaar).toBe(false); // nog niet uitbetaald
    expect(dealVoortgang({ ...base, betaalStatus: "betaald" }, true).gedaan).toBe(5);
    expect(dealVoortgang({ ...base, betaalStatus: "uitbetaald" }, true).klaar).toBe(true);
    expect(dealVoortgang({ ...base, betaalStatus: "uitbetaald" }, true).gedaan).toBe(6);
  });
});

describe("dealTab", () => {
  it("wacht/afgewezen -> aangevraagd", () => {
    expect(dealTab({ status: "wacht" })).toBe("aangevraagd");
    expect(dealTab({ status: "afgewezen" })).toBe("aangevraagd");
  });
  it("geaccepteerd + niet klaar -> lopend", () => {
    expect(dealTab({ status: "geaccepteerd" })).toBe("lopend");
  });
  it("geaccepteerd + klaar (gratis, alles gedaan) -> klaar", () => {
    expect(
      dealTab({ status: "geaccepteerd", bezoekBevestigd: true, contentPosted: true, reachSubmitted: true }, false)
    ).toBe("klaar");
  });
});
