import { describe, it, expect } from "vitest";
import { totaalVolgers, perChannelVolgers } from "./volgers";

describe("volgers", () => {
  it("telt intern het totaal op", () => {
    expect(totaalVolgers(1000, 2000)).toBe(3000);
    expect(totaalVolgers(1000)).toBe(1000);
    expect(totaalVolgers()).toBe(0);
  });

  it("toont beide kanalen apart, nooit opgeteld", () => {
    expect(perChannelVolgers(1000, 2000)).toBe("Instagram 1.000 · TikTok 2.000");
    expect(perChannelVolgers(1000, 2000)).not.toContain("3.000");
  });

  it("toont alleen het kanaal dat is ingevuld", () => {
    expect(perChannelVolgers(24000, 0)).toBe("Instagram 24.000");
    expect(perChannelVolgers(0, 12000)).toBe("TikTok 12.000");
  });

  it("is leeg als er geen volgers zijn", () => {
    expect(perChannelVolgers(0, 0)).toBe("");
    expect(perChannelVolgers()).toBe("");
  });
});
