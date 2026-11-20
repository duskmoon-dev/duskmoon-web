import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = dirname(fileURLToPath(import.meta.url));
const html = (body, entry, core = false) => `<!doctype html>
<html lang="en" data-theme="sunshine"><head><meta charset="utf-8">
<link rel="icon" href="data:,">
${core ? '<link rel="stylesheet" href="themes.css">' : ''}
<style>
body { margin: 24px; font: 16px system-ui; }
el-dm-code-engine, #editor { height: 240px; width: 640px; margin-bottom: 20px; }
#editor .cm-editor { height: 100%; }
button { margin-bottom: 16px; }
</style></head><body>${body}<script type="module" src="${entry}"></script></body></html>`;

function build(dir, adapter) {
  const names = adapter ? ['adapter.mjs', 'bootstrap.mjs'] : ['standalone.mjs'];
  for (const file of names) copyFileSync(join(fixtures, file), join(dir, file));
  const publicDir = join(dir, 'browser-public');
  mkdirSync(publicDir, { recursive: true });
  execFileSync('bun', ['build', adapter ? 'adapter.mjs' : 'standalone.mjs',
    '--target=browser', '--format=esm', '--splitting', '--minify',
    '--outdir=browser-public', '--entry-naming=[name].js', '--chunk-naming=chunks/[name]-[hash].[ext]'],
  { cwd: dir, stdio: 'inherit' });
  if (adapter) {
    writeFileSync(join(publicDir, 'bootstrap.js'), readFileSync(join(fixtures, 'bootstrap.mjs'), 'utf8').replace('./adapter.mjs', './adapter.js'));
    const coreCss = join(dir, 'node_modules/@duskmoon-dev/core/dist/standalone/duskmoonui-themes.css');
    assert(existsSync(coreCss), 'Staged Core themes are required for the adapter fixture');
    copyFileSync(coreCss, join(publicDir, 'themes.css'));
    writeFileSync(join(publicDir, 'index.html'), html(`<button id="outside">Outside editor</button>
<main id="editors">
<el-dm-code-engine id="primary" name="sample[source]" language="javascript" theme="duskmoon" show-topbar show-bottombar value="const answer = 42;">
<span slot="topbar">Custom topbar</span><span slot="bottombar">Custom bottom</span>
</el-dm-code-engine>
<el-dm-code-engine id="secondary" language="javascript" theme="duskmoon" value="const second = 2;"></el-dm-code-engine>
</main>`, 'bootstrap.js', true));
    writeFileSync(join(publicDir, 'empty.html'), html('<p>Editor-free page</p>', 'bootstrap.js', true));
  } else {
    writeFileSync(join(publicDir, 'index.html'), html('<button id="outside">Outside editor</button><div id="editor"></div>', 'standalone.js'));
  }
  return publicDir;
}

