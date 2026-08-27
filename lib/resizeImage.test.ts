import { describe, it, expect } from "vitest";
import { computeSize } from "./resizeImage";

describe("computeSize", () => {
  it("verkleint de langste zijde naar maxDim", () => {
    expect(computeSize(4000, 2000, 1280)).toEqual({ w: 1280, h: 640 });
    expect(computeSize(2000, 4000, 1280)).toEqual({ w: 640, h: 1280 });
  });

  it("vergroot nooit", () => {
    expect(computeSize(800, 600, 1280)).toEqual({ w: 800, h: 600 });
  });

  it("randgevallen", () => {
    expect(computeSize(0, 100, 1280)).toEqual({ w: 0, h: 0 });
    expect(computeSize(1280, 720, 1280)).toEqual({ w: 1280, h: 720 });
  });

  it("iPhone-screenshot blijft leesbaar bij ruime maxDim", () => {
    // 1170x2532 met maxDim 2200 -> breedte ~1017 (genoeg voor OCR)
    const r = computeSize(1170, 2532, 2200);
    expect(r.h).toBe(2200);
    expect(r.w).toBe(1017);
  });
});
