import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const [output, mode] = process.argv.slice(2);
assert(output, "Usage: node scripts/verify-consumers.mjs ARTIFACTS [--react-only|--serve-native|--no-browser]");
assert([undefined, "--react-only", "--serve-native", "--no-browser"].includes(mode), "Unknown consumer mode");
const artifactDir = resolve(output);
const { artifacts } = JSON.parse(readFileSync(join(artifactDir, "release.json"), "utf8"));
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

async function verifyNative() {
  const dir = install("phoenix-native", ["@duskmoon-dev/core", "duskmoon_phoenix"], {
    phoenix: storybook.dependencies.phoenix,
    phoenix_live_view: storybook.dependencies.phoenix_live_view,
  });
  assert(!installedPaths(dir).some((path) =>
    /node_modules\/(?:react(?:-dom)?(?:$|\/)|@duskmoon-dev\/(?:el-|elements|art-elements|components|art-components))/.test(path)),
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
    /@duskmoon-dev\/(?:el-|elements|art-elements|components)|react-dom|customElements\.define\(["']el-dm-/);
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
  if (mode !== "--serve-native") verifyReact();
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
  if (mode !== "--react-only") await verifyNative();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
