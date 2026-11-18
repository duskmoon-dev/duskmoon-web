# DuskMoonUI

This guide originated in the source repository. Use the current [workspace commands](../../js-workspace.md) and coordinated Web release instructions. The package names are unchanged.

> A CSS-only component library for Tailwind CSS v4 with Material Design 3's extended color system

[![CI](https://github.com/duskmoon-dev/duskmoonui/actions/workflows/ci.yml/badge.svg)](https://github.com/duskmoon-dev/duskmoonui/actions/workflows/ci.yml)
[![@duskmoon-dev/core](https://img.shields.io/npm/v/@duskmoon-dev/core)](https://www.npmjs.com/package/@duskmoon-dev/core)
[![@duskmoon-dev/css-art](https://img.shields.io/npm/v/@duskmoon-dev/css-art)](https://www.npmjs.com/package/@duskmoon-dev/css-art)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Extended Color System** - 65+ Material Design 3 color tokens in OKLCH format
- **50+ Components** - Buttons, cards, forms, modals, navigation, and more
- **5 Themes** - Sunshine, Moonlight, Ocean, Forest, Sunset built-in
- **CSS-Only** - No JavaScript runtime, works with any framework
- **Tailwind CSS v4** - Native CSS imports, modern color functions
- **Accessible** - WCAG AA contrast ratios with on-color variants

## Native Overlay Principles

- Tooltips use only the HTML Popover API: `popover="hint"`, `interestfor`, and browser-owned `:popover-open` state.
- Modal and Dialog use only HTML `<dialog>`, opened with `command="show-modal"` / `commandfor` or `showModal()`, and closed with native commands, `close()`, or `method="dialog"`. The browser manages the backdrop, inertness, keyboard focus, and Escape.

Legacy div-based Modal markup, `.modal-open`, `.modal-toggle`, and URL-target visibility are no longer supported. Migrate the outer element to `<dialog>` and use native opening/closing actions; `.modal-box` and presentation modifiers remain available.

## Quick Start

### Installation

```bash
bun add @duskmoon-dev/core tailwindcss@^4.0.0

# or npm
npm install @duskmoon-dev/core tailwindcss@^4.0.0
```

### Setup

Import the library in your CSS file:

#### Option A: CSS `@import` (Recommended)

```css
@import "tailwindcss";
@import "@duskmoon-dev/core";
```

#### Option B: Tailwind `@plugin` Directive

```css
@import "tailwindcss";
@plugin "@duskmoon-dev/core/plugin";
```

The `@plugin` approach registers Material Design 3 color tokens into Tailwind's theme, enabling utility classes like `bg-primary`, `text-on-surface`, etc.

Set the theme in your HTML:

```html
<html data-theme="sunshine">
  <!-- Your app -->
</html>
```

### Usage

Use the component classes:

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary btn-outline">Outlined</button>
<button class="btn btn-tertiary btn-ghost">Ghost</button>

<!-- Cards -->
<div class="card">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content goes here.</p>
  </div>
</div>

<!-- Form inputs -->
<input type="text" class="input" placeholder="Enter text..." />
<input type="text" class="input input-primary" placeholder="Primary input" />
```

Or use the color utilities directly:

```html
<div class="bg-primary text-primary-content">Primary background</div>
<div class="bg-surface-container text-on-surface">Surface container</div>
```

## Components

DuskMoonUI includes 50+ components organized by category:

**Actions:** Button, Dropdown, FAB / Speed Dial, Swap, Theme Controller

**Forms:** Input, Checkbox, Radio, Select, Textarea, Switch, Slider, Autocomplete, Datepicker, File Upload, Rating

**Data Display:** Card, Badge, Avatar, Chip, Table, List, Timeline

**Feedback:** Alert, Dialog, Modal, Toast, Snackbar, Progress, Skeleton, Tooltip

**Navigation:** Navbar, Megamenu, Link, Tabs, Drawer, Breadcrumbs, Pagination, Stepper (Steps), Bottom Navigation (Dock)

**Layout:** Divider, App Bar

**Overlay:** Menu, Popover, Bottom Sheet, Collapse, Accordion

## Built-in Themes

Five themes are included. Apply via `data-theme` on `<html>`:

| Theme | Style | Primary | Secondary | Tertiary |
|-------|-------|---------|-----------|----------|
| `sunshine` | Light | Warm Orange | Pink | Purple |
| `moonlight` | Dark | Soft Blue | Purple | Teal |
| `ocean` | Dark-cool | Cyan | Indigo | Green |
| `forest` | Dark-warm | Green | Amber | Teal |
| `sunset` | Light-warm | Rose | Orange | Gold |

Switch themes dynamically:

```html
<button onclick="document.documentElement.dataset.theme = 'moonlight'">
  Dark Mode
</button>
```

## Color System

DuskMoonUI uses OKLCH color format for perceptually uniform colors. Focus states are generated dynamically using `color-mix()`:

```css
/* Hover states use color-mix() */
.btn-primary:hover {
  background-color: color-mix(in oklch, var(--color-primary), black 10%);
}
```

### Color Tokens

**Brand Colors** (Primary, Secondary, Tertiary):
- `{color}` - Main color
- `{color}-content` - Text on main color
- `{color}-container` - Tinted background
- `on-{color}-container` - Text on container

**Surface Elevation:**
- `surface` - Base surface
- `surface-dim`, `surface-bright` - Dimmed/brightened variants
- `surface-container-{lowest,low,default,high,highest}` - 5 elevation levels
- `on-surface`, `on-surface-variant` - Text colors

**Semantic Colors:**
- `info`, `success`, `warning`, `error` - Status colors
- `{status}-content` - Text on status colors
- `{status}-container`, `on-{status}-container` - Container variants

**Outline:**
- `outline` - Borders and dividers
- `outline-variant` - Subtle borders

## Development

Run these commands from the Web repository root.

```sh
bun install --frozen-lockfile
bun run build:packages @duskmoon-dev/core @duskmoon-dev/css-art
bun run test:packages @duskmoon-dev/core @duskmoon-dev/css-art
bun run --filter @duskmoon-dev/css-docs dev
bun run build:apps @duskmoon-dev/css-docs
```

Core and CSS Art are under [`packages/css`](../../../packages/css). The
multilingual Astro docs are under [`apps/css-docs`](../../../apps/css-docs).
See the [development guide](development.md) for browser test commands.

## Who Uses This

- **[duskmoon-elements](https://github.com/duskmoon-dev/duskmoon-elements)** - Web Components library (`<el-dm-*>`) that adopts `@duskmoon-dev/core` CSS via `CSSStyleSheet`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Material Design 3 for the comprehensive color system
- Tailwind CSS for the utility-first framework
- Bun for the fast JavaScript runtime
