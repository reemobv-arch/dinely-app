import type { Deal } from "./types";

// Een invite-only (exclusieve) deal is alleen voor genodigde creators.
export function isInviteOnly(deal: Pick<Deal, "zichtbaarheid">): boolean {
  return deal.zichtbaarheid === "invite";
}

// In de algemene feed: open deals altijd; invite-only alleen als je bent uitgenodigd.
export function showsInFeed(
  deal: Pick<Deal, "zichtbaarheid" | "id">,
  invitedDealIds: Set<string>
): boolean {
  return !isInviteOnly(deal) || invitedDealIds.has(deal.id ?? "");
}

// Op de restaurantpagina: grijs/niet klikbaar als de deal invite-only is en je
// niet bent uitgenodigd (en er nog niet op hebt gereageerd).
export function isInviteLocked(
  deal: Pick<Deal, "zichtbaarheid" | "id">,
  invitedDealIds: Set<string>,
  alreadyApplied: boolean
): boolean {
  return isInviteOnly(deal) && !invitedDealIds.has(deal.id ?? "") && !alreadyApplied;
}
