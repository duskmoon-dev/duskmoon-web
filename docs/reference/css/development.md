# DuskMoonUI Development Guide

This guide originated in the source repository. Use the current [workspace commands](../../js-workspace.md) and coordinated Web release instructions. The package names are unchanged.

> Material Design 3-inspired CSS component library for Tailwind CSS v4

## Packages

- `@duskmoon-dev/core` provides tokens, four themes, utilities, 85 component styles, optional effects, and the Tailwind plugin.
- `@duskmoon-dev/css-art` provides 15 CSS illustrations and animated scenes.
- `@duskmoon-dev/design` provides the YAML token source and multi-target code generator used by Core.
- `@duskmoon-dev/docs` is the Astro documentation site and consumes the published package contracts.

The core component modules are also consumed by [duskmoon-elements](https://github.com/duskmoon-dev/duskmoon-elements). Each component has a source stylesheet in `packages/css/core/src/components/`, a built CSS file, and a JavaScript module whose named `css` export contains the stylesheet text.

## Core Component Inventory

The filename in parentheses is also the individual export name: `@duskmoon-dev/core/components/{name}` for JavaScript or `@duskmoon-dev/core/components/{name}.css` for CSS.

| Category | Components |
| --- | --- |
| Actions | Button (`button`), Circle Menu (`circle-menu`), Dropdown (`dropdown`), FAB / Speed Dial (`fab`), Swap (`swap`), Theme Controller (`theme-controller`), Toggle Button (`toggle`) |
| Data entry | Autocomplete (`autocomplete`), Cascader (`cascader`), Checkbox (`checkbox`), Datepicker (`datepicker`), File Input (`file-input`), File Upload (`file-upload`), Filter Group (`filter-group`), Form compatibility bundle (`form`), Form Group (`form-group`), Input (`input`), Multi-Select (`multi-select`), OTP Input (`otp-input`, including masked PIN entry), Radio (`radio`), Range (`range`), Rating (`rating`), Segment Control (`segment-control`), Select (`select`), Slider (`slider`), Switch (`switch`), Textarea (`textarea`), Time Input (`time-input`), Toggle Switch (`toggle-switch`), Tree Select (`tree-select`), Validator (`validator`) |
| Data display | Avatar (`avatar`), Badge (`badge`), Card (`card`), Carousel (`carousel`), Chat (`chat`), Chip (`chip`), Code Block (`code-block`), Countdown (`countdown`), Diff (`diff`), Indicator (`indicator`), Keyboard Key (`kbd`), List (`list`), Loading (`loading`), Mask (`mask`), Progress (`progress`), Radial Progress (`radial-progress`), Skeleton (`skeleton`), Stat (`stat`), Table (`table`), Timeline (`timeline`) |
| Feedback and overlays | Alert (`alert`), Bottom Sheet (`bottomsheet`), Collapse (`collapse`), Dialog (`dialog`), Drawer (`drawer`), Modal (`modal`), Popover (`popover`), Snackbar (`snackbar`), Toast (`toast`), Tooltip (`tooltip`) |
| Navigation | Bottom Navigation (`bottom-navigation`), Breadcrumbs (`breadcrumbs`), Link (`link`), Megamenu (`megamenu`), Menu (`menu`), Navbar (`navbar`), Navigation compatibility bundle (`navigation`), Nested Menu (`nested-menu`), Pagination (`pagination`), Stepper (`stepper`), Tabs (`tabs`) |
| Layout and pages | Accordion (`accordion`), App Bar (`appbar`), Console Page (`console-page`), Divider (`divider`), Footer (`footer`), Hero (`hero`), Home Page (`home-page`), Join (`join`), Markdown Body (`markdown-body`), Sidebar Layout (`sidebar-layout`), Sign Page (`sign-page`), Stack (`stack`) |

`form` and `navigation` are compatibility aggregates which import their canonical component styles. New code may import the narrower component entry points.
`packages/css/core/src/components/index.css` is the aggregate source barrel and is published as `@duskmoon-dev/core/components`; it is not counted as a separate component.

## Installation and Setup

```bash
bun add @duskmoon-dev/core tailwindcss@^4.0.0
# or: npm install @duskmoon-dev/core tailwindcss@^4.0.0
# or: pnpm add @duskmoon-dev/core tailwindcss@^4.0.0
```

Import the complete CSS bundle:

```css
@import "tailwindcss";
@import "@duskmoon-dev/core";
```

The plugin entry point registers the design tokens but does not inject component styles:

```css
@import "tailwindcss";
@plugin "@duskmoon-dev/core/plugin";
@import "@duskmoon-dev/core/components/button.css";
```

Other public CSS entry points are `base.css`, `components`, `standalone.css`, `effects.css`, and `effects/{name}.css`. Themes can be imported from `themes/sunshine`, `themes/moonlight`, `themes/ocean`, and `themes/forest`.

```html
<html data-theme="sunshine">
```

## Individual Component Styles

CSS consumers use the `.css` wildcard export:

```css
@import "@duskmoon-dev/core/components/card.css";
@import "@duskmoon-dev/core/components/tree-select.css";
```

JavaScript and custom-element consumers use the extensionless module:

```javascript
import { css as cardCSS } from "@duskmoon-dev/core/components/card";
```

The module also exposes a nullable constructable stylesheet. Server-side environments receive `null`; feature-detect it before adopting it into a shadow root.

## Utilities

The auto-fill and auto-fit utilities accept any positive integer. The value is multiplied by Tailwind's `0.25rem` spacing unit and capped at the container width.

```html
<div class="grid grid-cols-auto-fill-48 gap-4">...</div>
<div class="grid grid-cols-auto-fit-72 gap-4">...</div>
```

Use `sr-only` for visually hidden accessible text and `not-sr-only` to restore normal layout, commonly as `focus:not-sr-only` on skip links.

## Themes and Tokens

Theme authors edit the YAML tokens under `packages/design/tokens/`. Core copies their generated browser CSS into `packages/css/core/src/themes/generated/`. The published themes are:

- `sunshine` — light default
- `moonlight` — dark default
- `ocean`
- `forest`

The base color contract currently contains 61 `--color-*` tokens, including primary, secondary, tertiary, semantic, outline, inverse, scrim, shadow, and surface-container roles. Prefer semantic roles instead of literal colors.

```css
.custom-panel {
  color: var(--color-on-surface);
  background: var(--color-surface-container);
  border-color: var(--color-outline-variant);
}
```

Each generated theme file contains its `[data-theme]` block and must not be edited directly. `packages/css/core/src/themes/defaults.css` separately provides the root `sunshine` fallback and the preferred-dark `moonlight` fallback. Regenerate theme output from the design-token source instead of hand-editing either copy.

## Native Interaction Contracts

Core supplies presentation, not application state. Prefer native browser state where the component contract supports it:

- Popover-based surfaces use `popover`, `popovertarget`, `:popover-open`, and CSS Anchor Positioning.
- Modal dialogs use `<dialog>` and `showModal()` or declarative invoker commands where supported.
- Accordions and collapses support native `details[open]`; controlled aliases remain available for application adapters.
- Autocomplete, Cascader, Datepicker, Multi-Select, Tree Select, and similar composite inputs need an application controller for filtering, selection, value synchronization, and ARIA state unless a native alternative is documented.

Do not treat the old project-wide browser list as a guarantee. Compatibility is feature-specific: for example, Popover and CSS Anchor Positioning have newer baselines than ordinary component CSS. Each component page documents its required platform features and fallback behavior.

## Development Commands

Run these from the repository root unless a `cd` is shown.

```bash
bun run --filter @duskmoon-dev/css-docs dev
bun run build:packages @duskmoon-dev/core
bun run build:apps @duskmoon-dev/css-docs

cd packages/css/core
bun run test:unit
bun run test:visual
bun run test:integration
bun run test:native-overlays
bun run test:data-display
bun run test:data-input
bun run test:a11y
bun run test:all

cd ../css-art
bun run test:unit

cd ../../../apps/css-docs
bun run test:ui
```

## Build Architecture

`packages/css/core/scripts/build-css.ts` recursively resolves source imports, produces the complete and standalone bundles, copies component and theme CSS, and generates ESM modules and declarations. Component styles live in `@layer components`; CSS Art uses `@layer css-art`.

```text
packages/css/
├── core/         # theme and component styles, exports and standalone builds
└── css-art/      # CSS illustrations
apps/css-docs/   # multilingual documentation
```

## Adding or Changing a Component

1. Add or update the canonical stylesheet in `packages/css/core/src/components/`.
2. Keep the base class, semantic variants, logical properties, focus treatment, RTL behavior, reduced-motion behavior, and native interaction contract consistent with sibling components.
3. Export new components through the build/package map and the component barrel.
4. Add focused unit tests and, where interaction or layout is involved, the appropriate browser test.
5. Add or update the English component page and navigation metadata; mirror translated pages when required by the change.
6. Run the scoped tests, `bun run --filter @duskmoon-dev/core typecheck`, and the relevant package/docs build.
7. Update this guide and the consumer skill when the public contract changes.

## License

MIT License — see `LICENSE`.


## Standalone plugin

The Core tarball includes standalone files under `dist/standalone`. To use
the standalone plugin from a Tailwind CSS build without also importing its
prebuilt styles, copy `duskmoonui.mjs` next to your input CSS and add:

```css
@import "tailwindcss";
@source not "./duskmoonui{,*}.mjs";
@plugin "./duskmoonui.mjs";
```

For direct stylesheet consumption, import `@duskmoon-dev/core/standalone.css`.
