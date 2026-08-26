import { describe, it, expect } from "vitest";
import { isInviteOnly, showsInFeed, isInviteLocked } from "./dealVisibility";
import type { Deal } from "./types";

const open = { id: "d1", zichtbaarheid: "open" } as Pick<Deal, "id" | "zichtbaarheid">;
const invite = { id: "d2", zichtbaarheid: "invite" } as Pick<Deal, "id" | "zichtbaarheid">;
const legacy = { id: "d3" } as Pick<Deal, "id" | "zichtbaarheid">; // geen veld = open

describe("isInviteOnly", () => {
  it("herkent invite-only deals", () => {
    expect(isInviteOnly(invite)).toBe(true);
    expect(isInviteOnly(open)).toBe(false);
    expect(isInviteOnly(legacy)).toBe(false);
  });
});

describe("showsInFeed (algemene feed)", () => {
  const geen = new Set<string>();
  const uitgenodigd = new Set(["d2"]);

  it("open deals staan altijd in de feed", () => {
    expect(showsInFeed(open, geen)).toBe(true);
    expect(showsInFeed(legacy, geen)).toBe(true);
  });

  it("invite-only verborgen zonder uitnodiging", () => {
    expect(showsInFeed(invite, geen)).toBe(false);
  });

  it("invite-only zichtbaar mét uitnodiging", () => {
    expect(showsInFeed(invite, uitgenodigd)).toBe(true);
  });
});

describe("isInviteLocked (restaurantpagina)", () => {
  const geen = new Set<string>();
  const uitgenodigd = new Set(["d2"]);

  it("open deals zijn nooit vergrendeld", () => {
    expect(isInviteLocked(open, geen, false)).toBe(false);
  });

  it("invite-only zonder uitnodiging is vergrendeld", () => {
    expect(isInviteLocked(invite, geen, false)).toBe(true);
  });

  it("invite-only mét uitnodiging is niet vergrendeld", () => {
    expect(isInviteLocked(invite, uitgenodigd, false)).toBe(false);
  });

  it("al gesolliciteerd = niet vergrendeld (blijft zichtbaar met status)", () => {
    expect(isInviteLocked(invite, geen, true)).toBe(false);
  });
});
