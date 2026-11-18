import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compile } from 'tailwindcss';
import { buildStandaloneBundles } from '../../scripts/build-standalone';

const bundleNames = ['duskmoonui.js', 'duskmoonui.mjs', 'duskmoonui.css', 'duskmoonui-themes.css'];
const developerGuide = join(import.meta.dir, '../../../../../docs/reference/css/development.md');

describe('Standalone release bundles', () => {
  let fixtureDir: string;
  let outputDir: string;

  beforeAll(async () => {
    fixtureDir = await mkdtemp(join(tmpdir(), 'duskmoonui-standalone-'));
    const buildDir = join(fixtureDir, 'build');
    outputDir = join(fixtureDir, 'consumer');
    await buildStandaloneBundles(buildDir);
    // Load the packaged files from a fresh directory instead of Bun's cached
    // bundler output directory, which may still have its pre-build entries.
    await cp(buildDir, outputDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(fixtureDir, { recursive: true, force: true });
  });

  it('builds every release asset', async () => {
    const assets = await Promise.all(
      bundleNames.map((name) => readFile(join(outputDir, name), 'utf8')),
    );

    for (const asset of assets) {
      expect(asset.length).toBeGreaterThan(0);
    }
  });

  it('builds CommonJS and ESM plugin bundles without runtime dependencies', async () => {
    const contents = await Promise.all(
      ['duskmoonui.js', 'duskmoonui.mjs'].map((name) => readFile(join(outputDir, name), 'utf8')),
    );

    for (const content of contents) {
      expect(content).toContain('@license MIT');
      expect(content).not.toMatch(/from\s+["'](?:tailwindcss|postcss|postcss-js)/);
      expect(content).not.toMatch(/require\(["'](?:tailwindcss|postcss|postcss-js)/);
    }
  });

  it('loads the standalone plugin and preserves its Tailwind configuration', async () => {
    const pluginBundle = await import(join(outputDir, 'duskmoonui.mjs'));
    const utilities: Record<string, (value: string) => Record<string, string>> = {};
    const baseRules: Record<string, unknown>[] = [];
    const componentRules: Record<string, unknown>[] = [];
    const staticUtilities: Record<string, unknown>[] = [];

    pluginBundle.default.handler({
      addBase(value: Record<string, unknown>) {
        baseRules.push(value);
      },
      addComponents(value: Record<string, unknown>) {
        componentRules.push(value);
      },
      addUtilities(value: Record<string, unknown>) {
        staticUtilities.push(value);
      },
      matchUtilities(value: typeof utilities) {
        Object.assign(utilities, value);
      },
      theme() {
        return {};
      },
    });

    expect(pluginBundle.default.config.theme.extend.colors.primary).toBe('var(--color-primary)');
    expect(utilities['grid-cols-auto-fill']('12rem')).toEqual({
      'grid-template-columns': 'repeat(auto-fill, minmax(min(12rem, 100%), 1fr))',
    });
    expect(utilities['grid-cols-auto-fit']('12rem')).toEqual({
      'grid-template-columns': 'repeat(auto-fit, minmax(min(12rem, 100%), 1fr))',
    });
    expect(JSON.stringify(baseRules)).toContain('[data-theme=\\"sunshine\\"]');
    expect(JSON.stringify(componentRules)).toContain('.btn');
    expect(JSON.stringify(componentRules)).toContain('.art-moon');
    expect(JSON.stringify(staticUtilities)).toContain('.sr-only');

    const require = createRequire(import.meta.url);
    const commonJsPlugin = require(join(outputDir, 'duskmoonui.js'));
    expect(commonJsPlugin.default.config.theme.extend.colors.primary).toBe('var(--color-primary)');
    expect(typeof commonJsPlugin.default.handler).toBe('function');
  });

  it('compiles Core, CSS Art, themes, and utilities from the plugin alone', async () => {
    const pluginPath = join(outputDir, 'duskmoonui.mjs');
    const pluginBundle = await import(pluginPath);
    const compiler = await compile('@plugin "duskmoonui";\n@tailwind utilities;', {
      base: outputDir,
      async loadModule() {
        return {
          base: outputDir,
          module: pluginBundle.default,
          path: pluginPath,
        };
      },
    });
    const css = compiler.build([
      'btn',
      'btn-primary',
      'tree-select',
      'markdown-body',
      'circle-menu',
      'dropdown',
      'fab',
      'swap',
      'sign-page',
      'home-page',
      'console-page',
      'indicator',
      'join',
      'stack',
      'hero',
      'footer',
      'sidebar-layout',
      'mask',
      'tabs',
      'link',
      'megamenu',
      'art-moon',
      'art-plasma-ball',
      'art-circular-gallery',
      'art-gemini-input',
      'bg-primary',
      'sr-only',
      'rounded-box',
      'shadow-elevation-1',
      'grid-cols-auto-fill-4',
    ]);

    for (const expected of [
      '.btn',
      '.btn-primary',
      '.tree-select',
      '.markdown-body',
      '.circle-menu',
      '.dropdown',
      '.fab',
      '.swap',
      '.sign-page',
      '.home-page',
      '.console-page',
      '.indicator',
      '.join',
      '.stack',
      '.hero',
      '.footer',
      '.sidebar-layout',
      '.mask',
      '.tabs',
      '.link',
      '.megamenu',
      '.art-moon',
      '.art-plasma-ball',
      '.art-circular-gallery',
      '.art-gemini-input',
      '.bg-primary',
      '.sr-only',
      '.rounded-box',
      '.shadow-elevation-1',
      '.grid-cols-auto-fill-4',
      '[data-theme="sunshine"]',
      '@property --art-circular-gallery-rotation',
      '@property --art-gemini-input-rotation',
      '@keyframes btn-spin',
      '@keyframes art-moon-pulse',
      '@keyframes art-gemini-input-rotate',
      'anchor-name: --art-circular-gallery-center',
      '@starting-style',
    ]) {
      expect(css).toContain(expected);
    }
    expect(css).not.toMatch(/^\s*\.card\s*\{/m);
    expect(css).not.toMatch(/^\s*\.art-atom\s*\{/m);
  });

  it('inlines every built-in theme into one CSS asset', async () => {
    const themesCss = await readFile(join(outputDir, 'duskmoonui-themes.css'), 'utf8');

    expect(themesCss).not.toMatch(/^\s*@import\s/m);
    expect(themesCss).toContain(':root {');
    expect(themesCss).toContain(':root:not([data-theme])');
    expect(themesCss).toContain('[data-theme="sunshine"]');
    expect(themesCss).toContain('[data-theme="moonlight"]');
    expect(themesCss).toContain('[data-theme="ocean"]');
    expect(themesCss).toContain('[data-theme="forest"]');
    expect(themesCss).toContain('--spacing-24: 96px');
  });

  it('combines Core and CSS Art in the complete stylesheet', async () => {
    const bundleCss = await readFile(join(outputDir, 'duskmoonui.css'), 'utf8');

    expect(bundleCss).not.toMatch(/^\s*@import\s/m);
    expect(bundleCss).toContain('@duskmoon-dev/core');
    expect(bundleCss).toContain('@duskmoon-dev/css-art');
    expect(bundleCss).toContain('.btn {');
    expect(bundleCss).toContain('.dropdown {');
    expect(bundleCss).toContain('.fab {');
    expect(bundleCss).toContain('.swap {');
    expect(bundleCss).toContain('.sidebar-layout {');
    expect(bundleCss).toContain('.mask-circle {');
    expect(bundleCss).toContain('.art-moon {');
    expect(bundleCss).toContain('.art-atom {');
  });

  it('documents plugin-only standalone usage', async () => {
    const guide = (await readFile(developerGuide, 'utf8')).split('## Standalone plugin')[1];
    const tailwindImport = guide.indexOf('@import "tailwindcss";');
    const sourceExclusion = guide.indexOf('@source not "./duskmoonui{,*}.mjs";');
    const duskmoonPlugin = guide.indexOf('@plugin "./duskmoonui.mjs";');

    expect(tailwindImport).toBeGreaterThan(-1);
    expect(sourceExclusion).toBeGreaterThan(tailwindImport);
    expect(duskmoonPlugin).toBeGreaterThan(sourceExclusion);
    expect(guide.slice(tailwindImport, duskmoonPlugin)).not.toContain('@import "./duskmoonui.css";');
  });
});
