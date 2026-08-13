import { describe, it, expect } from "vitest";
import { formatNL, todayISO } from "./format";

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
});
