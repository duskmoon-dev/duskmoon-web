import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

assert.equal(process.argv.length, 3, "Usage: node storybook.mjs ORIGIN");
const origin = new URL(process.argv[2]).origin;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const scripts = [];
  const failed = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("[Duskmoon] Failed to register")) {
      failed.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.request().resourceType() !== "script") return;
    const url = new URL(response.url());
    if (url.origin === origin) scripts.push(url.pathname);
    if (response.status() >= 400) failed.push(response.url());
  });
  page.on("requestfailed", (request) => {
    if (request.resourceType() === "script") failed.push(request.url());
  });
  page.on("pageerror", (error) => failed.push(String(error)));

  await page.goto(origin);
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => customElements.get("el-dm-code-engine") !== undefined), false);
  const startup = [...scripts];
  const lines = Array.from({ length: 80 }, (_, i) => "const line" + i + " = " + i + ";").join("\n");
  await page.evaluate((value) => {
    const host = document.createElement("el-dm-code-engine");
    host.id = "verify-js";
    host.setAttribute("language", "javascript");
    host.setAttribute("value", value);
    host.style.cssText = "height: 220px; width: 640px;";
    document.body.appendChild(host);
  }, lines);
  await page.waitForFunction(() =>
    [...document.querySelector("#verify-js")?.shadowRoot?.querySelectorAll(".cm-line span") ?? []]
      .some((span) => span.textContent === "const")).catch((error) => {
    throw new Error(`JavaScript syntax unavailable. Requests: ${JSON.stringify(scripts)}. Errors: ${JSON.stringify(failed)}`, { cause: error });
  });
  const jsScripts = scripts.slice(startup.length);
  assert(jsScripts.length > 0, "Editor registration and JavaScript parser must load on demand");
  assert(jsScripts.every((path) => path.startsWith("/assets/js/")), JSON.stringify(jsScripts));

  await page.evaluate(() => {
    const host = document.createElement("el-dm-code-engine");
    host.id = "verify-ex";
    host.setAttribute("language", "elixir");
    host.setAttribute("value", "defmodule Example do\n  def greet, do: :hello\nend");
    document.body.appendChild(host);
  });
  await page.waitForFunction(() =>
    [...document.querySelector("#verify-ex")?.shadowRoot?.querySelectorAll(".cm-line span") ?? []]
      .some((span) => span.textContent === "defmodule")).catch((error) => {
    throw new Error(`Elixir syntax unavailable. Requests: ${JSON.stringify(scripts)}. Errors: ${JSON.stringify(failed)}`, { cause: error });
  });
  const elixirScripts = scripts.slice(startup.length + jsScripts.length);
  assert(elixirScripts.length > 0, "Elixir parser has a production chunk request");
  assert(elixirScripts.every((path) => path.startsWith("/assets/js/")), JSON.stringify(elixirScripts));
  const measurements = await page.evaluate(() =>
    ["#verify-js", "#verify-ex"].map((id) => {
      const host = document.querySelector(id);
      const cm = host.shadowRoot.querySelector(".cm-editor");
      const scroll = cm.querySelector(".cm-scroller");
      scroll.scrollTop = 100;
      return {
        host: host.getBoundingClientRect().height,
        editor: cm.getBoundingClientRect().height,
        scrollHeight: scroll.scrollHeight,
        clientHeight: scroll.clientHeight,
        scrollTop: scroll.scrollTop,
        css: getComputedStyle(cm).position,
        rootPatched: Object.hasOwn(host.shadowRoot, "head"),
        workaroundStyle: Boolean(host.shadowRoot.getElementById("duskmoon-code-engine-layout-workaround")),
      };
    }));
  assert(measurements.every(({ host, editor, css }) => host >= 200 && Math.abs(host - editor) <= 2 && css === "relative"),
    JSON.stringify(measurements));
  assert(measurements.every(({ rootPatched, workaroundStyle }) => !rootPatched && !workaroundStyle));
  assert(measurements[0].scrollHeight > measurements[0].clientHeight);
  assert(measurements[0].scrollTop > 0);

  await page.evaluate(() => {
    const host = document.getElementById("verify-js");
    host.value = "const preserved = 42;";
    host.remove();
    document.body.appendChild(host);
  });
  await page.waitForFunction(() => {
    const host = document.querySelector("#verify-js");
    return host.value === "const preserved = 42;" &&
      host.shadowRoot?.querySelectorAll(".cm-editor").length === 1 &&
      [...host.shadowRoot.querySelectorAll(".cm-line span")].some((span) => span.textContent === "const");
  });

  await page.goto(origin + "/components/data-entry/code-engine");
  await page.waitForFunction(() => document.querySelector("#elixir-editor")?.shadowRoot?.querySelector(".cm-line span"));
  assert.equal(await page.locator("#elixir-editor").getAttribute("name"), "source_ex");
  assert.equal(await page.locator("#bottombar-editor [slot=bottombar]").count(), 1);
  await page.waitForLoadState("networkidle");
  assert.deepEqual(failed, []);
  console.log(`Storybook Chrome passed editor-free startup (${startup.length} scripts), lazy JavaScript/Elixir (${jsScripts.length} and ${elixirScripts.length} requests), sizing, scrolling, remount, and Phoenix markup`);
} finally {
  await browser.close();
}
