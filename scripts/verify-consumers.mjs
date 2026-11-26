import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const [output, mode, ...extra] = process.argv.slice(2);
const modes = ["--react-only", "--visualization-only", "--yew-only", "--engine-only", "--serve-native", "--serve-engine", "--no-browser"];
assert(output && !extra.length, `Usage: node scripts/verify-consumers.mjs ARTIFACTS [${modes.join("|")}]`);
assert(mode === undefined || modes.includes(mode), "Unknown consumer mode");
const artifactDir = resolve(output);
const { artifacts, version } = JSON.parse(readFileSync(join(artifactDir, "release.json"), "utf8"));
const npm = new Map(artifacts.filter(({ registry }) => registry === "npm").map((entry) => [entry.name, entry]));
const hex = artifacts.find(({ registry }) => registry === "hex");
const tmp = mkdtempSync(join(tmpdir(), "duskmoon-web-consumers-"));
const env = { ...process.env, MIX_ENV: "prod", DUSKMOON_NATIVE_MODE: "precompiled" };
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const storybook = JSON.parse(readFileSync(join(root, "phoenix/apps/duskmoon_storybook/package.json"), "utf8"));

function run(cmd, args, cwd, capture = false) {
  return execFileSync(cmd, args, { cwd, env, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
}

function install(name, packages, tooling = {}) {
  const dir = join(tmp, name);
  mkdirSync(dir);
  const dependencies = Object.fromEntries(packages.map((pkg) => {
    const { file } = npm.get(pkg);
    return [pkg, "file:" + join(artifactDir, file)];
  }));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, private: true, type: "module",
    dependencies: { ...dependencies, ...tooling } }, null, 2));
  run("npm", ["install", "--ignore-scripts", "--prefer-offline", "--no-audit", "--no-fund"], dir);
  for (const pkg of packages) {
    const installed = join(dir, "node_modules", pkg);
    assert(lstatSync(installed).isDirectory(), `Dependency is not copied from its artifact: ${pkg}`);
    assert.equal(JSON.parse(readFileSync(join(installed, "package.json"), "utf8")).version, npm.get(pkg).version);
  }
  return dir;
}

function installedPaths(dir) {
  return Object.keys(JSON.parse(readFileSync(join(dir, "package-lock.json"), "utf8")).packages);
}

async function verifyCodeEngine() {
  const engine = "@duskmoon-dev/code-engine";
  const adapter = "@duskmoon-dev/el-code-engine";
  const base = "@duskmoon-dev/el-base";
  const core = "@duskmoon-dev/core";
  for (const name of [engine, adapter, base, core]) assert.equal(npm.get(name)?.version, version, name);
  const standalone = install("code-engine-consumer", [engine], {
    typescript: rootPackage.devDependencies.typescript,
  });
  assert.deepEqual(installedPaths(standalone).filter(Boolean).sort(),
    [`node_modules/${engine}`, "node_modules/typescript"].sort());
  const source = join(root, "packages/engines/code-engine");
  const { exports } = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
  const legacyModules = readdirSync(join(source, "src/lang/legacy"))
    .filter((file) => file.endsWith(".js") || file === "index.ts")
    .map((file) => file.slice(0, -3))
    .sort();
  cpSync(join(root, "validation/code-engine-exports.mjs"), join(standalone, "code-engine-exports.mjs"));
  writeFileSync(join(standalone, "code-engine-expected-exports.json"), JSON.stringify({ exports, legacyModules }));
  run("node", ["code-engine-exports.mjs", version], standalone);

  const withAdapter = install("code-engine-adapter-consumer", [engine, adapter, base, core]);
  const locked = JSON.parse(readFileSync(join(withAdapter, "package-lock.json"), "utf8")).packages;
  assert.deepEqual(Object.keys(locked).filter((path) => path.endsWith(`node_modules/${engine}`)),
    [`node_modules/${engine}`]);
  for (const name of [engine, adapter, base, core]) {
    const entry = locked[`node_modules/${name}`];
    assert.equal(entry.version, version);
    assert(entry.resolved.startsWith("file:"));
    assert.equal(resolve(withAdapter, entry.resolved.slice(5)), join(artifactDir, npm.get(name).file));
  }
  assert.equal(locked[`node_modules/${adapter}`].dependencies[engine], version);
  assert.deepEqual(installedPaths(withAdapter).filter(Boolean).sort(),
    [engine, adapter, base, core, "tailwindcss"].map((name) => `node_modules/${name}`).sort());
  if (mode !== "--no-browser") {
    const { verifyCodeEngineBrowser } = await import("../validation/code-engine-browser/index.mjs");
    const { chromium } = await import("@playwright/test");
    await verifyCodeEngineBrowser({ standalone, adapter: withAdapter, chromium, mode });
  }
}

