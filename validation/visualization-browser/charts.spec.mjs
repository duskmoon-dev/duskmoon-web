import { expect, test } from "@playwright/test";

for (const fixture of [
  { name: "sunshine-wide", token: "sunshine", viewport: { width: 1240, height: 1000 } },
  { name: "moonlight-narrow", token: "moonlight", viewport: { width: 390, height: 900 } },
]) {
  test(fixture.name, async ({ page }) => {
    await page.setViewportSize(fixture.viewport);
    await page.addInitScript((theme) => {
      localStorage.setItem("duskmoon-docs-theme", theme);
    }, fixture.token);
    await page.goto("/components/visualization/");
    const charts = page.locator(".viz-catalog");
    await expect(charts.locator("svg[role=img]")).toHaveCount(6);
    await expect(page.locator("html")).toHaveAttribute("data-theme", fixture.token);
    await page.evaluate(() => document.fonts.ready);
    await expect(charts).toHaveScreenshot(fixture.name + ".png");
  });
}

test("raw data is available independently of marker rendering and series visibility", async ({ page }) => {
  await page.goto("/components/visualization/");
  const bars = page.locator("section[aria-labelledby=bar-example]");
  const legend = bars.getByRole("button", { name: "b", exact: true });
  await expect(legend).toHaveAttribute("aria-pressed", "true");
  await legend.press("Enter");
  await expect(legend).toHaveAttribute("aria-pressed", "false");
  await expect(bars.locator('[data-series-id="b"]')).toHaveCount(0);
  await bars.locator("summary").click();
  const row = bars.getByRole("row").filter({ hasText: "b · b2" });
  await expect(row).toContainText("y: 0");
  const scatter = page.locator("section[aria-labelledby=scatter-example]");
  await scatter.locator("summary").click();
  await expect(scatter.getByRole("row").filter({ hasText: "missing-x" })).toContainText("x: missing");
});
