import { expect, test } from "@playwright/test";

const storybook = process.env.DUSKMOON_VIZ_STORYBOOK_URL;
test.skip(!storybook, "A running Phoenix Storybook is required");

test("LiveView mounts the React chart and exchanges revisioned events", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(new URL("/storybook/data_display/react_visualization", storybook).href);
  const chart = page.locator("#storybook-react-visualization");
  const plot = chart.locator("[data-plot-interaction]");
  await expect(plot).toBeVisible();
  await plot.focus();
  await expect(chart.locator("foreignObject [role=status]")).toContainText("12");
  await expect(page.getByText("Received selection", { exact: true })).toHaveCount(0);
  await plot.press("Enter");
  await expect(page.getByText("Received selection", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Update chart" }).click();
  await expect(chart).toHaveAttribute("data-visualization", /"revision":1/);
  await plot.focus();
  await expect(chart.locator("foreignObject [role=status]")).toContainText("14");

  const box = await plot.boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText("Received brush", { exact: true })).toBeVisible();
  await page.locator('#psb-sidebar a[href="/storybook/data_display/badge"]').click();
  await expect(chart).toHaveCount(0);
  await page.locator('#psb-sidebar a[href="/storybook/data_display/react_visualization"]').click();
  await expect(plot).toBeVisible();
  await expect(chart).toHaveAttribute("data-visualization", /"revision":0/);
  expect(errors).toEqual([]);
});
