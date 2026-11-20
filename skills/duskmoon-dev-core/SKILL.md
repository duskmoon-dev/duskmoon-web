---
name: duskmoon-dev-core
description: Set up and use the Duskmoon Core CSS package in Tailwind v4 or plain HTML, including themes, component CSS imports, native interaction markup, and optional effects.
---

# Duskmoon Core CSS

Use `@duskmoon-dev/core` for the shared CSS classes and semantic theme tokens. The application or browser owns interaction state. Choose a published Web version and match it across Duskmoon packages. During a release candidate series, resolve npm's `rc` tag and pin the version for reproducible installs.

## Load CSS

The complete Core bundle can be imported after Tailwind CSS v4.

```css
@import "tailwindcss";
@import "@duskmoon-dev/core";
```

In a selective build, register Tailwind tokens with the plugin and import the required styles and themes.

```css
@import "tailwindcss";
@import "@duskmoon-dev/core/base.css";
@import "@duskmoon-dev/core/themes/sunshine";
@import "@duskmoon-dev/core/components/button.css";
@plugin "@duskmoon-dev/core/plugin";
```

`@duskmoon-dev/core/components` loads the component barrel. `@duskmoon-dev/core/standalone.css` provides prebuilt CSS for a page without a Tailwind build. Optional effects use `@duskmoon-dev/core/effects.css` or a leaf such as `@duskmoon-dev/core/effects/aura.css`.

An extensionless component module such as `@duskmoon-dev/core/components/button` supplies `css` text and `styles`, a constructable stylesheet when available. Use the `.css` entry in CSS imports. Read the [component catalog](references/components.md) for class names and component composition.

## Apply themes and behavior

Set `data-theme` on the document root. The built-in Core themes are `sunshine`, `moonlight`, `ocean`, and `forest`. Import only the themes needed by the app and use role pairs such as `bg-surface-container text-on-surface`.

```html
<section class="bg-surface-container text-on-surface">
  <button type="button" class="btn btn-primary">Save</button>
</section>
```

Use matching native controls for form and overlay styles. For a popover, pair `popovertarget` with a unique `id` on the popover. Actual open, checked, selected, and disabled states should agree with the ARIA and visible state. For controlled composites, use the component's documented markup and implement keyboard navigation and focus with the state owner.

See the [released Core documentation](https://github.com/duskmoon-dev/duskmoon-web/tree/v2.0.0-rc.2/packages/css/core) for exports and the [Web docs](https://duskmoon-dev.github.io/duskmoon-web/) for live examples.
