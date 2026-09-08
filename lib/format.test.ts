import { describe, it, expect } from "vitest";
import { formatNL, todayISO, addDays, isPastISO, formatDatumTijd } from "./format";

describe("format", () => {
  it("formatNL geeft een korte NL-datum", () => {
    const s = formatNL("2026-08-13");
    expect(s).toContain("13");
    expect(s.toLowerCase()).toContain("aug");
  });

  it("formatNL is leeg bij lege invoer", () => {
    expect(formatNL("")).toBe("");
  });

  it("todayISO geeft YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("addDays telt dagen correct op", () => {
    expect(addDays("2026-08-27", 5)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-08-27", 0)).toBe("2026-08-27");
  });

  it("isPastISO herkent verleden, niet vandaag/toekomst", () => {
    expect(isPastISO("2000-01-01")).toBe(true);
    expect(isPastISO(todayISO())).toBe(false);
    expect(isPastISO(addDays(todayISO(), 1))).toBe(false);
    expect(isPastISO("")).toBe(false);
  });
});

describe("formatDatumTijd", () => {
  it("plakt de tijd achter de datum", () => {
    expect(formatDatumTijd("2026-09-11", "20:30")).toMatch(/, 20:30$/);
  });
  it("zonder tijd alleen de datum", () => {
    expect(formatDatumTijd("2026-09-11")).not.toMatch(/,/);
    expect(formatDatumTijd("", "20:30")).toBe("20:30");
  });
});
