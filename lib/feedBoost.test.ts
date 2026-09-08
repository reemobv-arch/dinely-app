import { describe, it, expect } from "vitest";
import { feedBoost, sorteerOpBoost } from "./feedBoost";

describe("feedBoost", () => {
  it("prioriteit per add-on, hoogste wint", () => {
    expect(feedBoost({ addons: ["feed_top"] })).toBe(3);
    expect(feedBoost({ addons: ["feed_top5"] })).toBe(2);
    expect(feedBoost({ addons: ["feed_top10"] })).toBe(1);
    expect(feedBoost({ addons: ["feed_top10", "feed_top"] })).toBe(3);
    expect(feedBoost({ addons: [] })).toBe(0);
    expect(feedBoost(null)).toBe(0);
  });
});

describe("sorteerOpBoost", () => {
  it("boost naar voren, verder stabiel", () => {
    const rows = [
      { id: "a" },
      { id: "b", addons: ["feed_top10"] },
      { id: "c", addons: ["feed_top"] },
      { id: "d" },
    ];
    expect(sorteerOpBoost(rows).map((r) => r.id)).toEqual(["c", "b", "a", "d"]);
  });
});