async function serve(roots) {
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const [consumer, ...parts] = url.pathname.slice(1).split('/');
    const root = roots[consumer];
    const relative = parts.join('/') || 'index.html';
    const file = root && resolve(root, relative);
    if (!root || !file.startsWith(root + '/') || !existsSync(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(readFileSync(file));
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { server, origin };
}

async function ready(page, id = 'primary', expectedLanguage = 'javascript') {
  await page.waitForFunction(({ id, expectedLanguage }) =>
    window.fixture?.snapshot(id).language === expectedLanguage, { id, expectedLanguage });
}

async function standaloneChecks(page, origin) {
  await page.goto(origin + '/standalone/');
  await page.waitForFunction(() => window.fixture?.identity);
  const before = await page.evaluate(() => window.fixture.snapshot());
  assert.equal(before.language, 'javascript');
  assert.match(before.tree, /VariableDeclaration/);
  const content = page.locator('.cm-content');
  await content.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type('standalone');
  await page.waitForFunction(() => window.fixture.snapshot().value.endsWith('standalone'));
  assert(await page.evaluate(() => window.fixture.undo()));
  assert.equal(await page.evaluate(() => window.fixture.snapshot().value), before.value);
  assert(await page.evaluate(() => window.fixture.redo()));
  await page.evaluate(() => window.fixture.configure(true, true));
  assert(await page.evaluate(() => window.fixture.snapshot().readonly));
  assert(['pre-wrap', 'break-spaces'].includes(await content.evaluate((node) => getComputedStyle(node).whiteSpace)));
  const readonlyValue = await page.evaluate(() => window.fixture.snapshot().value);
  await content.click();
  await page.keyboard.type('blocked');
  assert.equal(await page.evaluate(() => window.fixture.snapshot().value), readonlyValue);
  assert.equal(await page.evaluate(() => Boolean(customElements.get('el-dm-code-engine'))), false);
}

async function adapterChecks(page, origin) {
  await page.goto(origin + '/adapter/');
  await ready(page);
  await ready(page, 'secondary');
  const before = await page.evaluate(() => window.fixture.snapshot());
  assert.match(before.tree, /VariableDeclaration/);
  assert.equal(before.editorCount, 1);
  await page.evaluate(() => document.getElementById('secondary').style.height = 'auto');
  const natural = await page.evaluate(() => window.fixture.snapshot('secondary'));
  assert(natural.hostHeight >= 200 && Math.abs(natural.editorHeight - natural.hostHeight) <= 2,
    'Short documents fill the default minimum height without a layout patch');
  assert.equal(await page.locator('#primary [slot="topbar"]').textContent(), 'Custom topbar');
  const content = page.locator('#primary .cm-content');
  await content.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' // edited');
  await page.waitForFunction(() => window.fixture.snapshot().value.endsWith(' // edited'));
  await page.locator('#outside').click();
  const events = await page.evaluate(() => window.fixture.events.filter((event) => event.id === 'primary'));
  assert(events.some((event) => event.type === 'input' && event.composed && event.value.endsWith(' // edited')));
  assert.equal(events.filter((event) => event.type === 'change').length, 1);
  assert.equal(events.at(-1).value, before.value + ' // edited');
  await content.click();
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((value) => window.fixture.snapshot().value === value, before.value);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await page.waitForFunction((value) => window.fixture.snapshot().value === value + ' // edited', before.value);

  await page.evaluate(() => {
    const host = document.getElementById('primary');
    host.value = 'const preserved = 7;';
    host.readonly = true;
    host.wrap = true;
  });
  await page.waitForFunction(() => window.fixture.snapshot().readonly && ['pre-wrap', 'break-spaces'].includes(window.fixture.snapshot().whiteSpace));
  await content.click();
  await page.keyboard.type('blocked');
  assert.equal(await page.evaluate(() => window.fixture.snapshot().value), 'const preserved = 7;');
  await page.evaluate(() => document.getElementById('primary').readonly = false);
  await page.waitForFunction(() => !window.fixture.snapshot().readonly);

  const backgrounds = [];
  for (const theme of ['duskmoon', 'sunshine', 'moonlight', 'one-dark']) {
    await page.evaluate((theme) => {
      document.getElementById('primary').theme = theme;
      document.getElementById('secondary').theme = theme;
    }, theme);
    await page.waitForFunction(() => window.fixture.snapshot().background === window.fixture.snapshot('secondary').background);
    // Allow the reactive configuration microtask to install this theme before reading it.
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const states = await page.evaluate(() => [window.fixture.snapshot(), window.fixture.snapshot('secondary')]);
    for (const state of states) {
      assert.equal(state.position, 'relative', 'Editor base styles must reach every ShadowRoot');
      assert(state.editorHeight > 100 && state.editorHeight <= state.hostHeight + 1, 'Editor fills its bounded host');
      assert.equal(state.editorCount, 1);
    }
    assert.equal(states[0].value, 'const preserved = 7;');
    backgrounds.push(states[0].background);
  }
  assert.equal(new Set(backgrounds).size, 4, 'All four editor themes apply distinct backgrounds');
  await page.evaluate(() => {
    const host = document.getElementById('primary');
    host.theme = 'duskmoon';
    host.style.setProperty('--color-surface', 'rgb(231, 232, 233)');
  });
  await page.waitForFunction(() => window.fixture.snapshot().background === 'rgb(231, 232, 233)');
  await page.evaluate(() => {
    const host = document.getElementById('primary');
    host.style.removeProperty('--color-surface');
    document.documentElement.dataset.theme = 'moonlight';
  });
  await page.waitForFunction((previous) => window.fixture.snapshot().background !== previous, backgrounds[0]);
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('primary')).getPropertyValue('--theme-name').trim()), '"moonlight"');

  await page.evaluate(() => document.getElementById('primary').value = Array.from({ length: 150 }, (_, i) => `const line${i} = ${i};`).join('\n'));
  await page.waitForFunction(() => window.fixture.snapshot().scrollHeight > window.fixture.snapshot().clientHeight);
  await page.evaluate(() => window.fixture.viewFor('primary').scrollDOM.scrollTop = 300);
  assert((await page.evaluate(() => window.fixture.snapshot().scrollTop)) > 0);
  await page.evaluate(() => {
    const host = document.getElementById('primary');
    host.setValue('const retained = 1;');
    host.wrap = false;
  });
  await page.waitForFunction(() => window.fixture.snapshot().whiteSpace === 'pre');
  assert.equal(await page.evaluate(() => document.getElementById('primary').getValue()), 'const retained = 1;');

  await delayedConfiguration(page);
  await page.evaluate(() => {
    const host = document.getElementById('primary');
    host.value = 'defmodule Demo do\n  def answer, do: 42\nend';
    host.language = 'elixir';
  });
  await ready(page, 'primary', 'elixir');
  const elixir = await page.evaluate(() => window.fixture.snapshot());
  assert.match(elixir.tree, /DoBlock|Call/);
  assert(!elixir.tree.includes('⚠'), 'Duskmoon-added Elixir grammar parses the fixture');
  assert(await page.locator('#primary .cm-content span[class]').count() > 0, 'Actual syntax highlighting reaches the rendered document');
}

