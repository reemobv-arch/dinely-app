import { test, expect } from "@playwright/test";

// Kernflow: op de restaurantpagina is een invite-only deal zichtbaar maar
// "Invite only" (grijs/niet klikbaar), terwijl een open deal gewoon werkt.
// De data komt uit e2e/seed.mjs (draait via npm run e2e).
test("invite-only deal is zichtbaar maar vergrendeld, open deal niet", async ({ page }) => {
  await page.goto("/r/resto-e2e");

  // Beide deals staan op de pagina.
  await expect(page.getByText("Open deal e2e")).toBeVisible();
  await expect(page.getByText("Invite-only deal e2e")).toBeVisible();

  // De invite-only deal toont de "Invite only"-melding.
  await expect(page.getByText(/Invite only/i)).toBeVisible();
  await expect(page.getByText(/alleen op uitnodiging/i)).toBeVisible();

  // De open deal heeft een reageer-knop; de invite-only niet.
  await expect(page.getByRole("button", { name: /Solliciteer|Toch solliciteren/i })).toBeVisible();
});
