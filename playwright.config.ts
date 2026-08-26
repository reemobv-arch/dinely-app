import { defineConfig } from "@playwright/test";

// E2E tegen de Firebase-emulator. Start met: npm run e2e
// (vereist eenmalig: npx playwright install chromium)
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_EMULATOR: "1",
      NEXT_PUBLIC_FIREBASE_API_KEY: "fake-api-key",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "dinely-e1ba7",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "dinely-e1ba7.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "dinely-e1ba7.firebasestorage.app",
    },
  },
});
