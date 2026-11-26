import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { cpus, release, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN,
});
try {
  const page = await browser.newPage({
    viewport: { width: 800, height: 520 },
    deviceScaleFactor: 1,
  });
  const flutterUrl = process.env.DUSKMOON_VIZ_FLUTTER_URL;
  let results;
  if (flutterUrl) {
    const prefix = "DUSKMOON_VIZ_BENCHMARK ";
    const report = page.waitForEvent("console", {
      predicate: (message) => message.text().startsWith(prefix),
      timeout: 90_000,
    });
    await page.goto(flutterUrl, { waitUntil: "domcontentloaded" });
    results = JSON.parse((await report).text().slice(prefix.length));
    if (!["profile", "release"].includes(results.mode))
      throw new Error("Use a Flutter profile or release build");
  } else {
    const dir = mkdtempSync(join(tmpdir(), "duskmoon-viz-performance-"));
    try {
      const entry = fileURLToPath(
        new URL("./performance.tsx", import.meta.url),
      );
      const bundle = join(dir, "charts.js");
      execFileSync(
        "bun",
        ["build", entry, "--production", "--minify", "--outfile", bundle],
        { stdio: ["ignore", 2, 2] },
      );
      await page.route("http://viz-benchmark.local/**", (route) =>
        new URL(route.request().url()).pathname === "/charts.js"
          ? route.fulfill({
              contentType: "text/javascript",
              body: readFileSync(bundle),
            })
          : route.fulfill({
              contentType: "text/html",
              body: "<!doctype html><main id='chart'></main><script src='/charts.js'></script>",
            }),
      );
      await page.goto("http://viz-benchmark.local/");
      results = {
        mode: "production",
        samples: await page.evaluate(() => window.visualizationBenchmark),
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        os: process.platform + " " + release(),
        cpu: cpus()[0].model,
        dpr: 1,
        viewport: [800, 520],
        plot: [640, 360],
        ...results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
