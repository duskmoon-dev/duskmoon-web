import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  workers: 1,
  use: {
    baseURL: process.env.DUSKMOON_VIZ_WEB_URL ?? "http://127.0.0.1:4489",
    browserName: "chromium",
    deviceScaleFactor: 1,
    launchOptions: { executablePath: process.env.CHROME_BIN },
  },
  expect: { toHaveScreenshot: { animations: "disabled" } },
});