function verifyYew() {
  const { dependencies, devDependencies } = JSON.parse(readFileSync(join(root, "yew/example/package.json"), "utf8"));
  const dir = install("yew-consumer", ["@duskmoon-dev/core", "@duskmoon-dev/css-art"], {
    tailwindcss: dependencies.tailwindcss,
    "@tailwindcss/cli": devDependencies["@tailwindcss/cli"],
  });
  const unpack = (name) => {
    const artifact = artifacts.find((entry) => entry.name === name && entry.registry === "crates.io");
    assert(artifact, `Missing archive for ${name}`);
    run("tar", ["-xzf", join(artifactDir, artifact.file)], dir);
    return `./${name}-${artifact.version}`;
  };
  const engine = unpack("code-engine");
  const components = unpack("yew-duskmoon");
  writeFileSync(join(dir, "Cargo.toml"), `[package]
name = "duskmoon-yew-consumer"
version = "0.0.0"
edition = "2021"
publish = false

[dependencies]
code-engine = { path = "${engine}" }
yew-duskmoon = { path = "${components}" }
yew = { version = "0.23.0", features = ["csr"] }

[patch.crates-io]
code-engine = { path = "${engine}" }
`);
  mkdirSync(join(dir, "src"));
  cpSync(join(root, "validation", "yew-consumer.rs"), join(dir, "src", "main.rs"));
  run("cargo", ["run", "--quiet"], dir);
  run("cargo", ["check", "--locked", "--target", "wasm32-unknown-unknown"], dir);

  const exported = join(dir, "public/tree-sitter");
  const checksums = JSON.parse(readFileSync(join(exported, "SHA256SUMS.json"), "utf8"));
  assert(Object.keys(checksums).length > 100, "Missing grammar, query or license resources");
  for (const [file, expected] of Object.entries(checksums)) {
    const bytes = readFileSync(join(exported, file));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, file);
  }
  writeFileSync(join(dir, "app.css"), '@import "tailwindcss" source(none);\n' +
    '@import "@duskmoon-dev/core";\n@source "./src";\n');
  run(join(dir, "node_modules/.bin/tailwindcss"), ["-i", "app.css", "-o", "public/app.css"], dir);
  const compiled = readFileSync(join(dir, "public/app.css"), "utf8");
  assert.match(compiled, /\.btn\b/);
  assert.match(compiled, /\.mt-7\b/);
  console.log(`Isolated Yew archives: native Markdown/Mermaid, Wasm components, Core CSS and ${Object.keys(checksums).length} checked resources passed`);
}

