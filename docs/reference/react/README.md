# DuskMoon React

This guide originated in the source repository. Use the current [workspace commands](../../js-workspace.md) and coordinated Web release instructions. The package names are unchanged.

[![CI](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/ci.yml/badge.svg)](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/ci.yml)
[![Deploy Documentation](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/docs.yml/badge.svg)](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/docs.yml)
[![Release](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/release.yml/badge.svg)](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/release.yml)
[![Publish Packages](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/publish-packages.yml/badge.svg)](https://github.com/duskmoon-dev/duskmoon-react/actions/workflows/publish-packages.yml)
[![GitHub Release](https://img.shields.io/github/v/release/duskmoon-dev/duskmoon-react?include_prereleases&sort=semver)](https://github.com/duskmoon-dev/duskmoon-react/releases)
[![npm @duskmoon-dev/components](https://img.shields.io/npm/v/%40duskmoon-dev%2Fcomponents?label=%40duskmoon-dev%2Fcomponents)](https://www.npmjs.com/package/@duskmoon-dev/components)
[![npm @duskmoon-dev/art-components](https://img.shields.io/npm/v/%40duskmoon-dev%2Fart-components?label=%40duskmoon-dev%2Fart-components)](https://www.npmjs.com/package/@duskmoon-dev/art-components)

A React 19+ component library for the DuskMoon design system, built with
TypeScript and Bun.

[Documentation](https://duskmoon-dev.github.io/duskmoon-react/) ·
[@duskmoon-dev/components](https://www.npmjs.com/package/@duskmoon-dev/components) ·
[@duskmoon-dev/art-components](https://www.npmjs.com/package/@duskmoon-dev/art-components)

## Packages

The React workspaces contain two public packages, an Astro documentation site and a framework smoke test.

| Workspace                                              | Description                                                                                                                    |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| [`packages/react/components`](../../../packages/react/components)           | `@duskmoon-dev/components`: 78 standard components, 21 `Dm*` workflow components, theme helpers, class helpers, and utilities. |
| [`packages/react/art-components`](../../../packages/react/art-components)   | `@duskmoon-dev/art-components`: 15 React wrappers for `@duskmoon-dev/css-art` illustrations.                                   |
| [`apps/react-docs`](../../../apps/react-docs)                       | Internal Astro site containing API references, demos, and theme previews; not published to npm.                                |
| [`apps/react-nextjs-smoke`](../../../apps/react-nextjs-smoke) | Internal Next.js 16 smoke app; not published to npm. The fixture uses the public package exports.                 |

## Repository Development

Run commands from the Web repository root with the Bun version listed in the
root manifest.

```sh
bun install --frozen-lockfile
bun run build:packages @duskmoon-dev/components @duskmoon-dev/art-components
bun run test:packages @duskmoon-dev/components @duskmoon-dev/art-components
bun run verify:react-boundary
bun run --filter @duskmoon-dev/react-docs dev
```

The React docs server listens at <http://localhost:4334>. To run the browser
tests, install Chromium with `bun x playwright install chromium`, keep the
docs server running and execute `bun x playwright test --config packages/react/playwright.config.ts`.

## Usage

### Components

Install the component package and its peer dependencies:

```bash
bun add @duskmoon-dev/components @duskmoon-dev/core react react-dom
```

Import the package stylesheet once in your application, then import a
component from its individual subpath:

```tsx
import "@duskmoon-dev/components/styles.css";
import { Button } from "@duskmoon-dev/components/button";

function App() {
  return <Button>Click me</Button>;
}
```

Root imports are also supported, for example
`import { Button, DmTable, ThemeProvider } from "@duskmoon-dev/components"`.

### CSS Art Wrappers

Install the wrapper package and its peer dependencies:

```bash
bun add @duskmoon-dev/art-components @duskmoon-dev/css-art react react-dom
```

```tsx
import "@duskmoon-dev/art-components/styles.css";
import { ArtMoon } from "@duskmoon-dev/art-components";

function ArtDemo() {
  return <ArtMoon crescent glow size="lg" />;
}
```

## Package Compatibility

| Package                        | Required peers                                                           |
| :----------------------------- | :----------------------------------------------------------------------- |
| `@duskmoon-dev/components`     | `@duskmoon-dev/core at the same Web version`, `react >=19.0.0`, `react-dom >=19.0.0`    |
| `@duskmoon-dev/art-components` | `@duskmoon-dev/css-art at the same Web version`, `react >=19.0.0`, `react-dom >=19.0.0` |

Every Web release aligns React Components, React Art, Core and CSS Art to the
same version. Install the matching Core or CSS Art peer. React and ReactDOM
retain their framework peer ranges and use the consumer's runtime.
