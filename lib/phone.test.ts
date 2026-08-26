import { describe, it, expect } from "vitest";
import { toE164NL } from "./phone";

describe("toE164NL (NL mobiel -> E.164)", () => {
  it("zet 06-nummers om naar +316…", () => {
    expect(toE164NL("0612345678")).toBe("+31612345678");
    expect(toE164NL("06 12 34 56 78")).toBe("+31612345678");
    expect(toE164NL("06-12345678")).toBe("+31612345678");
  });

  it("accepteert al-internationale notaties", () => {
    expect(toE164NL("+31612345678")).toBe("+31612345678");
    expect(toE164NL("+31 6 12345678")).toBe("+31612345678");
    expect(toE164NL("0031612345678")).toBe("+31612345678");
    expect(toE164NL("31612345678")).toBe("+31612345678");
  });

  it("accepteert een lokaal nummer zonder leidende 0", () => {
    expect(toE164NL("612345678")).toBe("+31612345678");
  });

  it("weigert ongeldige of niet-mobiele nummers", () => {
    expect(toE164NL("020 1234567")).toBeNull(); // vast nummer (start niet met 6)
    expect(toE164NL("0612345")).toBeNull(); // te kort
    expect(toE164NL("06123456789")).toBeNull(); // te lang
    expect(toE164NL("")).toBeNull();
    expect(toE164NL("abc")).toBeNull();
  });
});