function verifyReact() {
  const dir = install("react-consumer", [
    "@duskmoon-dev/core", "@duskmoon-dev/css-art", "@duskmoon-dev/components", "@duskmoon-dev/art-components",
  ], Object.fromEntries(["react", "react-dom", "typescript", "@types/react", "@types/react-dom"].map(
    (pkg) => [pkg, rootPackage.devDependencies[pkg]],
  )));
  const installed = installedPaths(dir);
  assert(!installed.some((p) => /node_modules\/@duskmoon-dev\/(?:el-|elements|art-elements)/.test(p)));
  for (const pkg of ["react", "react-dom"]) {
    assert.deepEqual(installed.filter((p) => p.endsWith(`node_modules/${pkg}`)), [`node_modules/${pkg}`]);
  }
  for (const file of ["react-consumer.mjs", "react-types.ts"]) cpSync(join(root, "validation", file), join(dir, file));
  const html = run("node", ["react-consumer.mjs"], dir, true);
  assert.match(html, /<button[^>]*type="button"[^>]*>.*Native React.*<\/button>/);
  assert.match(html, /class="art-moon"/);
  assert.doesNotMatch(html, /<el-dm-/);
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({
    compilerOptions: { strict: true, module: "NodeNext", noEmit: true, target: "ES2022" },
    files: ["react-types.ts"],
  }));
  run("node", ["node_modules/typescript/bin/tsc", "-p", "."], dir);
  run("bun", ["build", "react-consumer.mjs", "--target=node", "--outdir=build"], dir);
  assert.doesNotMatch(readFileSync(join(dir, "build/react-consumer.js"), "utf8"),
    /@duskmoon-dev\/(?:el-|elements|art-elements)|<el-dm-|customElements\.define\(["']el-dm-/);
  assert.equal(run("node", ["build/react-consumer.js"], dir, true), html);
  console.log("Isolated React tarballs: SSR, types, bundle and one React runtime passed");
}


async function verifyVisualization() {
  const core = "@duskmoon-dev/visualization-core";
  const react = "@duskmoon-dev/visualization";
  for (const name of [core, react]) assert.equal(npm.get(name)?.version, version, name);
  const dir = install("visualization-consumer", [core, react], Object.fromEntries(
    ["react", "react-dom", "typescript", "@types/react", "@types/react-dom"].map(
      (name) => [name, rootPackage.devDependencies[name]],
    ),
  ));
  const installed = installedPaths(dir);
  const duskmoonPackages = installed.filter((path) => path.includes("node_modules/@duskmoon-dev/"));
  assert.deepEqual(duskmoonPackages.sort(), [react, core].map((name) => "node_modules/" + name).sort());
  for (const name of ["react", "react-dom"]) {
    assert.deepEqual(installed.filter((path) => path.endsWith("node_modules/" + name)), ["node_modules/" + name]);
  }
  const chartManifest = JSON.parse(readFileSync(join(dir, "node_modules", react, "package.json")));
  assert.equal(chartManifest.dependencies[core], version);
  const fixtures = Object.fromEntries(["xy", "heatmap", "scenes"].map((group) => [group,
    JSON.parse(readFileSync(join(root, "specs/visualization/v1/fixtures", group + ".json"))),
  ]));
  cpSync(join(root, "validation/visualization-consumer.mjs"), join(dir, "examples.mjs"));
  writeFileSync(join(dir, "fixtures.json"), JSON.stringify(fixtures));
  writeFileSync(join(dir, "ssr.mjs"), `
import { renderToStaticMarkup } from "react-dom/server";
import { examples } from "./examples.mjs";
import fixtures from "./fixtures.json" with { type: "json" };
process.stdout.write(renderToStaticMarkup(examples(fixtures, 480)));
`);
  const html = run("node", ["ssr.mjs"], dir, true);
  assert.equal((html.match(/<svg /g) ?? []).length, 6);
  assert.match(html, /data-datum-id="b2"[^>]*height="0"/);
  assert.match(html, /data-cell-id="missing"/);
  writeFileSync(join(dir, "check.ts"), `
import { type LineInput, DmVizLineChart } from "@duskmoon-dev/visualization";
import { layoutXY } from "@duskmoon-dev/visualization-core";
const chart: LineInput = { kind: "line", xAxis: { type: "time" }, yAxis: { type: "numeric" }, series: [] };
layoutXY(chart);
DmVizLineChart({ chart, width: 480 });
`);
  run("node", ["node_modules/typescript/bin/tsc", "--strict", "--target", "ES2022",
    "--module", "NodeNext", "--noEmit", "check.ts"], dir);
  if (mode === "--no-browser") return;

  writeFileSync(join(dir, "client.mjs"), `
import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { examples } from "./examples.mjs";
import fixtures from "./fixtures.json";
const root = createRoot(document.getElementById("mount"));
window.chartEvents = [];
root.render(createElement(StrictMode, null, examples(fixtures, undefined, (event) => window.chartEvents.push(event))));
window.unmountCharts = () => root.unmount();
`);
  run("bun", ["build", "client.mjs", "--target=browser", "--outfile=client.js"], dir);
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ hasTouch: true });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("http://visualization.local/**", (route) => {
      if (new URL(route.request().url()).pathname === "/client.js") {
        return route.fulfill({ path: join(dir, "client.js"), contentType: "text/javascript" });
      }
      return route.fulfill({ contentType: "text/html", body:
        '<!doctype html><meta charset="UTF-8"><div id="mount"></div><script type="module" src="/client.js"></script>' });
    });
    await page.goto("http://visualization.local/", { waitUntil: "networkidle" });
    const line = page.getByRole("img", { name: "Gapped line" });
    const bars = page.getByRole("img", { name: "Grouped bars" });
    const scatter = page.getByRole("img", { name: "Missing coordinates" });
    const heatmap = page.getByRole("img", { name: "Ordered heatmap" });
    await heatmap.waitFor();
    assert.equal(await line.locator("[data-series-id] > path").count(), 2);
    assert.equal(await bars.locator('rect[data-datum-id="b2"]').getAttribute("height"), "0");
    assert.equal(await bars.locator('rect[data-datum-id="a1"]').getAttribute("height"), "192");
    assert.equal(await scatter.locator('g[data-datum-id="p"] circle').getAttribute("r"), "4");
    const missing = heatmap.locator('g[data-cell-id="missing"] rect');
    assert.equal(await missing.evaluate((element) => getComputedStyle(element).fill), "rgb(18, 52, 86)");
    const events = () => page.evaluate(() => window.chartEvents);
    const clearEvents = () => page.evaluate(() => { window.chartEvents.length = 0; });
    const zero = bars.locator('rect[data-datum-id="b2"]');
    await bars.scrollIntoViewIfNeeded();
    const zeroBounds = await zero.boundingBox();
    assert(zeroBounds);
    await clearEvents();
    await page.mouse.move(zeroBounds.x + zeroBounds.width / 2, zeroBounds.y + 1);
    await page.mouse.click(zeroBounds.x + zeroBounds.width / 2, zeroBounds.y + 1);
    assert((await events()).some((event) => event.type === "tooltip" &&
      event.target.datumId === "b2" && event.raw.y === 0));
    assert((await events()).some((event) => event.type === "selection" && event.ids[0]?.datumId === "b2"));

    await page.getByRole("figure", { name: "Grouped bars" })
      .getByRole("button", { name: "Clear selection" }).click();
    await clearEvents();
    await bars.scrollIntoViewIfNeeded();
    const touchBounds = await zero.boundingBox();
    assert(touchBounds);
    await page.touchscreen.tap(touchBounds.x + touchBounds.width / 2, touchBounds.y + 1);
    assert((await events()).some((event) => event.type === "selection" && event.ids[0]?.datumId === "b2"));

    const linePlot = line.locator("[data-plot-interaction]");
    await linePlot.scrollIntoViewIfNeeded();
    await clearEvents();
    await linePlot.press("ArrowRight");
    await linePlot.press("Enter");
    assert((await events()).some((event) => event.type === "selection" && event.ids[0]?.datumId === "second"));
    await linePlot.press("=");
    assert((await events()).some((event) => event.type === "viewport" && event.viewport.kind === "line"));
    const lineBounds = await linePlot.boundingBox();
    assert(lineBounds);
    await clearEvents();
    await page.mouse.move(lineBounds.x + lineBounds.width * .25, lineBounds.y + 40);
    await page.mouse.down();
    await page.mouse.move(lineBounds.x + lineBounds.width * .75, lineBounds.y + 40, { steps: 5 });
    await page.mouse.up();
    assert((await events()).some((event) => event.type === "brush" && event.range[0] < event.range[1]));
    assert(!(await events()).some((event) => event.type === "selection"));
    await line.locator("..").locator("..").getByRole("button", { name: "a", exact: true }).click();
    assert((await events()).some((event) => event.type === "visibility" && event.visible === false));
    const map = page.getByRole("img", { name: "Mercator map" });
    await map.scrollIntoViewIfNeeded();
    const mapBounds = await map.boundingBox();
    assert(mapBounds);
    await clearEvents();
    await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    assert(!(await events()).some((event) => event.type === "selection"));
    const marker = await map.locator('circle[data-feature-id="marker"]').boundingBox();
    assert(marker);
    await page.mouse.click(marker.x + marker.width / 2, marker.y + marker.height / 2);
    assert((await events()).some((event) =>
      event.type === "selection" && event.ids[0]?.kind === "feature" && event.ids[0]?.id === "marker"));

    const network = page.getByRole("img", { name: "Fixed network" });
    await network.scrollIntoViewIfNeeded();
    await page.getByRole("figure", { name: "Fixed network" })
      .getByRole("button", { name: "Zoom out" }).click();
    await network.scrollIntoViewIfNeeded();
    const node = await network.locator('[data-node-id="west"] circle').boundingBox();
    assert(node);
    await clearEvents();
    await page.mouse.move(node.x + node.width / 2, node.y + node.height / 2);
    await page.mouse.down();
    await page.mouse.move(node.x + node.width / 2 + 75, node.y + node.height / 2 + 75, { steps: 5 });
    await page.mouse.up();
    const moved = (await events()).find((event) => event.type === "nodeMove");
    assert.equal(moved?.id, "west");
    assert(Math.abs(moved.position[0] - 4) < 1e-9 && Math.abs(moved.position[1] - 4) < 1e-9);
    await page.locator("main").evaluate((element) => { element.style.width = "320px"; });
    await page.waitForFunction(() => document.querySelector("svg")?.getAttribute("width") === "320");
    await page.locator("main").evaluate((element) => { element.style.display = "none"; });
    await page.waitForFunction(() => !document.querySelector("svg"));
    await page.locator("main").evaluate((element) => { element.style.display = ""; });
    await heatmap.waitFor();
    await page.evaluate(() => window.unmountCharts());
    await page.waitForFunction(() => !document.querySelector("svg"));
    assert.deepEqual(errors, []);
    console.log("Isolated visualization tarballs: SSR, types, Chromium hit testing, keyboard, touch, brush, resize and unmount passed");
  } finally {
    await browser.close();
  }
}