async function delayedConfiguration(page) {
  let release;
  const blocked = new Promise((ok) => release = ok);
  const pattern = '**/chunks/*.js';
  await page.waitForLoadState('networkidle');
  await page.route(pattern, async (route) => {
    await blocked;
    await route.continue();
  });
  try {
    const [request] = await Promise.all([
      page.waitForRequest(pattern, { timeout: 10000 }),
      page.evaluate(() => document.getElementById('primary').language = 'python'),
    ]);
    await page.evaluate(() => {
      const host = document.getElementById('primary');
      window.fixture.oldView = window.fixture.viewFor('primary');
      host.language = 'javascript';
      host.theme = 'one-dark';
      host.remove();
      host.value = 'const remounted = 42;';
      document.querySelector('#editors').append(host);
    });
    await ready(page);
    release();
    const response = await request.response();
    assert.equal(response?.status(), 200, 'Delayed language chunk resolves at its production URL');
    await response.finished();
    await page.waitForLoadState('networkidle');
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
  const snapshot = await page.evaluate(() => window.fixture.snapshot());
  assert.equal(snapshot.language, 'javascript', 'Stale language loading must preserve the newest configuration');
  assert.equal(snapshot.value, 'const remounted = 42;');
  assert.equal(snapshot.editorCount, 1);
  assert(await page.evaluate(() => !window.fixture.oldView.dom.isConnected), 'Destroyed editor stays detached');
}

export async function verifyCodeEngineBrowser({ standalone, adapter, chromium, mode }) {
  const roots = { standalone: build(standalone, false), adapter: build(adapter, true) };
  const { server, origin } = await serve(roots);
  try {
    console.log(`Packed engine fixtures at ${origin}/standalone/ and ${origin}/adapter/`);
    if (mode === '--serve-engine') {
      await new Promise((ok) => process.once('SIGINT', ok));
      return;
    }
    assert(chromium, 'Chromium is required for packed engine browser checks');
    const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      const failures = [];
      const requests = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', (request) => failures.push(request.url()));
      page.on('request', (request) => requests.push(request.url()));
      await page.goto(origin + '/adapter/empty.html');
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
      assert.deepEqual(requests.map((url) => new URL(url).pathname).sort(),
        ['/adapter/empty.html', '/adapter/bootstrap.js', '/adapter/themes.css'].sort());
      assert.equal(await page.evaluate(() => Boolean(customElements.get('el-dm-code-engine'))), false);
      await standaloneChecks(page, origin);
      await adapterChecks(page, origin);
      assert.deepEqual(errors, [], 'Production editor console and asynchronous errors');
      assert.deepEqual(failures, [], 'Production language and shared chunk requests');
      assert(requests.some((url) => new URL(url).pathname.startsWith('/adapter/chunks/')));
      console.log('Packed Chrome editors passed standalone identity/editing, adapter events/history/configuration, syntax/chunks, themes/ShadowRoots, scrolling, remount/loading and editor-free requests');
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((ok) => server.close(ok));
  }
}