async function verifyNative() {
  const dir = install("phoenix-native", ["@duskmoon-dev/core", "duskmoon_phoenix"], {
    phoenix: storybook.dependencies.phoenix,
    phoenix_live_view: storybook.dependencies.phoenix_live_view,
  });
  assert(!installedPaths(dir).some((path) =>
    /node_modules\/(?:react(?:-dom)?(?:$|\/)|@duskmoon-dev\/(?:el-|elements|art-elements|components|art-components|code-engine))/.test(path)),
    "Native Phoenix installed an enhancement runtime");
  for (const file of ["app.js", "mix.exs", "consumer.exs"]) {
    cpSync(join(root, "validation/phoenix-native", file), join(dir, file));
  }
  const packageDir = join(dir, "hex-package");
  mkdirSync(packageDir);
  run("tar", ["-xf", join(artifactDir, hex.file), "-C", packageDir], dir);
  run("tar", ["-xzf", join(packageDir, "contents.tar.gz"), "-C", packageDir], dir);

  mkdirSync(join(dir, "public"));
  run("bun", ["build", "app.js", "--target=browser", "--minify", "--outdir=public"], dir);
  assert.doesNotMatch(readFileSync(join(dir, "public/app.js"), "utf8"),
    /@duskmoon-dev\/(?:el-|elements|art-elements|components|code-engine)|react-dom|customElements\.define\(["']el-dm-/);
  const css = run("node", ["--input-type=module", "-e",
    'console.log(import.meta.resolve("duskmoon_phoenix/css"))'], dir, true).trim();
  cpSync(fileURLToPath(css), join(dir, "public/app.css"));
  for (const spec of ["duskmoon_phoenix/svg/mdi/home.svg", "duskmoon_phoenix/svg/bsi/house.svg"]) {
    const icon = run("node", ["--input-type=module", "-e",
      "console.log(import.meta.resolve(process.argv[1]))", spec], dir, true).trim();
    assert.match(readFileSync(fileURLToPath(icon), "utf8"), /<svg\b/);
  }

  run("mix", ["deps.get"], dir);
  run("mix", ["compile", "--warnings-as-errors"], dir);
  const portServer = createServer();
  await new Promise((ok) => portServer.listen(0, "127.0.0.1", ok));
  const { port } = portServer.address();
  await new Promise((ok) => portServer.close(ok));
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn("mix", ["run", "consumer.exs"], { cwd: dir, env: { ...env, PORT: String(port) }, stdio: "inherit" });
  const exit = new Promise((ok) => server.once("close", ok));
  try {
    let response;
    for (let i = 0; i < 60 && !response && server.exitCode === null; i++) {
      try { response = await fetch(origin); } catch { await delay(250); }
    }
    assert(response?.ok, "Native consumer did not render");
    const html = await response.text();
    assert.match(html, /<button[^>]*id="save"/);
    assert.match(html, /<svg[^>]*id="staged-icon"/);
    assert.doesNotMatch(html, /<el-dm-/);
    assert.match(await (await fetch(origin + "/assets/app.css")).text(), /\.btn[\s{,.:]/);
    console.log(`Staged native Phoenix consumer at ${origin}`);
    if (mode === "--serve-native") {
      await Promise.race([new Promise((ok) => process.once("SIGINT", ok)), exit]);
    } else if (mode !== "--no-browser") {
      const { chromium } = await import("@playwright/test");
      const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
      try {
        const page = await browser.newPage();
        const requests = [];
        page.on("request", (request) => requests.push(request.url()));
        await page.goto(origin);
        await page.waitForSelector(".phx-connected");
        await page.click("#click");
        await page.waitForFunction(() => document.querySelector("#counts").textContent === "1/0");
        await page.click("#save");
        assert.equal(await page.textContent("#counts"), "1/0", "Required field blocks submission");
        await page.fill("#entry", "Duskmoon");
        await page.click("#save");
        await page.waitForFunction(() => document.querySelector("#counts").textContent === "1/1");
        const payload = JSON.parse(await page.textContent("#payload"));
        assert.deepEqual(payload.sample, { name: "Duskmoon" });
        assert.equal(payload.commit, "publish");
        await page.waitForTimeout(150);
        assert.equal(await page.textContent("#counts"), "1/1");
        assert.deepEqual(requests.sort(), [origin + "/", origin + "/assets/app.css", origin + "/assets/app.js"].sort());
        console.log("Chrome verified native submission/submitter, payload counts and startup requests");
      } finally {
        await browser.close();
      }
    }
  } finally {
    if (server.exitCode === null) server.kill("SIGTERM");
    await exit;
  }
}

try {
  if (mode === undefined || mode === "--no-browser" || mode === "--react-only") verifyReact();
  if (mode === undefined || mode === "--no-browser" || mode === "--visualization-only") await verifyVisualization();
  if (mode === undefined || mode === "--no-browser" || mode === "--engine-only" || mode === "--serve-engine") {
    await verifyCodeEngine();
  }
  if (mode === undefined || mode === "--no-browser") {
    install("all-web-packages", [...npm.keys()]);
    console.log(`One clean install resolved all ${npm.size} exact npm tarballs`);
    run("bun", [
      "scripts/js/check-composer-package.ts",
      "--artifact", join(artifactDir, npm.get("@duskmoon-dev/components").file),
      "--core", join(artifactDir, npm.get("@duskmoon-dev/core").file),
      "--phoenix", join(artifactDir, npm.get("duskmoon_phoenix").file),
    ], root);
  }
  if (mode === undefined || mode === "--no-browser" || mode === "--serve-native") await verifyNative();
  if (mode === undefined || mode === "--no-browser" || mode === "--yew-only") verifyYew();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
